"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { authApi } from "@/lib/auth-api";
import { getDeviceId } from "@/lib/device-id";
import { useAuthStore } from "@/lib/auth-store";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export function GoogleSignInButton({ onDone }: { onDone: () => void }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const setSession = useAuthStore((state) => state.setSession);

  useEffect(() => {
    if (!scriptLoaded || !window.google || !buttonRef.current) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google sign-in is not configured (missing client ID).");
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        setError(null);
        try {
          const deviceId = getDeviceId();
          const result = await authApi.loginWithGoogle({ idToken: response.credential, deviceId });
          setSession(result.user, result.accessToken);
          onDone();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Sign-in failed");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: 320,
      text: "continue_with",
    });
  }, [scriptLoaded, onDone, setSession]);

  return (
    <div className="flex flex-col items-center gap-3">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />
      <div ref={buttonRef} />
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
