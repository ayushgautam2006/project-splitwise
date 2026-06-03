"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import SplitCalculator from "./components/SplitCalculator";

interface Session {
  userId: string;
  name: string;
  loginCode: string;
}

export default function Home() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("splitwise_session");
      if (!raw) {
        router.replace("/login");
        return;
      }
      const parsed = JSON.parse(raw) as Session;
      if (!parsed.userId || !parsed.name) {
        router.replace("/login");
        return;
      }
      setSession(parsed);
    } catch {
      router.replace("/login");
    } finally {
      setChecking(false);
    }
  }, [router]);

  if (checking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--gradient-hero)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Loading…</div>
      </div>
    );
  }

  if (!session) return null;

  return <SplitCalculator userId={session.userId} userName={session.name} />;
}
