import type { APIEvent } from "@solidjs/start/server";
import { db } from "~/db/client";
import { demoSignatures } from "~/db/schema";
import { cleanInt, cleanString, extractIp, readJson } from "~/server/utils";

export async function POST(event: APIEvent) {
  const data = await readJson(event);
  if (!data) {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const consentEsign = data.consentEsign === true;
  const consentAuthority = data.consentAuthority === true;
  const consentAccuracy = data.consentAccuracy === true;

  if (!consentEsign || !consentAuthority || !consentAccuracy) {
    return Response.json(
      { ok: false, error: "All three consent affirmations are required." },
      { status: 422 }
    );
  }

  const signerName = cleanString(data.signerName, 120);
  const signerTitle = cleanString(data.signerTitle, 120);
  if (!signerName || !signerTitle) {
    return Response.json(
      { ok: false, error: "Signer name and title are required." },
      { status: 422 }
    );
  }

  const strokePoints = cleanInt(data.strokePoints, 1, 100000);
  if (!strokePoints) {
    return Response.json(
      { ok: false, error: "A drawn signature is required." },
      { status: 422 }
    );
  }

  const signatureDataUrl = cleanString(data.signatureDataUrl, 300000);
  if (!signatureDataUrl || !signatureDataUrl.startsWith("data:image/png;base64,")) {
    return Response.json(
      { ok: false, error: "Signature image is missing or invalid." },
      { status: 422 }
    );
  }

  // New evidence-log facts: how long the document was open, and the exact
  // moment each consent checkbox was toggled.
  const viewedMs = cleanInt(data.viewedMs, 0, 86400000);
  const consentLogRaw = Array.isArray(data.consentLog)
    ? data.consentLog.slice(0, 3)
    : [];
  const consentLog = consentLogRaw
    .map((v) => cleanInt(v, 0, 4000000000000))
    .filter((v): v is number => v !== null);

  const userAgent = cleanString(data.userAgent, 500);

  const [row] = await db
    .insert(demoSignatures)
    .values({
      sessionId: cleanString(data.sessionId, 64),
      signerName,
      signerTitle,
      consentEsign,
      consentAuthority,
      consentAccuracy,
      strokePoints,
      durationMs: cleanInt(data.durationMs, 0, 3600000),
      signatureDataUrl,
      ipAddress: extractIp(event),
      userAgent,
      metadata: {
        project: "Oak St Project",
        amount: "15000.00",
        waiverType: "conditional_progress",
        viewedMs,
        consentLog,
      },
    })
    .returning();

  return Response.json({
    ok: true,
    audit: {
      id: row.id,
      signedAt: row.createdAt.toISOString(),
      ipAddress: row.ipAddress,
      strokePoints: row.strokePoints,
      durationMs: row.durationMs,
      consentsConfirmed: 3,
      viewedMs,
      consentLog: consentLog.length === 3 ? consentLog : null,
      userAgent,
      signerName,
      signerTitle,
    },
  });
}
