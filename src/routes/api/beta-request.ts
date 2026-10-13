import type { APIEvent } from "@solidjs/start/server";
import { eq, sql } from "drizzle-orm";
import { db } from "~/db/client";
import { betaRequests } from "~/db/schema";
import { cleanString, EMAIL_REGEX, extractIp, readJson } from "~/server/utils";

const FOUNDING_SEATS = 5;

export async function POST(event: APIEvent) {
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

  // First come, first served: count + insert happen in ONE transaction,
  // so two simultaneous signups can never receive the same seat number.
  const result = await db.transaction(async (tx) => {
    const existing = await tx
      .select({ queuePosition: betaRequests.queuePosition })
      .from(betaRequests)
      .where(eq(betaRequests.email, email))
      .limit(1);

    // Same email twice? Keep the ORIGINAL position. No seat hoarding.
    if (existing[0]?.queuePosition != null) {
      return { position: existing[0].queuePosition, already: true };
    }

    const rows = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(betaRequests);

    const position = (rows[0]?.count ?? 0) + 1;

    await tx.insert(betaRequests).values({
      queuePosition: position,
      email,
      emailValid: true,
      name: cleanString(data.name, 120),
      company: cleanString(data.company, 160),
      role: cleanString(data.role, 80),
      state: cleanString(data.state, 40),
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

    return { position, already: false };
  });

  return Response.json({
    ok: true,
    queuePosition: result.position,
    seatSecured: result.position <= FOUNDING_SEATS,
    seatsTotal: FOUNDING_SEATS,
    alreadyRegistered: result.already,
  });
}
