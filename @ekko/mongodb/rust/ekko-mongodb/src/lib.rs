use std::collections::HashMap;
use std::ffi::{c_char, CString};
use std::sync::atomic::{AtomicI32, Ordering};
use std::sync::{Mutex, OnceLock};

use bson::{doc, Bson, Document};
use mongodb::options::{ClientOptions, FindOptions, IndexOptions};
use mongodb::{Client, ClientSession, IndexModel};
use serde_json::Value;
use tokio::runtime::Runtime;

static RUNTIME: OnceLock<Runtime> = OnceLock::new();
static HANDLES: OnceLock<Mutex<HashMap<i32, Client>>> = OnceLock::new();
static SESSIONS: OnceLock<Mutex<HashMap<i32, ClientSession>>> = OnceLock::new();
static NEXT_ID: AtomicI32 = AtomicI32::new(1);

fn rt() -> &'static Runtime {
    RUNTIME.get_or_init(|| {
        tokio::runtime::Builder::new_current_thread()
            .enable_all()
            .build()
            .expect("tokio runtime")
    })
}

fn handles() -> &'static Mutex<HashMap<i32, Client>> {
    HANDLES.get_or_init(|| Mutex::new(HashMap::new()))
}

fn sessions() -> &'static Mutex<HashMap<i32, ClientSession>> {
    SESSIONS.get_or_init(|| Mutex::new(HashMap::new()))
}

fn take_session(handle: i32) -> Option<ClientSession> {
    sessions().lock().ok()?.remove(&handle)
}

fn put_session(handle: i32, session: ClientSession) {
    sessions().lock().unwrap().insert(handle, session);
}

fn read_str(ptr: *const u8, len: i32) -> String {
    if ptr.is_null() || len <= 0 {
        return String::new();
    }
    unsafe { String::from_utf8_lossy(std::slice::from_raw_parts(ptr, len as usize)).to_string() }
}

fn to_cstring(s: &str) -> *mut c_char {
    CString::new(s).unwrap_or_default().into_raw()
}

fn err_json(msg: &str) -> *mut c_char {
    let escaped = msg.replace('\\', "\\\\").replace('"', "\\\"");
    to_cstring(&format!("{{\"error\":\"{}\"}}", escaped))
}

fn json_to_doc(json: &str) -> Result<Document, String> {
    let v: Value = serde_json::from_str(json).map_err(|e| e.to_string())?;
    let b = bson::to_bson(&v).map_err(|e| e.to_string())?;
    b.as_document().cloned().ok_or_else(|| "not an object".into())
}

fn json_to_docs(json: &str) -> Result<Vec<Document>, String> {
    let v: Value = serde_json::from_str(json).map_err(|e| e.to_string())?;
    let arr = v.as_array().ok_or("not an array")?;
    arr.iter()
        .map(|item| {
            let b = bson::to_bson(item).map_err(|e| e.to_string())?;
            b.as_document().cloned().ok_or_else(|| "not an object".into())
        })
        .collect()
}

fn doc_to_json(doc: &Document) -> Value {
    let mut map = serde_json::Map::new();
    for (k, v) in doc {
        map.insert(k.clone(), bson_to_json_value(v));
    }
    Value::Object(map)
}

fn bson_to_json_value(b: &Bson) -> Value {
    match b {
        Bson::ObjectId(oid) => Value::String(oid.to_hex()),
        Bson::DateTime(dt) => Value::Number(serde_json::Number::from(dt.timestamp_millis())),
        Bson::Int32(n) => Value::Number((*n).into()),
        Bson::Int64(n) => Value::Number((*n).into()),
        Bson::Double(f) => serde_json::Number::from_f64(*f)
            .map(Value::Number)
            .unwrap_or(Value::Null),
        Bson::String(s) => Value::String(s.clone()),
        Bson::Boolean(b) => Value::Bool(*b),
        Bson::Null => Value::Null,
        Bson::Array(arr) => Value::Array(arr.iter().map(bson_to_json_value).collect()),
        Bson::Document(d) => doc_to_json(d),
        _ => Value::String(format!("{}", b)),
    }
}

fn get_client(handle: i32) -> Option<Client> {
    handles().lock().ok()?.get(&handle).cloned()
}

// ═══════════════════════════════════════════
// C ABI exports
// ═══════════════════════════════════════════

