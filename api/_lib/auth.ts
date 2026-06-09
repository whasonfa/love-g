import crypto from "crypto";

export const normalizePin = (value: string) => value.replace(/\D/g, "");

export const isPinValid = (candidate: string, adminPin: string) => {
  const normalizedCandidate = normalizePin(candidate);
  const normalizedAdminPin = normalizePin(adminPin);

  if (!normalizedCandidate || !normalizedAdminPin) {
    return false;
  }

  try {
    return crypto.timingSafeEqual(
      Buffer.from(normalizedCandidate),
      Buffer.from(normalizedAdminPin)
    );
  } catch {
    return false;
  }
};

export const buildAdminToken = (adminPin: string) => {
  const normalizedAdminPin = normalizePin(adminPin);
  return `admin-${crypto
    .createHash("sha256")
    .update(normalizedAdminPin)
    .digest("hex")}`;
};
