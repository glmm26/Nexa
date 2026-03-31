import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

export function AppShell({ children }) {
  return (
    <div className="app-shell">
      <SiteHeader />
      <main className="app-main">{children}</main>
      <SiteFooter />
    </div>
  );
}
