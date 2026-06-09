import { buildAdminToken, isPinValid } from "../_lib/auth";

const ADMIN_PIN = process.env.ADMIN_PIN || "160626";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const { pin } = req.body ?? {};

  if (typeof pin !== "string" || pin.trim().length === 0 || pin.trim().length > 20) {
    return res.status(400).json({ error: "invalid_format" });
  }

  if (isPinValid(pin, ADMIN_PIN)) {
    return res.status(200).json({ success: true, token: buildAdminToken(ADMIN_PIN) });
  }

  return res.status(401).json({ error: "authentication_failed" });
}
