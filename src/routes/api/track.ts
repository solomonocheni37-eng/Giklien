import type { APIEvent } from "@solidjs/start/server";
import { db } from "~/db/client";
import { siteEvents } from "~/db/schema";
import { cleanEnum, cleanObject, cleanString, extractIp, readJson } from "~/server/utils";

const EVENT_TYPES = [
  "page_view",
  "cta_click",
  "email_submit",
  "demo_complete",
  "demo_dispute",
] as const;

export async function POST(event: APIEvent) {
  const data = await readJson(event);
  if (!data) {
    return Response.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const eventType = cleanEnum(data.eventType, EVENT_TYPES);
  if (!eventType) {
    return Response.json({ ok: false, error: "Unknown event type." }, { status: 422 });
  }

  await db.insert(siteEvents).values({
    eventType,
    sessionId: cleanString(data.sessionId, 64),
    path: cleanString(data.path, 300),
    referrer: cleanString(data.referrer, 500),
    utmSource: cleanString(data.utmSource, 100),
    utmMedium: cleanString(data.utmMedium, 100),
    utmCampaign: cleanString(data.utmCampaign, 100),
    userAgent: cleanString(data.userAgent, 500),
    viewport: cleanString(data.viewport, 40),
    ipAddress: extractIp(event),
    metadata: cleanObject(data.metadata),
  });

  return Response.json({ ok: true });
}
