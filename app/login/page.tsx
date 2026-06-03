"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "create">("login");

  // Login tab
  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // Create tab
  const [createName, setCreateName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [copied, setCopied] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    if (!loginCode.trim()) return;
    setLoginLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginCode: loginCode.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || "Invalid login code");
      } else {
        localStorage.setItem(
          "splitwise_session",
          JSON.stringify({ userId: data.user.id, name: data.user.name, loginCode: data.user.loginCode })
        );
        router.push("/");
      }
    } catch {
      setLoginError("Network error. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    if (!createName.trim()) return;
    setCreateLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: createName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setCreateError(data.error || "Failed to create account");
      } else {
        setGeneratedCode(data.user.loginCode);
        localStorage.setItem(
          "splitwise_session",
          JSON.stringify({ userId: data.user.id, name: data.user.name, loginCode: data.user.loginCode })
        );
      }
    } catch {
      setCreateError("Network error. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleContinue() {
    router.push("/");
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid var(--border)",
    borderRadius: "12px",
    padding: "0.85rem 1.1rem",
    color: "var(--text-primary)",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    outline: "none",
    transition: "all 0.25s ease",
  };

  const btnPrimaryStyle: React.CSSProperties = {
    width: "100%",
    padding: "0.9rem",
    background: "linear-gradient(135deg, #00c896, #00a37a, #007a5c)",
    color: "#fff",
    fontWeight: 700,
    borderRadius: "12px",
    border: "none",
    cursor: "pointer",
    fontSize: "0.95rem",
    fontFamily: "inherit",
    transition: "all 0.3s ease",
    letterSpacing: "-0.01em",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--gradient-hero)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "1.5rem",
        position: "relative",
      }}
    >
      {/* Ambient orbs */}
      <div
        style={{
          position: "fixed", top: "10%", left: "-10%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,200,150,0.07) 0%, transparent 70%)",
          animation: "orb-drift 18s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed", bottom: "5%", right: "-5%",
          width: "400px", height: "400px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          animation: "orb-drift 22s ease-in-out infinite reverse",
          pointerEvents: "none",
        }}
      />

      <div
        className="panel"
        style={{
          width: "100%",
          maxWidth: "420px",
          padding: "2.5rem",
          position: "relative",
          zIndex: 1,
          animation: "fadeInUp 0.5s ease forwards",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.6rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                width: 42, height: 42, borderRadius: "12px",
                background: "linear-gradient(135deg, #00c896, #007a5c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 20px rgba(0,200,150,0.3)",
              }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.3rem", letterSpacing: "-0.04em" }}>
              Split<span className="accent-text">wise</span>
            </span>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
            No passwords. Just your code.
          </p>
        </div>

        {/* Code generated success screen */}
        {generatedCode ? (
          <div style={{ animation: "scaleIn 0.4s ease forwards" }}>
            <div
              style={{
                textAlign: "center",
                padding: "1.5rem",
                background: "rgba(0,200,150,0.06)",
                border: "1px solid rgba(0,200,150,0.2)",
                borderRadius: "16px",
                marginBottom: "1.5rem",
              }}
            >
              <div style={{ fontSize: "2rem", marginBottom: "0.75rem" }}>🎉</div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "1rem" }}>
                Account created! Your login code is:
              </p>
              <div
                style={{
                  fontFamily: "monospace",
                  fontSize: "1.4rem",
                  fontWeight: 800,
                  color: "var(--accent)",
                  letterSpacing: "0.05em",
                  padding: "0.75rem 1rem",
                  background: "rgba(0,200,150,0.08)",
                  borderRadius: "10px",
                  border: "1px solid rgba(0,200,150,0.2)",
                  marginBottom: "0.75rem",
                }}
              >
                {generatedCode}
              </div>
              <button
                id="copy-code-btn"
                type="button"
                onClick={handleCopyCode}
                style={{
                  background: "none",
                  border: "1px solid var(--border)",
                  color: copied ? "var(--accent)" : "var(--text-secondary)",
                  borderRadius: "8px",
                  padding: "0.4rem 1rem",
                  fontSize: "0.8rem",
                  fontFamily: "inherit",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "all 0.2s ease",
                }}
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                    Copy code
                  </>
                )}
              </button>
            </div>
            <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "center", marginBottom: "1.25rem" }}>
              ⚠️ Save this code — it&apos;s the only way to access your data
            </p>
            <button id="continue-btn" type="button" onClick={handleContinue} style={btnPrimaryStyle}>
              Continue to App →
            </button>
          </div>
        ) : (
          <>
            {/* Tab switcher */}
            <div
              style={{
                display: "grid", gridTemplateColumns: "1fr 1fr",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "4px",
                marginBottom: "1.75rem",
              }}
            >
              {(["login", "create"] as const).map((t) => (
                <button
                  key={t}
                  id={`tab-${t}`}
                  type="button"
                  onClick={() => setTab(t)}
                  style={{
                    padding: "0.6rem",
                    borderRadius: "9px",
                    border: "none",
                    background: tab === t ? "rgba(0,200,150,0.15)" : "transparent",
                    color: tab === t ? "var(--accent)" : "var(--text-muted)",
                    fontWeight: tab === t ? 700 : 500,
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                    cursor: "pointer",
                    transition: "all 0.25s ease",
                    outline: tab === t ? "1px solid rgba(0,200,150,0.3)" : "none",
                  }}
                >
                  {t === "login" ? "Enter Code" : "Create Account"}
                </button>
              ))}
            </div>

            {/* Login tab */}
            {tab === "login" && (
              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label htmlFor="login-code-input" style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                    Your login code
                  </label>
                  <input
                    id="login-code-input"
                    type="text"
                    placeholder="e.g. swift-fox-421"
                    value={loginCode}
                    onChange={(e) => setLoginCode(e.target.value)}
                    autoComplete="off"
                    spellCheck={false}
                    style={inputStyle}
                  />
                </div>
                {loginError && (
                  <div style={{ color: "var(--danger)", fontSize: "0.82rem", padding: "0.6rem 0.9rem", background: "var(--danger-glow)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px" }}>
                    {loginError}
                  </div>
                )}
                <button
                  id="login-submit-btn"
                  type="submit"
                  disabled={loginLoading || !loginCode.trim()}
                  style={{ ...btnPrimaryStyle, opacity: loginLoading || !loginCode.trim() ? 0.5 : 1 }}
                >
                  {loginLoading ? "Signing in…" : "Sign In →"}
                </button>
              </form>
            )}

            {/* Create tab */}
            {tab === "create" && (
              <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label htmlFor="create-name-input" style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.5rem" }}>
                    Your name
                  </label>
                  <input
                    id="create-name-input"
                    type="text"
                    placeholder="e.g. Ayush"
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                    autoComplete="off"
                    style={inputStyle}
                  />
                </div>
                {createError && (
                  <div style={{ color: "var(--danger)", fontSize: "0.82rem", padding: "0.6rem 0.9rem", background: "var(--danger-glow)", border: "1px solid rgba(248,113,113,0.2)", borderRadius: "10px" }}>
                    {createError}
                  </div>
                )}
                <button
                  id="create-submit-btn"
                  type="submit"
                  disabled={createLoading || !createName.trim()}
                  style={{ ...btnPrimaryStyle, opacity: createLoading || !createName.trim() ? 0.5 : 1 }}
                >
                  {createLoading ? "Creating…" : "Create Account →"}
                </button>
                <p style={{ color: "var(--text-muted)", fontSize: "0.78rem", textAlign: "center" }}>
                  We&apos;ll generate a unique code you can use to log in anytime
                </p>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
