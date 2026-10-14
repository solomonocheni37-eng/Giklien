import { createSignal, onMount, Show } from "solid-js";
import {
  AuditPaper,
  EvidencePaper,
  WaiverPaper,
  type AuditData,
} from "~/components/Documents";
import SignaturePad, { type PadState } from "~/components/SignaturePad";
import { getSessionId, track } from "~/lib/analytics";

export default function Try() {
  const [signerName, setSignerName] = createSignal("");
  const [signerTitle, setSignerTitle] = createSignal("");

  const [consentEsign, setConsentEsign] = createSignal(false);
  const [consentAuthority, setConsentAuthority] = createSignal(false);
  const [consentAccuracy, setConsentAccuracy] = createSignal(false);

  const [consentLog, setConsentLog] = createSignal<(number | null)[]>([
    null,
    null,
    null,
  ]);

  const [pad, setPad] = createSignal<PadState>({
    points: 0,
    startedAt: null,
    dataUrl: null,
  });
  const [clearTick, setClearTick] = createSignal(0);

  const [saving, setSaving] = createSignal(false);
  const [error, setError] = createSignal("");
  const [audit, setAudit] = createSignal<AuditData | null>(null);
  const [disputeOpen, setDisputeOpen] = createSignal(false);

  let mountedAt = 0;

  onMount(() => {
    mountedAt = Date.now();
    track("page_view", { page: "demo" });
  });

  function toggleConsent(index: 0 | 1 | 2, checked: boolean) {
    setConsentLog((log) => {
      const next = [...log];
      next[index] = checked ? Date.now() : null;
      return next;
    });
    if (index === 0) setConsentEsign(checked);
    if (index === 1) setConsentAuthority(checked);
    if (index === 2) setConsentAccuracy(checked);
  }

  const canSubmit = () =>
    consentEsign() &&
    consentAuthority() &&
    consentAccuracy() &&
    pad().points > 0 &&
    signerName().trim().length > 0 &&
    signerTitle().trim().length > 0 &&
    !saving();

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (!canSubmit()) return;

    setSaving(true);
    setError("");

    const padState = pad();

    try {
      const res = await fetch("/api/demo/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName: signerName().trim(),
          signerTitle: signerTitle().trim(),
          consentEsign: consentEsign(),
          consentAuthority: consentAuthority(),
          consentAccuracy: consentAccuracy(),
          strokePoints: padState.points,
          durationMs: padState.startedAt ? Date.now() - padState.startedAt : null,
          signatureDataUrl: padState.dataUrl,
          viewedMs: mountedAt ? Date.now() - mountedAt : null,
          consentLog: consentLog(),
          sessionId: getSessionId(),
          userAgent: navigator.userAgent,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { ok: boolean; error?: string; audit?: AuditData }
        | null;

      if (!res.ok || !data?.ok || !data.audit) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        return;
      }

      setAudit(data.audit);
      track("demo_complete", { strokePoints: data.audit.strokePoints });
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function dispute() {
    setDisputeOpen(true);
    track("demo_dispute", {});
  }

  return (
    <>
      <header class="nav">
        <div class="container narrow nav-inner">
          <div class="logo">
            GIKLIEN<span>lien waiver ops</span>
          </div>
          <a class="btn" href="/">
            Back to overview
          </a>
        </div>
      </header>

      <main class="container narrow" style="padding-top: 40px;">
        <Show when={!audit()}>
          <div class="tag">
            <span class="pulse" />
            Live demo — subcontractor view
          </div>

          <div style="margin-top: 22px;">
            <WaiverPaper />
          </div>
          <p class="pad-hint center">
            Preview layout — production renders your state's verbatim statutory
            text, locked against editing.
          </p>

          <form class="card" onSubmit={submit}>
            <h2 style="margin-top:0;">Signer information</h2>

            <div class="form">
              <div class="form-row">
                <label>
                  Full legal name
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={signerName()}
                    onInput={(e) => setSignerName(e.currentTarget.value)}
                  />
                </label>
                <label>
                  Title / authority
                  <input
                    type="text"
                    placeholder="President"
                    value={signerTitle()}
                    onInput={(e) => setSignerTitle(e.currentTarget.value)}
                  />
                </label>
              </div>

              <h2>Required consent</h2>

              <label class="checkbox">
                <input
                  type="checkbox"
                  checked={consentEsign()}
                  onChange={(e) => toggleConsent(0, e.currentTarget.checked)}
                />
                <span>
                  I agree to conduct this transaction electronically and acknowledge
                  that my digital signature carries the same legal weight as a
                  wet-ink signature under the ESIGN Act and applicable state law.
                </span>
              </label>

              <label class="checkbox">
                <input
                  type="checkbox"
                  checked={consentAuthority()}
                  onChange={(e) => toggleConsent(1, e.currentTarget.checked)}
                />
                <span>
                  I confirm I am an authorized officer, representative, or agent
                  with legal authority to sign binding financial waivers on behalf
                  of the subcontractor company.
                </span>
              </label>

              <label class="checkbox">
                <input
                  type="checkbox"
                  checked={consentAccuracy()}
                  onChange={(e) => toggleConsent(2, e.currentTarget.checked)}
                />
                <span>
                  I have reviewed the waiver document above, verify the payment
                  amount and dates are accurate, and agree to the terms shown.
                </span>
              </label>

              <h2>Sign the document</h2>
              <SignaturePad onChange={setPad} clearTick={clearTick} />
              <p class="pad-hint">
                Draw with finger or mouse. Submit unlocks only after all three
                consents and a drawn signature.
              </p>

              <div class="button-row">
                <button
                  type="button"
                  class="btn"
                  onClick={() => setClearTick((t) => t + 1)}
                >
                  Clear signature
                </button>
                <button type="button" class="btn btn-danger" onClick={dispute}>
                  Dispute amount
                </button>
              </div>

              <Show when={error()}>
                <p class="error">{error()}</p>
              </Show>

              <button class="btn btn-ink full" type="submit" disabled={!canSubmit()}>
                {saving() ? "Recording…" : "Submit signed waiver"}
              </button>
            </div>
          </form>
        </Show>

        <Show when={audit()}>
          {(a) => (
            <div>
              <div class="tag">
                <span class="pulse" />
                Waiver captured — pages 2 & 3 generated
              </div>

              <div class="stack-v">
                <AuditPaper audit={a()} />
                <EvidencePaper audit={a()} signatureDataUrl={pad().dataUrl} />
              </div>

              <p class="pad-hint center">
                In production, pages 1–3 merge into one sealed PDF with a SHA-256
                hash stored against the record.
              </p>

              <a class="btn btn-ink full" href="/#request-access">
                Request Founding Partner access
              </a>
            </div>
          )}
        </Show>
      </main>

      <Show when={disputeOpen()}>
        <div class="modal-backdrop" onClick={() => setDisputeOpen(false)}>
          <div
            class="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dispute-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="stamp" style="position:static; display:inline-block; transform:rotate(-4deg); margin-bottom:12px;">
              Stop work
            </div>
            <h3 id="dispute-title">Dispute recorded</h3>
            <p>
              In production, this stops the signing process and sends an alert to
              the GC Controller to resolve the invoice discrepancy.
            </p>
            <div class="button-row">
              <button class="btn btn-ink" onClick={() => setDisputeOpen(false)}>
                Got it
              </button>
            </div>
          </div>
        </div>
      </Show>

      <footer class="footer">
        <div class="container narrow">
          Giklien provides document automation software, not legal advice. This
          demo is for product validation only.
        </div>
      </footer>
    </>
  );
}
