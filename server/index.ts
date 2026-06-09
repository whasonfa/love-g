import express from "express";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import crypto from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Store active sessions with timestamps
const adminSessions = new Map<string, number>();

// Rate limiting middleware for PIN validation
const pinLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 attempts per window
  message: "Demasiados intentos. Intenta más tarde.",
  standardHeaders: false,
  skipSuccessfulRequests: true,
  handler: (_req, res) => {
    res.status(429).json({ error: "rate_limited" });
  },
});

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Middleware
  app.use(express.json());

  // Admin PIN from environment variable
  const ADMIN_PIN = process.env.ADMIN_PIN || "160626";
  const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");
  const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours

  // API endpoint for PIN validation
  app.post("/api/auth/validate-pin", pinLimiter, (req, res) => {
    const { pin } = req.body;

    // Sanitize input - reject non-string or overly long values
    if (typeof pin !== "string" || pin.length > 20) {
      return res.status(400).json({ error: "invalid_format" });
    }

    // Validate PIN using constant-time comparison (prevents timing attacks)
    const isValid = crypto.timingSafeEqual(
      Buffer.from(pin),
      Buffer.from(ADMIN_PIN)
    );

    if (isValid) {
      // Generate session token
      const sessionToken = crypto
        .randomBytes(32)
        .toString("hex");

      // Store session with expiry
      adminSessions.set(sessionToken, Date.now() + SESSION_TIMEOUT);

      return res.json({ success: true, token: sessionToken });
    }

    // Return generic error (don't reveal PIN is wrong)
    res.status(401).json({ error: "authentication_failed" });
  });

  // Validate session middleware
  const validateSession = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "no_token" });
    }

    const sessionTime = adminSessions.get(token);
    if (!sessionTime || Date.now() > sessionTime) {
      return res.status(401).json({ error: "session_expired" });
    }

    next();
  };

  // Example protected endpoint
  app.get("/api/admin/status", validateSession, (_req, res) => {
    res.json({ status: "authenticated" });
  });

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  app.use(express.static(staticPath));

  // Handle client-side routing - serve index.html for all routes
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticPath, "index.html"));
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log("✅ Admin PIN endpoint: POST /api/auth/validate-pin");
  });
}

startServer().catch(console.error);
