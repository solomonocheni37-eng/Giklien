import {
  pgTable,
  text,
  timestamp,
  uuid,
  boolean,
  jsonb,
  integer,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------
// Analytics / site visits (custom, no third-party scripts)
// ---------------------------------------------------------------
export const siteEvents = pgTable("site_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  eventType: text("event_type").notNull(),
  sessionId: text("session_id"),

  path: text("path"),
  referrer: text("referrer"),

  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),

  userAgent: text("user_agent"),
  viewport: text("viewport"),
  ipAddress: text("ip_address"),

  metadata: jsonb("metadata"),
});

// ---------------------------------------------------------------
// Email collection / Founding Partner queue (first come, first served)
// ---------------------------------------------------------------
export const betaRequests = pgTable("beta_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  // FCFS seat number, assigned atomically by the server at insert time.
  queuePosition: integer("queue_position"),

  email: text("email").notNull(),
  emailValid: boolean("email_valid").notNull().default(false),

  name: text("name"),
  company: text("company"),
  role: text("role"),
  state: text("state"),
  message: text("message"),

  source: text("source").default("giklien-demo"),
  pagePath: text("page_path"),
  sessionId: text("session_id"),

  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),

  ipAddress: text("ip_address"),

  status: text("status").notNull().default("new"),
  consent: boolean("consent").notNull().default(false),
});

// ---------------------------------------------------------------
// Demo signatures (proves the signing pipeline end-to-end)
// ---------------------------------------------------------------
export const demoSignatures = pgTable("demo_signatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  sessionId: text("session_id"),

  signerName: text("signer_name").notNull(),
  signerTitle: text("signer_title").notNull(),

  consentEsign: boolean("consent_esign").notNull(),
  consentAuthority: boolean("consent_authority").notNull(),
  consentAccuracy: boolean("consent_accuracy").notNull(),

  strokePoints: integer("stroke_points").notNull(),
  durationMs: integer("duration_ms"),

  signatureDataUrl: text("signature_data_url"),

  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),

  metadata: jsonb("metadata"),
});

// ---------------------------------------------------------------
// Core product (ready for the magic-link engine later)
// ---------------------------------------------------------------
export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  name: text("name").notNull(),
  address: text("address").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
});

export const waivers = pgTable("waivers", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  projectId: uuid("project_id")
    .references(() => projects.id)
    .notNull(),

  magicToken: text("magic_token").unique().notNull(),
  status: text("status").notNull().default("pending"),

  amount: text("amount").notNull(),
  signerName: text("signer_name"),

  signatureDataUrl: text("signature_data_url"),
  ipAddress: text("ip_address"),
  deviceFingerprint: text("device_fingerprint"),
  signedAt: timestamp("signed_at", { withTimezone: true }),
});