#[no_mangle]
pub extern "C" fn mongo_connect(uri_ptr: *const u8, uri_len: i32) -> i32 {
    let uri = read_str(uri_ptr, uri_len);
    let result = rt().block_on(async {
        let opts = ClientOptions::parse(&uri).await?;
        let client = Client::with_options(opts)?;
        client
            .database("admin")
            .run_command(doc! { "ping": 1 })
            .await?;
        Ok::<Client, mongodb::error::Error>(client)
    });
    match result {
        Ok(client) => {
            let id = NEXT_ID.fetch_add(1, Ordering::Relaxed);
            handles().lock().unwrap().insert(id, client);
            id
        }
        Err(_) => -1,
    }
}

#[no_mangle]
pub extern "C" fn mongo_find(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
    query_ptr: *const u8, query_len: i32,
) -> *mut c_char {
    let client = match get_client(handle) {
        Some(c) => c,
        None => return err_json("invalid handle"),
    };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let query_json = read_str(query_ptr, query_len);
    let query: Value = serde_json::from_str(&query_json).unwrap_or(Value::Object(Default::default()));

    let filter = query
        .get("filter")
        .and_then(|v| bson::to_bson(v).ok())
        .and_then(|b| b.as_document().cloned())
        .unwrap_or_default();

    let mut opts = FindOptions::default();
    if let Some(sort) = query.get("sort").and_then(|v| bson::to_bson(v).ok()).and_then(|b| b.as_document().cloned()) {
        opts.sort = Some(sort);
    }
    if let Some(limit) = query.get("limit").and_then(|v| v.as_i64()) {
        opts.limit = Some(limit);
    }
    if let Some(skip) = query.get("skip").and_then(|v| v.as_u64()) {
        opts.skip = Some(skip);
    }
    if let Some(proj) = query.get("projection").and_then(|v| bson::to_bson(v).ok()).and_then(|b| b.as_document().cloned()) {
        opts.projection = Some(proj);
    }

    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    let mut session_opt = take_session(handle);
    let result = rt().block_on(async {
        let mut docs = Vec::new();
        if let Some(ref mut s) = session_opt {
            let mut cursor = coll.find(filter).with_options(opts).session(&mut *s).await?;
            while cursor.advance(s).await? { docs.push(cursor.deserialize_current()?); }
        } else {
            let mut cursor = coll.find(filter).with_options(opts).await?;
            while cursor.advance().await? { docs.push(cursor.deserialize_current()?); }
        }
        Ok::<Vec<Document>, mongodb::error::Error>(docs)
    });
    if let Some(s) = session_opt { put_session(handle, s); }

    match result {
        Ok(docs) => {
            let arr: Vec<Value> = docs.iter().map(doc_to_json).collect();
            to_cstring(&serde_json::to_string(&arr).unwrap_or_else(|_| "[]".into()))
        }
        Err(e) => err_json(&e.to_string()),
    }
}

#[no_mangle]
pub extern "C" fn mongo_insert_one(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
    doc_ptr: *const u8, doc_len: i32,
) -> *mut c_char {
    let client = match get_client(handle) {
        Some(c) => c,
        None => return err_json("invalid handle"),
    };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let doc_json = read_str(doc_ptr, doc_len);
    let document = match json_to_doc(&doc_json) {
        Ok(d) => d,
        Err(e) => return err_json(&e),
    };

    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    let mut session_opt = take_session(handle);
    let result = rt().block_on(async {
        if let Some(ref mut s) = session_opt {
            coll.insert_one(document).session(&mut *s).await
        } else {
            coll.insert_one(document).await
        }
    });
    if let Some(s) = session_opt { put_session(handle, s); }

    match result {
        Ok(res) => {
            let id = bson_to_json_value(&res.inserted_id);
            to_cstring(&format!("{{\"insertedId\":{}}}", serde_json::to_string(&id).unwrap_or_else(|_| "null".into())))
        }
        Err(e) => err_json(&e.to_string()),
    }
}

#[no_mangle]
pub extern "C" fn mongo_insert_many(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
    docs_ptr: *const u8, docs_len: i32,
) -> *mut c_char {
    let client = match get_client(handle) {
        Some(c) => c,
        None => return err_json("invalid handle"),
    };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let docs_json = read_str(docs_ptr, docs_len);
    let documents = match json_to_docs(&docs_json) {
        Ok(d) => d,
        Err(e) => return err_json(&e),
    };

    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    let mut session_opt = take_session(handle);
    let result = rt().block_on(async {
        if let Some(ref mut s) = session_opt {
            coll.insert_many(documents).session(&mut *s).await
        } else {
            coll.insert_many(documents).await
        }
    });
    if let Some(s) = session_opt { put_session(handle, s); }

    match result {
        Ok(res) => {
            let ids: Vec<Value> = res.inserted_ids.values().map(bson_to_json_value).collect();
            to_cstring(&format!("{{\"insertedIds\":{}}}", serde_json::to_string(&ids).unwrap_or_else(|_| "[]".into())))
        }
        Err(e) => err_json(&e.to_string()),
    }
}

