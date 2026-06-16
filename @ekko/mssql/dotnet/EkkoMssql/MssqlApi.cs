using System;
using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using Microsoft.Data.SqlClient;

public static class MssqlApi
{
    private static readonly ConcurrentDictionary<int, MssqlHandle> _handles = new();
    private static int _nextId = 0;

    private class MssqlHandle
    {
        public SqlConnection Connection { get; }
        public SqlTransaction? Transaction { get; set; }
        public MssqlHandle(SqlConnection conn) { Connection = conn; }
    }

    [UnmanagedCallersOnly(EntryPoint = "mssql_connect")]
    public static unsafe int Connect(IntPtr connStringPtr, int connStringLen)
    {
        try
        {
            var connString = Encoding.UTF8.GetString((byte*)connStringPtr, connStringLen);
            var conn = new SqlConnection(connString);
            conn.Open();
            var id = Interlocked.Increment(ref _nextId);
            _handles[id] = new MssqlHandle(conn);
            return id;
        }
        catch
        {
            return -1;
        }
    }

    [UnmanagedCallersOnly(EntryPoint = "mssql_query")]
    public static unsafe IntPtr Query(int handle, IntPtr sqlPtr, int sqlLen, IntPtr paramsPtr, int paramsLen)
    {
        try
        {
            if (!_handles.TryGetValue(handle, out var h)) return ToCString("{\"columns\":[],\"rows\":[]}");
            var sql = Encoding.UTF8.GetString((byte*)sqlPtr, sqlLen);
            var paramsJson = paramsLen > 0 ? Encoding.UTF8.GetString((byte*)paramsPtr, paramsLen) : "{}";

            using var cmd = new SqlCommand(sql, h.Connection);
            if (h.Transaction != null) cmd.Transaction = h.Transaction;

            BindParams(cmd, paramsJson);
            using var reader = cmd.ExecuteReader();
            return ToCString(SerializeReader(reader));
        }
        catch (Exception ex)
        {
            return ToCString("{\"error\":\"" + EscapeJson(ex.Message) + "\"}");
        }
    }

    private static IntPtr ToCString(string s)
    {
        var bytes = Encoding.UTF8.GetBytes(s + '\0');
        var ptr = Marshal.AllocCoTaskMem(bytes.Length);
        Marshal.Copy(bytes, 0, ptr, bytes.Length);
        return ptr;
    }

    [UnmanagedCallersOnly(EntryPoint = "mssql_exec")]
    public static unsafe int Execute(int handle, IntPtr sqlPtr, int sqlLen, IntPtr paramsPtr, int paramsLen)
    {
        try
        {
            if (!_handles.TryGetValue(handle, out var h)) return -1;
            var sql = Encoding.UTF8.GetString((byte*)sqlPtr, sqlLen);
            var paramsJson = paramsLen > 0 ? Encoding.UTF8.GetString((byte*)paramsPtr, paramsLen) : "{}";

            using var cmd = new SqlCommand(sql, h.Connection);
            if (h.Transaction != null) cmd.Transaction = h.Transaction;

            BindParams(cmd, paramsJson);
            return cmd.ExecuteNonQuery();
        }
        catch
        {
            return -1;
        }
    }

    [UnmanagedCallersOnly(EntryPoint = "mssql_begin")]
    public static int Begin(int handle)
    {
        try
        {
            if (!_handles.TryGetValue(handle, out var h)) return -1;
            h.Transaction = h.Connection.BeginTransaction();
            return 0;
        }
        catch { return -1; }
    }

    [UnmanagedCallersOnly(EntryPoint = "mssql_commit")]
    public static int Commit(int handle)
    {
        try
        {
            if (!_handles.TryGetValue(handle, out var h) || h.Transaction == null) return -1;
            h.Transaction.Commit();
            h.Transaction.Dispose();
            h.Transaction = null;
            return 0;
        }
        catch { return -1; }
    }

    [UnmanagedCallersOnly(EntryPoint = "mssql_rollback")]
    public static int Rollback(int handle)
    {
        try
        {
            if (!_handles.TryGetValue(handle, out var h) || h.Transaction == null) return -1;
            h.Transaction.Rollback();
            h.Transaction.Dispose();
            h.Transaction = null;
            return 0;
        }
        catch { return -1; }
    }

    [UnmanagedCallersOnly(EntryPoint = "mssql_close")]
    public static void Close(int handle)
    {
        if (_handles.TryRemove(handle, out var h))
        {
            h.Transaction?.Dispose();
            h.Connection.Dispose();
        }
    }

