import { useState, useCallback } from "react";

interface AuthResponse {
  success: boolean;
  token?: string;
  error?: string;
}

export function useAdminAuth() {
  const [isAuthed, setIsAuthed] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(
    localStorage.getItem("admin_token")
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if session is still valid
  const checkSession = useCallback(async () => {
    const token = localStorage.getItem("admin_token");
    if (!token) return false;

    try {
      const res = await fetch("/api/admin/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSessionToken(token);
        setIsAuthed(true);
        return true;
      }
      // Session expired
      localStorage.removeItem("admin_token");
      return false;
    } catch {
      return false;
    }
  }, []);

  // Validate PIN against server
  const validatePin = useCallback(
    async (pin: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/auth/validate-pin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pin }),
        });

        if (res.status === 429) {
          setError("rate_limited");
          return false;
        }

        if (!res.ok) {
          setError("invalid_pin");
          return false;
        }

        const data: AuthResponse = await res.json();
        if (data.success && data.token) {
          localStorage.setItem("admin_token", data.token);
          setSessionToken(data.token);
          setIsAuthed(true);
          return true;
        }

        setError("auth_failed");
        return false;
      } catch (err) {
        setError("network_error");
        console.error("Auth error:", err);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Logout
  const logout = useCallback(() => {
    localStorage.removeItem("admin_token");
    setSessionToken(null);
    setIsAuthed(false);
    setError(null);
  }, []);

  return {
    isAuthed,
    sessionToken,
    isLoading,
    error,
    validatePin,
    checkSession,
    logout,
  };
}