#[no_mangle]
pub extern "C" fn mongo_update_one(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
    filter_ptr: *const u8, filter_len: i32,
    update_ptr: *const u8, update_len: i32,
) -> i32 {
    let client = match get_client(handle) { Some(c) => c, None => return -1 };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let filter = match json_to_doc(&read_str(filter_ptr, filter_len)) { Ok(d) => d, Err(_) => return -1 };
    let update = match json_to_doc(&read_str(update_ptr, update_len)) { Ok(d) => d, Err(_) => return -1 };
    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    let mut so = take_session(handle);
    let r = rt().block_on(async {
        if let Some(ref mut s) = so { coll.update_one(filter, update).session(&mut *s).await }
        else { coll.update_one(filter, update).await }
    });
    if let Some(s) = so { put_session(handle, s); }
    match r { Ok(res) => res.modified_count as i32, Err(_) => -1 }
}

#[no_mangle]
pub extern "C" fn mongo_update_many(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
    filter_ptr: *const u8, filter_len: i32,
    update_ptr: *const u8, update_len: i32,
) -> i32 {
    let client = match get_client(handle) { Some(c) => c, None => return -1 };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let filter = match json_to_doc(&read_str(filter_ptr, filter_len)) { Ok(d) => d, Err(_) => return -1 };
    let update = match json_to_doc(&read_str(update_ptr, update_len)) { Ok(d) => d, Err(_) => return -1 };
    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    let mut so = take_session(handle);
    let r = rt().block_on(async {
        if let Some(ref mut s) = so { coll.update_many(filter, update).session(&mut *s).await }
        else { coll.update_many(filter, update).await }
    });
    if let Some(s) = so { put_session(handle, s); }
    match r { Ok(res) => res.modified_count as i32, Err(_) => -1 }
}

#[no_mangle]
pub extern "C" fn mongo_delete_one(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
    filter_ptr: *const u8, filter_len: i32,
) -> i32 {
    let client = match get_client(handle) { Some(c) => c, None => return -1 };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let filter = match json_to_doc(&read_str(filter_ptr, filter_len)) { Ok(d) => d, Err(_) => return -1 };
    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    let mut so = take_session(handle);
    let r = rt().block_on(async {
        if let Some(ref mut s) = so { coll.delete_one(filter).session(&mut *s).await }
        else { coll.delete_one(filter).await }
    });
    if let Some(s) = so { put_session(handle, s); }
    match r { Ok(res) => res.deleted_count as i32, Err(_) => -1 }
}

#[no_mangle]
pub extern "C" fn mongo_delete_many(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
    filter_ptr: *const u8, filter_len: i32,
) -> i32 {
    let client = match get_client(handle) { Some(c) => c, None => return -1 };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let filter = match json_to_doc(&read_str(filter_ptr, filter_len)) { Ok(d) => d, Err(_) => return -1 };
    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    let mut so = take_session(handle);
    let r = rt().block_on(async {
        if let Some(ref mut s) = so { coll.delete_many(filter).session(&mut *s).await }
        else { coll.delete_many(filter).await }
    });
    if let Some(s) = so { put_session(handle, s); }
    match r { Ok(res) => res.deleted_count as i32, Err(_) => -1 }
}

#[no_mangle]
pub extern "C" fn mongo_count(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
    filter_ptr: *const u8, filter_len: i32,
) -> i32 {
    let client = match get_client(handle) { Some(c) => c, None => return -1 };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let fj = read_str(filter_ptr, filter_len);
    let filter = if fj.is_empty() || fj == "{}" { doc! {} } else { json_to_doc(&fj).unwrap_or_default() };
    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    let mut so = take_session(handle);
    let r = rt().block_on(async {
        if let Some(ref mut s) = so { coll.count_documents(filter).session(&mut *s).await }
        else { coll.count_documents(filter).await }
    });
    if let Some(s) = so { put_session(handle, s); }
    match r { Ok(n) => n as i32, Err(_) => -1 }
}

