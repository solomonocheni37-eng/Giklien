import { createSignal, onMount, Show } from "solid-js";
import { AuditPaper, EvidencePaper, WaiverPaper } from "~/components/Documents";
import { getSessionId, getUtm, track } from "~/lib/analytics";

type Status = "idle" | "saving" | "done";

type QueueResult = {
  position: number;
  seat: boolean;
  already: boolean;
};

export default function Home() {
  const [email, setEmail] = createSignal("");
  const [name, setName] = createSignal("");
  const [company, setCompany] = createSignal("");
  const [role, setRole] = createSignal("");
  const [stateSel, setStateSel] = createSignal("");
  const [message, setMessage] = createSignal("");
  const [consent, setConsent] = createSignal(false);
  const [honeypot, setHoneypot] = createSignal("");

  const [status, setStatus] = createSignal<Status>("idle");
  const [error, setError] = createSignal("");
  const [result, setResult] = createSignal<QueueResult | null>(null);

  onMount(() => track("page_view", { page: "landing" }));

  async function submit(event: SubmitEvent) {
    event.preventDefault();
    if (status() === "saving") return;

    if (!email().trim()) {
      setError("Enter your work email.");
      return;
    }
    if (!consent()) {
      setError("Please accept the updates consent box.");
      return;
    }

    setError("");
    setStatus("saving");

    try {
      const res = await fetch("/api/beta-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email().trim().toLowerCase(),
          name: name(),
          company: company(),
          role: role(),
          state: stateSel(),
          message: message(),
          consent: consent(),
          website: honeypot(),
          sessionId: getSessionId(),
          path: window.location.pathname,
          source: "landing",
          ...getUtm(),
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | {
            ok: boolean;
            error?: string;
            queuePosition?: number | null;
            seatSecured?: boolean;
            alreadyRegistered?: boolean;
          }
        | null;

      if (!res.ok || !data?.ok) {
        setError(data?.error ?? "Something went wrong. Please try again.");
        setStatus("idle");
        return;
      }

      const pos = typeof data.queuePosition === "number" ? data.queuePosition : null;
      setResult(
        pos === null
          ? null
          : {
              position: pos,
              seat: data.seatSecured === true,
              already: data.alreadyRegistered === true,
            }
      );

      track("email_submit", { location: "landing_form", queuePosition: pos });
      setStatus("done");
    } catch {
      setError("Network error. Please try again.");
      setStatus("idle");
    }
  }

  return (
    <>
      <header class="nav">
        <div class="container nav-inner">
          <div class="logo">
            GIKLIEN<span>lien waiver ops</span>
          </div>
          <a
            class="btn"
            href="/try"
            onClick={() => track("cta_click", { cta: "nav_try_demo" })}
          >
            Try live demo
          </a>
        </div>
      </header>

      <main class="container">
        <section class="hero">
          <div class="tag">
            <span class="pulse" />
            Founding Partner Beta — 5 seats · first come, first served
          </div>

          <h1>
            Stop chasing lien waivers.
            <br />
            Protect your <span class="hl">next bank draw</span>.
          </h1>

          <p class="subhead">
            Giklien lets subcontractors sign state-aware lien waivers through a
            secure magic link in about 30 seconds. No logins. No passwords. No
            portals. Your draw package receives a three-page, court-ready PDF
            bundle every time.
          </p>

          <div class="actions">
            <a
              class="btn btn-ink"
              href="#request-access"
              onClick={() => track("cta_click", { cta: "hero_request_access" })}
            >
              Request Founding Partner access
            </a>
            <a
              class="btn"
              href="/try"
              onClick={() => track("cta_click", { cta: "hero_try_demo" })}
            >
              Try the 30-second signature demo
            </a>
          </div>

          <div class="stats-row">
            <div class="stat">
              <b>~30s</b>
              <span>Subcontractor sign time</span>
            </div>
            <div class="stat">
              <b>0</b>
              <span>Logins required for subs</span>
            </div>
            <div class="stat">
              <b>3 pages</b>
              <span>Court-ready PDF per waiver</span>
            </div>
          </div>
        </section>

        <section class="grid-3">
          <div class="card">
            <h3>No-login magic links</h3>
            <p>
              Subs receive a secure link by SMS or email and sign on their phone.
              Nothing to install, nothing to remember.
            </p>
          </div>
          <div class="card">
            <h3>Statutory-locked forms</h3>
            <p>
              State-mandated waiver language is generated by the system and cannot
              be edited by anyone in the workflow.
            </p>
          </div>
          <div class="card">
            <h3>Court-ready audit trail</h3>
            <p>
              Every signature ships with the ESIGN certificate and a
              chain-of-custody evidence log on pages 2–3 of the PDF.
            </p>
          </div>
        </section>

        <section class="section">
          <div class="section-head">
            <h2>Maximum value, visible up front</h2>
            <p class="subhead left">
              This is the exact three-page PDF bundle your draw package receives
              for every signed waiver — previewed here, generated automatically in
              production. Page 1: the statutory waiver. Page 2: the ESIGN audit
              certificate. Page 3: the chain-of-custody evidence log that ends
              challenges before they start.
            </p>
          </div>

          <div class="sheet-stack three">
            <WaiverPaper sample />
            <AuditPaper />
            <EvidencePaper />
          </div>
        </section>

        <section class="section card card-manila">
          <div class="offer-flex">
            <div class="price-stack">
              <div class="price-old">
                <s>$500/mo</s>
                <span>standard rate</span>
              </div>
              <div class="price">
                <b>$299/mo</b>
                <span>Founding rate · locked 12 months</span>
              </div>
              <div class="seats-left">Only 5 seats · assigned in sign-up order</div>
            </div>

            <ul class="offer-list">
              <li>
                Founding Partner Beta Pass — limited to 5 General Contractors,
                assigned strictly first come, first served.
              </li>
              <li>
                Pricing exchanged for honest feedback during your first two draw
                cycles.
              </li>
              <li>Costs less than 10 hours of AP phone-chasing per month.</li>
              <li>
                Reduces the risk of one missing waiver halting a $500,000 draw.
              </li>
            </ul>
          </div>
        </section>

        <section id="request-access" class="section card">
          <h2>Request Founding Partner access</h2>

          <Show
            when={status() !== "done"}
            fallback={
              <div>
                <Show
                  when={result()}
                  fallback={
                    <div class="ok-box">
                      <p style="margin:0; color:#15803d; font-weight:700;">
                        You're on the list. We'll email your queue confirmation
                        shortly. Meanwhile, try the live signature demo at /try.
                      </p>
                    </div>
                  }
                >
                  {(r) => (
                    <dl class="ok-box">
                      <div class="cert-row">
                        <dt>Queue position</dt>
                        <dd>#{r().position}</dd>
                      </div>
                      <div class="cert-row">
                        <dt>Status</dt>
                        <dd>
                          {r().seat
                            ? `Founding seat secured (${r().position} of 5)`
                            : "Waitlist — first in line if a seat opens"}
                        </dd>
                      </div>
                      <Show when={r().already}>
                        <div class="cert-row">
                          <dt>Note</dt>
                          <dd>Already registered — original position kept</dd>
                        </div>
                      </Show>
                      <div class="cert-row">
                        <dt>Next step</dt>
                        <dd>Try the live demo at /try</dd>
                      </div>
                    </dl>
                  )}
                </Show>
              </div>
            }
          >
            <form class="form" onSubmit={submit}>
              <label>
                Work email
                <input
                  type="email"
                  placeholder="you@gccompany.com"
                  value={email()}
                  onInput={(e) => setEmail(e.currentTarget.value)}
                />
              </label>

              <div class="form-row">
                <label>
                  Name
                  <input
                    type="text"
                    placeholder="Jane Smith"
                    value={name()}
                    onInput={(e) => setName(e.currentTarget.value)}
                  />
                </label>
                <label>
                  Company
                  <input
                    type="text"
                    placeholder="Smith Commercial Builders"
                    value={company()}
                    onInput={(e) => setCompany(e.currentTarget.value)}
                  />
                </label>
              </div>

              <div class="form-row">
                <label>
                  Role
                  <select
                    value={role()}
                    onChange={(e) => setRole(e.currentTarget.value)}
                  >
                    <option value="">Select role</option>
                    <option value="Controller">Controller</option>
                    <option value="AP / Accounting">AP / Accounting</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Owner">Owner</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
                <label>
                  Primary state
                  <select
                    value={stateSel()}
                    onChange={(e) => setStateSel(e.currentTarget.value)}
                  >
                    <option value="">Select state</option>
                    <option value="CA">California</option>
                    <option value="TX">Texas</option>
                    <option value="FL">Florida</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>

              <label>
                Current waiver process
                <textarea
                  rows={4}
                  placeholder="Example: We track waivers in Excel and email subs before each draw."
                  value={message()}
                  onInput={(e) => setMessage(e.currentTarget.value)}
                />
              </label>

              <label class="checkbox">
                <input
                  type="checkbox"
                  checked={consent()}
                  onChange={(e) => setConsent(e.currentTarget.checked)}
                />
                <span>
                  I agree to receive product updates about Giklien and understand
                  I can unsubscribe at any time.
                </span>
              </label>

              {/* Honeypot: hidden from humans, filled by bots */}
              <input
                type="text"
                value={honeypot()}
                onInput={(e) => setHoneypot(e.currentTarget.value)}
                style="display:none;"
                tabIndex={-1}
                autocomplete="off"
              />

              <Show when={error()}>
                <p class="error">{error()}</p>
              </Show>

              <button class="btn btn-ink full" type="submit" disabled={status() === "saving"}>
                {status() === "saving" ? "Filing…" : "Claim my place in line"}
              </button>
            </form>
          </Show>
        </section>
      </main>

      <footer class="footer">
        <div class="container">
          Giklien provides document automation software for managing lien waiver
          workflows. Giklien is not a law firm, does not provide legal advice, and
          does not review submitted documents for legal sufficiency. General
          Contractors are advised to review state statutory form templates with
          their own legal counsel prior to bank draw submission.
        </div>
      </footer>
    </>
  );
}
