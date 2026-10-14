import type { APIEvent } from "@solidjs/start/server";
import { eq, sql } from "drizzle-orm";
import { db } from "~/db/client";
import { betaRequests } from "~/db/schema";
import { cleanString, EMAIL_REGEX, extractIp, readJson } from "~/server/utils";

const FOUNDING_SEATS = 5;

export async function POST(event: APIEvent) {
  try {
    const data = await readJson(event);
    if (!data) {
      return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
    }

    // Honeypot: humans never see this hidden field, bots fill it.
    const honeypot = cleanString(data.website, 200);
    if (honeypot) {
      return Response.json({
        ok: true,
        queuePosition: null,
        seatSecured: false,
        seatsTotal: FOUNDING_SEATS,
        alreadyRegistered: false,
      });
    }

    const email = cleanString(data.email, 254)?.toLowerCase() ?? null;
    if (!email || !EMAIL_REGEX.test(email)) {
      return Response.json(
        { ok: false, error: "A valid work email is required." },
        { status: 422 }
      );
    }

    if (data.consent !== true) {
      return Response.json(
        { ok: false, error: "Please accept the updates consent box." },
        { status: 422 }
      );
    }

    const nameV = cleanString(data.name, 120);
    const companyV = cleanString(data.company, 160);
    const roleV = cleanString(data.role, 80);
    const stateV = cleanString(data.state, 40);

    // Same email twice? Keep the ORIGINAL position. No seat hoarding.
    const existing = await db
      .select({ queuePosition: betaRequests.queuePosition })
      .from(betaRequests)
      .where(eq(betaRequests.email, email))
      .limit(1);

    if (existing[0]?.queuePosition != null) {
      return Response.json({
        ok: true,
        queuePosition: existing[0].queuePosition,
        seatSecured: existing[0].queuePosition <= FOUNDING_SEATS,
        seatsTotal: FOUNDING_SEATS,
        alreadyRegistered: true,
      });
    }

    // First come, first served: position = current count + 1.
    const rows = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(betaRequests);

    const position = (rows[0]?.count ?? 0) + 1;

    await db.insert(betaRequests).values({
      queuePosition: position,
      email,
      emailValid: true,
      name: nameV,
      company: companyV,
      role: roleV,
      state: stateV,
      message: cleanString(data.message, 2000),
      source: cleanString(data.source, 80) ?? "giklien-demo",
      pagePath: cleanString(data.path, 300),
      sessionId: cleanString(data.sessionId, 64),
      utmSource: cleanString(data.utmSource, 100),
      utmMedium: cleanString(data.utmMedium, 100),
      utmCampaign: cleanString(data.utmCampaign, 100),
      ipAddress: extractIp(event),
      consent: true,
    });

    // Instant inbox alert (only if RESEND_API_KEY is configured).
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      void fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Giklien Queue <onboarding@resend.dev>",
          to: [process.env.NOTIFY_EMAIL ?? "you@example.com"],
          subject: `Seat #${position}: ${email}`,
          text: [
            "New Giklien founding queue signup",
            `Position: #${position} (${
              position <= FOUNDING_SEATS ? "FOUNDING SEAT" : "waitlist"
            } of ${FOUNDING_SEATS})`,
            `Email: ${email}`,
            `Name: ${nameV ?? "-"}`,
            `Company: ${companyV ?? "-"}`,
            `Role: ${roleV ?? "-"} | State: ${stateV ?? "-"}`,
          ].join("\n"),
        }),
      }).catch((err) => console.warn("Resend notify failed:", err));
    }

    return Response.json({
      ok: true,
      queuePosition: position,
      seatSecured: position <= FOUNDING_SEATS,
      seatsTotal: FOUNDING_SEATS,
      alreadyRegistered: false,
    });
  } catch (err) {
    // Surface the real cause both in the curl body AND in the dev terminal.
    const name = err instanceof Error ? err.name : "unknown";
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    // eslint-disable-next-line no-console
    console.error("[beta-request] caught:", { name, message, stack, cause: (err as { cause?: unknown })?.cause });
    return Response.json(
      { ok: false, error: message, errorName: name },
      { status: 500 }
    );
  }
}
