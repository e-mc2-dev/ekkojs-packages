import { createPortal } from "react-dom";
import { isBrowser } from "./isBrowser";
// SsrPortal — portal that is SSR-safe. On the client it portals into a target (default document.body);
// under SSR (no document) it renders nothing, never touching document on the server. Overlay components
// (FloatingPanel/FloatingWindow/FeatureTour/RibbonSplitButton) use this instead of calling createPortal
// against document.body directly.
export interface SsrPortalProps {
  children: any;
  container?: any; // Element | null; defaults to document.body on the client
}
export function SsrPortal(props: SsrPortalProps): any {
  if (!isBrowser) return null;
  const target = props.container || document.body;
  if (!target) return null;
  return createPortal(props.children, target);
}
