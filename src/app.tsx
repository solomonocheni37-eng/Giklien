import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense, type ParentProps } from "solid-js";
import "./app.css";

export default function App() {
  return (
    <Router
      root={(props: ParentProps) => (
        <MetaProvider>
          <Title>Giklien — Lien waiver compliance for mid-market GCs</Title>
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