    [UnmanagedCallersOnly(EntryPoint = "mssql_free")]
    public static void Free(IntPtr ptr)
    {
        if (ptr != IntPtr.Zero) Marshal.FreeCoTaskMem(ptr);
    }

    private static void BindParams(SqlCommand cmd, string json)
    {
        if (string.IsNullOrEmpty(json) || json == "{}") return;
        var trimmed = json.Trim();
        if (trimmed.Length < 2 || trimmed[0] != '{') return;
        trimmed = trimmed[1..^1];
        if (string.IsNullOrWhiteSpace(trimmed)) return;

        bool inString = false, escaped = false;
        var tokens = new System.Collections.Generic.List<string>();
        var sb = new StringBuilder();
        foreach (var ch in trimmed)
        {
            if (escaped) {
                switch (ch) {
                    case 'n': sb.Append('\n'); break;
                    case 'r': sb.Append('\r'); break;
                    case 't': sb.Append('\t'); break;
                    case '\\': sb.Append('\\'); break;
                    case '"': sb.Append('"'); break;
                    case '/': sb.Append('/'); break;
                    default: sb.Append(ch); break;
                }
                escaped = false; continue;
            }
            if (ch == '\\') { escaped = true; continue; }
            if (ch == '"') { inString = !inString; continue; }
            if ((ch == ',' || ch == ':') && !inString) { tokens.Add(sb.ToString().Trim()); sb.Clear(); continue; }
            sb.Append(ch);
        }
        if (sb.Length > 0) tokens.Add(sb.ToString().Trim());

        for (int i = 0; i + 1 < tokens.Count; i += 2)
        {
            var key = tokens[i];
            var val = tokens[i + 1];
            object? paramVal;
            if (val == "null") paramVal = DBNull.Value;
            else if (val == "true") paramVal = true;
            else if (val == "false") paramVal = false;
            else if (long.TryParse(val, out var lv)) paramVal = lv;
            else if (double.TryParse(val, System.Globalization.NumberStyles.Any, System.Globalization.CultureInfo.InvariantCulture, out var dv)) paramVal = dv;
            else paramVal = val;
            cmd.Parameters.AddWithValue("@" + key, paramVal ?? DBNull.Value);
        }
    }

    private static string SerializeReader(SqlDataReader reader)
    {
        var sb = new StringBuilder();
        sb.Append("{\"columns\":[");
        for (int i = 0; i < reader.FieldCount; i++)
        {
            if (i > 0) sb.Append(',');
            sb.Append('"').Append(EscapeJson(reader.GetName(i))).Append('"');
        }
        sb.Append("],\"rows\":[");
        bool firstRow = true;
        while (reader.Read())
        {
            if (!firstRow) sb.Append(',');
            firstRow = false;
            sb.Append('[');
            for (int i = 0; i < reader.FieldCount; i++)
            {
                if (i > 0) sb.Append(',');
                if (reader.IsDBNull(i)) { sb.Append("null"); continue; }
                var val = reader.GetValue(i);
                switch (val)
                {
                    case byte bv: sb.Append(bv); break;
                    case short sv: sb.Append(sv); break;
                    case int iv: sb.Append(iv); break;
                    case long lv: sb.Append(lv); break;
                    case float fv: sb.Append(fv.ToString(System.Globalization.CultureInfo.InvariantCulture)); break;
                    case double dv: sb.Append(dv.ToString(System.Globalization.CultureInfo.InvariantCulture)); break;
                    case decimal dec: sb.Append(dec.ToString(System.Globalization.CultureInfo.InvariantCulture)); break;
                    case bool bv: sb.Append(bv ? 1 : 0); break;
                    case string sv: sb.Append('"').Append(EscapeJson(sv)).Append('"'); break;
                    case DateTime dt: sb.Append(new DateTimeOffset(dt, TimeSpan.Zero).ToUnixTimeSeconds()); break;
                    default: sb.Append('"').Append(EscapeJson(val.ToString() ?? "")).Append('"'); break;
                }
            }
            sb.Append(']');
        }
        sb.Append("]}");
        return sb.ToString();
    }

    private static string EscapeJson(string s)
    {
        return s.Replace("\\", "\\\\").Replace("\"", "\\\"").Replace("\n", "\\n").Replace("\r", "\\r").Replace("\t", "\\t");
    }
}