#[no_mangle]
pub extern "C" fn mongo_aggregate(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
    pipeline_ptr: *const u8, pipeline_len: i32,
) -> *mut c_char {
    let client = match get_client(handle) { Some(c) => c, None => return err_json("invalid handle") };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let stages = match json_to_docs(&read_str(pipeline_ptr, pipeline_len)) { Ok(d) => d, Err(e) => return err_json(&e) };
    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    let mut so = take_session(handle);
    let result = rt().block_on(async {
        let mut docs = Vec::new();
        if let Some(ref mut s) = so {
            let mut cursor = coll.aggregate(stages).session(&mut *s).await?;
            while cursor.advance(s).await? { docs.push(cursor.deserialize_current()?); }
        } else {
            let mut cursor = coll.aggregate(stages).await?;
            while cursor.advance().await? { docs.push(cursor.deserialize_current()?); }
        }
        Ok::<Vec<Document>, mongodb::error::Error>(docs)
    });
    if let Some(s) = so { put_session(handle, s); }

    match result {
        Ok(docs) => {
            let arr: Vec<Value> = docs.iter().map(doc_to_json).collect();
            to_cstring(&serde_json::to_string(&arr).unwrap_or_else(|_| "[]".into()))
        }
        Err(e) => err_json(&e.to_string()),
    }
}

#[no_mangle]
pub extern "C" fn mongo_create_index(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
    keys_ptr: *const u8, keys_len: i32,
    opts_ptr: *const u8, opts_len: i32,
) -> i32 {
    let client = match get_client(handle) {
        Some(c) => c,
        None => return -1,
    };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let keys = match json_to_doc(&read_str(keys_ptr, keys_len)) { Ok(d) => d, Err(_) => return -1 };
    let opts_json = read_str(opts_ptr, opts_len);

    let mut index_opts = IndexOptions::default();
    if !opts_json.is_empty() && opts_json != "{}" {
        if let Ok(v) = serde_json::from_str::<Value>(&opts_json) {
            if let Some(name) = v.get("name").and_then(|n| n.as_str()) {
                index_opts.name = Some(name.to_string());
            }
            if let Some(unique) = v.get("unique").and_then(|u| u.as_bool()) {
                index_opts.unique = Some(unique);
            }
        }
    }
    let model = IndexModel::builder().keys(keys).options(index_opts).build();

    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    match rt().block_on(async { coll.create_index(model).await }) {
        Ok(_) => 0,
        Err(_) => -1,
    }
}

#[no_mangle]
pub extern "C" fn mongo_drop_collection(
    handle: i32,
    db_ptr: *const u8, db_len: i32,
    coll_ptr: *const u8, coll_len: i32,
) -> i32 {
    let client = match get_client(handle) {
        Some(c) => c,
        None => return -1,
    };
    let db_name = read_str(db_ptr, db_len);
    let coll_name = read_str(coll_ptr, coll_len);
    let coll = client.database(&db_name).collection::<Document>(&coll_name);
    match rt().block_on(async { coll.drop().await }) {
        Ok(_) => 0,
        Err(_) => -1,
    }
}

#[no_mangle]
pub extern "C" fn mongo_begin(handle: i32) -> i32 {
    let client = match get_client(handle) {
        Some(c) => c,
        None => return -1,
    };
    match rt().block_on(async {
        let mut session = client.start_session().await?;
        session.start_transaction().await?;
        Ok::<ClientSession, mongodb::error::Error>(session)
    }) {
        Ok(session) => { put_session(handle, session); 0 }
        Err(_) => -1,
    }
}

#[no_mangle]
pub extern "C" fn mongo_commit(handle: i32) -> i32 {
    let mut session = match take_session(handle) {
        Some(s) => s,
        None => return -1,
    };
    match rt().block_on(async { session.commit_transaction().await }) {
        Ok(_) => 0,
        Err(_) => -1,
    }
}

#[no_mangle]
pub extern "C" fn mongo_rollback(handle: i32) -> i32 {
    let mut session = match take_session(handle) {
        Some(s) => s,
        None => return -1,
    };
    match rt().block_on(async { session.abort_transaction().await }) {
        Ok(_) => 0,
        Err(_) => -1,
    }
}

#[no_mangle]
pub extern "C" fn mongo_close(handle: i32) {
    sessions().lock().ok().map(|mut m| m.remove(&handle));
    if let Ok(mut map) = handles().lock() {
        map.remove(&handle);
    }
}

#[no_mangle]
pub extern "C" fn mongo_free(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe { drop(CString::from_raw(ptr)); }
    }
}
