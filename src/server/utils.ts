import type { APIEvent } from "@solidjs/start/server";

// Reads and guards the JSON body. Returns null if it is not a plain object.
export async function readJson(
  event: APIEvent
): Promise<Record<string, unknown> | null> {
  try {
    const parsed: unknown = await event.request.json();
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

// The server, not the browser, decides what the visitor's IP is.
export function extractIp(event: APIEvent): string | null {
  const forwarded = event.request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = event.request.headers.get("x-real-ip");
  if (real) return real.trim().slice(0, 64);
  return null;
}

export function cleanString(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

export function cleanEnum<T extends string>(
  value: unknown,
  allowed: readonly T[]
): T | null {
  if (typeof value !== "string") return null;
  return (allowed as readonly string[]).includes(value) ? (value as T) : null;
}

export function cleanInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const rounded = Math.round(value);
  if (rounded < min || rounded > max) return null;
  return rounded;
}

export function cleanObject(
  value: unknown,
  maxKeys = 24
): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  const entries = Object.entries(value as Record<string, unknown>).slice(0, maxKeys);
  return Object.fromEntries(entries);
}

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
