import { buildAdminToken } from "../_lib/auth";

const ADMIN_PIN = process.env.ADMIN_PIN || "160626";
const EXPECTED_TOKEN = buildAdminToken(ADMIN_PIN);

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "method_not_allowed" });
  }

  const authHeader = req.headers?.authorization ?? "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();

  if (token && token === EXPECTED_TOKEN) {
    return res.status(200).json({ status: "authenticated" });
  }

  return res.status(401).json({ error: "session_expired" });
}
