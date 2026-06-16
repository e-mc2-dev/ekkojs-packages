export default function ErrorPage({ error }: any) {
  return (
    <div className="empty">
      <div className="empty-icon">⚠️</div>
      <p>Something went wrong.</p>
      <p className="muted">{error ? String(error) : "Unexpected error."}</p>
      <p className="muted"><Link href="/">Back to inbox</Link></p>
    </div>
  );
}
