import crypto from "crypto";
import bcrypt from "bcryptjs";
import { env } from "../config/env.js";

const BCRYPT_SALT_ROUNDS = 12;

export async function hashPassword(plainPassword: string): Promise<string> {
  return await bcrypt.hash(plainPassword, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(plainPassword: string, storedHash: string): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!storedHash) return { valid: false, needsRehash: false };

  // Check if hash is a modern bcrypt hash
  if (storedHash.startsWith("$2a$") || storedHash.startsWith("$2b$") || storedHash.startsWith("$2y$")) {
    const valid = await bcrypt.compare(plainPassword, storedHash);
    return { valid, needsRehash: false };
  }

  // Fallback for legacy SHA-256 hash migration
  const sha256 = crypto.createHash("sha256").update(plainPassword).digest("hex");
  if (sha256 === storedHash) {
    return { valid: true, needsRehash: true };
  }

  return { valid: false, needsRehash: false };
}

export interface SessionPayload {
  username: string;
  role: string;
  expiresAt: number;
}

export function createSessionToken(username: string, role = "admin"): string {
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12; // 12 hours
  const payload: SessionPayload = { username, role, expiresAt };
  const payloadJson = JSON.stringify(payload);
  const payloadBase64 = Buffer.from(payloadJson).toString("base64url");
  const signature = crypto
    .createHmac("sha256", env.ADMIN_SESSION_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const parts = token.split(".");
    if (parts.length !== 2) return null;

    const [payloadBase64, signature] = parts;
    const expectedSignature = crypto
      .createHmac("sha256", env.ADMIN_SESSION_SECRET)
      .update(payloadBase64)
      .digest("base64url");

    // Timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf8");
    const payload: SessionPayload = JSON.parse(payloadJson);

    if (!payload.expiresAt || payload.expiresAt < Date.now()) {
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}
