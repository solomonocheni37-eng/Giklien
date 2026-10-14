import { Link, MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, type ParentProps } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router
      root={(props: ParentProps) => (
        <MetaProvider>
          <Title>
            Giklien | No-Login Lien Waiver Automation for General Contractors
          </Title>
          <Link rel="icon" type="image/svg+xml" href="/favicon.svg" />
          <Suspense fallback={<div class="pad-hint">Loading…</div>}>
            {props.children}
          </Suspense>
        </MetaProvider>
      )}
    >
      <FileRoutes />
    </Router>
  );
}
