import { Link } from "ekko:rune/router";

export default function NotFound() {
  return (
    <div className="empty">
      <div className="empty-icon">🔍</div>
      <p>Page not found.</p>
      <p className="muted"><Link href="/">Back to inbox</Link></p>
    </div>
  );
}
