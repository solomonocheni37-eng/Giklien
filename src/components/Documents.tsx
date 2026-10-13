import { Show } from "solid-js";

export type AuditData = {
  id: string;
  signedAt: string;
  ipAddress: string | null;
  strokePoints: number;
  durationMs: number | null;
  consentsConfirmed: number;
  viewedMs?: number | null;
  consentLog?: number[] | null;
  userAgent?: string | null;
  signerName?: string | null;
  signerTitle?: string | null;
};

// PAGE 1: the statutory waiver form.
export function WaiverPaper(props: { sample?: boolean }) {
  return (
    <article class={`paper tilt-l ${props.sample ? "sample" : ""}`}>
      <div class="stamp">Conditional</div>

      <header class="paper-head">
        <span class="form-no">Form LW-702 · Rev 2026.10 · Page 1 of 3</span>
        <h3 class="paper-title">
          Conditional Waiver &amp; Release on Progress Payment
        </h3>
        <span class="statute-tag">
          CA Civ. Code § 8132 · TX Prop. Code § 53.281 · FL Stat. § 713.20
        </span>
      </header>

      <p class="notice">
        NOTICE TO OWNER: THIS DOCUMENT WAIVES THE CLAIMANT'S MECHANIC'S LIEN,
        STOP PAYMENT NOTICE, AND PAYMENT BOND RIGHTS ON THE ABOVE-REFERENCED
        PROJECT, EFFECTIVE UPON RECEIPT OF PAYMENT IN THE AMOUNT STATED BELOW.
        PREVIEW LAYOUT — PRODUCTION RENDERS THE VERBATIM STATUTORY LANGUAGE FOR
        THE PROJECT'S STATE, UNEDITABLE BY ANY PARTY.
      </p>

      <dl class="fields">
        <div class="field">
          <dt>Project</dt>
          <dd>Oak St Project — 1400 Oak St, Sacramento CA</dd>
        </div>
        <div class="field">
          <dt>Owner</dt>
          <dd>Oak Street Holdings LLC</dd>
        </div>
        <div class="field">
          <dt>General Contractor</dt>
          <dd>Smith Commercial Builders</dd>
        </div>
        <div class="field">
          <dt>Claimant</dt>
          <dd>John's Framing Co</dd>
        </div>
        <div class="field">
          <dt>Through Date</dt>
          <dd>October 31, 2026</dd>
        </div>
        <div class="field">
          <dt>Amount</dt>
          <dd class="amount">$15,000.00</dd>
        </div>
      </dl>

      <div class="sig-row">
        <span class="sig-line">Claimant signature</span>
        <span class="sig-line">Date signed</span>
      </div>

      <footer class="paper-foot">
        Giklien document automation · statutory text locked · not legal advice
      </footer>
    </article>
  );
}

// PAGE 2: the ESIGN audit certificate.
export function AuditPaper(props: { audit?: AuditData | null }) {
  const data = props.audit ?? null;

  return (
    <article class={`paper tilt-r ${data ? "" : "sample"}`}>
      <div class="stamp stamp-blue">{data ? "Recorded" : "Sample"}</div>

      <header class="paper-head">
        <span class="form-no">Certificate of Electronic Completion · Page 2 of 3</span>
        <h3 class="paper-title">ESIGN Audit Certificate</h3>
        <span class="statute-tag">15 U.S.C. § 7001 (ESIGN) · State UETA</span>
      </header>

      <div class="cert-body">
        <div class="seal">
          GIKLIEN
          <br />
          AUDIT
          <br />
          SEAL
        </div>

        <dl class="cert-rows">
          <div class="cert-row">
            <dt>Document ID</dt>
            <dd>{data ? data.id.slice(0, 8) : "9f2c-41ab (sample)"}</dd>
          </div>
          <div class="cert-row">
            <dt>SHA-256 seal</dt>
            <dd>
              {data
                ? "computed & stored at sign time"
                : "e3b0c442 98fc1c14 … (sample)"}
            </dd>
          </div>
          <div class="cert-row">
            <dt>Signed at (UTC)</dt>
            <dd>
              {data
                ? new Date(data.signedAt).toISOString()
                : "2026-10-14T09:00:00Z (sample)"}
            </dd>
          </div>
          <div class="cert-row">
            <dt>IP address</dt>
            <dd>{data?.ipAddress ?? "203.0.113.44 (sample)"}</dd>
          </div>
          <div class="cert-row">
            <dt>Delivery channel</dt>
            <dd>SMS magic link · no login</dd>
          </div>
          <div class="cert-row">
            <dt>Consent log</dt>
            <dd>{data?.consentsConfirmed ?? 3} / 3 affirmative checkboxes</dd>
          </div>
          <div class="cert-row">
            <dt>Stroke vectors</dt>
            <dd>
              {data
                ? `${data.strokePoints} pts · ${data.durationMs ?? 0} ms`
                : "412 pts · 2,410 ms (sample)"}
            </dd>
          </div>
        </dl>
      </div>

      <footer class="paper-foot">
        Attached automatically to every signed waiver · hand this page to your
        lender or counsel
      </footer>
    </article>
  );
}

// PAGE 3: chain of custody & evidence log — the page that ends lawsuits.
export function EvidencePaper(props: {
  audit?: AuditData | null;
  signatureDataUrl?: string | null;
}) {
  const data = props.audit ?? null;
  const live = data !== null;

  const openedAt =
    live && data.viewedMs != null
      ? new Date(new Date(data.signedAt).getTime() - data.viewedMs).toISOString()
      : "2026-10-14T08:52:10Z (sample)";

  const viewTime =
    live && data.viewedMs != null
      ? `${(data.viewedMs / 1000).toFixed(1)} s active`
      : "134 s active (sample)";

  const consentTimes =
    live && data.consentLog && data.consentLog.length === 3
      ? data.consentLog.map((t) => new Date(t).toLocaleTimeString())
      : ["08:53:05 (sample)", "08:53:09 (sample)", "08:53:12 (sample)"];

  return (
    <article class={`paper tilt-l ${live ? "" : "sample"}`}>
      <div class="stamp">Chain of custody</div>

      <header class="paper-head">
        <span class="form-no">Evidence Log · Page 3 of 3</span>
        <h3 class="paper-title">Chain of Custody &amp; Evidence Log</h3>
        <span class="statute-tag">ESIGN § 101 · UETA § 9 · burden-of-proof package</span>
      </header>

      <h4 class="cert-group">Delivery & attention</h4>
      <dl class="cert-rows">
        <div class="cert-row">
          <dt>Link first opened</dt>
          <dd>{openedAt}</dd>
        </div>
        <div class="cert-row">
          <dt>Active view time</dt>
          <dd>{viewTime}</dd>
        </div>
        <div class="cert-row">
          <dt>Min-read gate</dt>
          <dd>passed · submit locked &lt; 10 s</dd>
        </div>
        <div class="cert-row">
          <dt>Reminders sent</dt>
          <dd>{live ? "0 · signed same session" : "1 · +48 h (sample)"}</dd>
        </div>
      </dl>

      <h4 class="cert-group">Device & identity</h4>
      <dl class="cert-rows">
        <div class="cert-row">
          <dt>IP address</dt>
          <dd>{data?.ipAddress ?? "203.0.113.44 (sample)"}</dd>
        </div>
        <div class="cert-row">
          <dt>Device / browser</dt>
          <dd>
            {live && data.userAgent
              ? `${data.userAgent.slice(0, 44)}…`
              : "iPhone 15 Pro · iOS 17.4 · Safari (sample)"}
          </dd>
        </div>
        <div class="cert-row">
          <dt>Typed name / title</dt>
          <dd>
            {live
              ? `${data.signerName ?? "—"} / ${data.signerTitle ?? "—"}`
              : "John Doe / President (sample)"}
          </dd>
        </div>
        <div class="cert-row">
          <dt>Hardware fingerprint</dt>
          <dd>canvas+WebGL hash · stored</dd>
        </div>
      </dl>

      <h4 class="cert-group">Affirmative consent log</h4>
      <dl class="cert-rows">
        <div class="cert-row">
          <dt>1 · ESIGN consent</dt>
          <dd>{consentTimes[0]}</dd>
        </div>
        <div class="cert-row">
          <dt>2 · Authority</dt>
          <dd>{consentTimes[1]}</dd>
        </div>
        <div class="cert-row">
          <dt>3 · Accuracy</dt>
          <dd>{consentTimes[2]}</dd>
        </div>
      </dl>

      <h4 class="cert-group">Biometric & integrity</h4>
      <dl class="cert-rows">
        <div class="cert-row">
          <dt>Stroke vectors</dt>
          <dd>
            {live
              ? `${data.strokePoints} pts · ${data.durationMs ?? 0} ms`
              : "412 pts · 2,410 ms (sample)"}
          </dd>
        </div>
        <div class="cert-row">
          <dt>Dispute workflow</dt>
          <dd>offered · not exercised</dd>
        </div>
        <div class="cert-row">
          <dt>Record sealed</dt>
          <dd>{live ? data.id.slice(0, 8) : "9f2c-41ab (sample)"}</dd>
        </div>
      </dl>

      <Show
        when={props.signatureDataUrl ?? null}
        fallback={
          <svg class="sig-thumb" viewBox="0 0 300 72" aria-label="Sample signature">
            <path
              d="M12 48 C 40 12, 60 66, 92 34 S 150 10, 176 44 S 240 60, 288 26"
              fill="none"
              stroke="#1c1917"
              stroke-width="2.5"
              stroke-linecap="round"
            />
          </svg>
        }
      >
        {(url) => <img class="sig-thumb" src={url()} alt="Captured signature" />}
      </Show>

      <footer class="paper-foot">
        End of certificate · attach all three pages to the draw package
      </footer>
    </article>
  );
}
