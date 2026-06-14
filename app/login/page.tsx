"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Footer from "../components/Footer";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "create">("login");

  const [loginCode, setLoginCode] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

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
        window.dispatchEvent(new Event("splitwise:session"));
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
        window.dispatchEvent(new Event("splitwise:session"));
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .lp-root {
          min-height: 100vh;
          background: #030b05;
          font-family: 'Inter', sans-serif;
          color: #d4f5de;
          position: relative;
          overflow-x: hidden;
        }

        /* ── Background ── */
        .bg-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(0,210,100,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,210,100,0.045) 1px, transparent 1px);
          background-size: 52px 52px;
          animation: grid-pan 28s linear infinite;
          pointer-events: none;
        }
        @keyframes grid-pan {
          from { background-position: 0 0; }
          to   { background-position: 52px 52px; }
        }

        .orb {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0;
        }
        .orb-1 {
          width: 700px; height: 700px;
          top: -180px; left: -200px;
          background: radial-gradient(circle at 38% 38%, rgba(0,230,100,0.11) 0%, transparent 62%);
          animation: orb-drift 22s ease-in-out infinite;
        }
        .orb-2 {
          width: 500px; height: 500px;
          bottom: -100px; right: -120px;
          background: radial-gradient(circle at 60% 60%, rgba(0,190,80,0.09) 0%, transparent 62%);
          animation: orb-drift 28s ease-in-out infinite reverse;
        }
        .orb-3 {
          width: 300px; height: 300px;
          top: 40%; left: 60%;
          background: radial-gradient(circle, rgba(0,255,120,0.055) 0%, transparent 68%);
          animation: orb-drift 18s ease-in-out infinite 6s;
        }
        @keyframes orb-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(28px,-36px) scale(1.04); }
          66%      { transform: translate(-18px,22px) scale(0.97); }
        }

        .scanlines {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px, transparent 3px,
            rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px
          );
        }

        /* ── Layout ── */
        .lp-inner {
          position: relative; z-index: 2;
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr auto;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 2rem;
          gap: 0;
        }



        /* ── Hero (left column) ── */
        .lp-hero {
          grid-column: 1;
          grid-row: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 6rem 3rem 4rem 0;
          animation: fade-up 0.6s ease both 0.1s;
        }

        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 0.5rem;
          font-size: 0.75rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          color: #00e868;
          margin-bottom: 1.5rem;
        }
        .hero-eyebrow-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00e868;
          box-shadow: 0 0 8px rgba(0,230,100,0.8);
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.7); }
        }

        .hero-headline {
          font-size: clamp(2.4rem, 4.5vw, 3.6rem);
          font-weight: 900;
          line-height: 1.06;
          letter-spacing: -0.04em;
          color: #f0fff4;
          margin-bottom: 1.4rem;
        }
        .hero-headline .hl-accent {
          background: linear-gradient(135deg, #00e868 0%, #00c853 60%, #009e3f 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-sub {
          font-size: 1.05rem;
          line-height: 1.7;
          color: rgba(180, 240, 200, 0.55);
          max-width: 440px;
          margin-bottom: 2.5rem;
        }

        /* Feature pills */
        .feature-list {
          display: flex; flex-direction: column; gap: 0.75rem;
          margin-bottom: 3rem;
        }
        .feature-item {
          display: flex; align-items: center; gap: 0.75rem;
          font-size: 0.9rem; color: rgba(180,240,200,0.7);
        }
        .feature-check {
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(0,200,80,0.12);
          border: 1px solid rgba(0,200,80,0.25);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* Social proof */
        .social-proof {
          display: flex; align-items: center; gap: 1rem;
        }
        .avatars {
          display: flex;
        }
        .avatar {
          width: 30px; height: 30px; border-radius: 50%;
          border: 2px solid #030b05;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.65rem; font-weight: 700;
          margin-left: -8px;
        }
        .avatar:first-child { margin-left: 0; }
        .av1 { background: linear-gradient(135deg,#00b84f,#007a35); color: #d0ffd8; }
        .av2 { background: linear-gradient(135deg,#1a6b44,#0d4a2e); color: #b0efc8; }
        .av3 { background: linear-gradient(135deg,#005c38,#003d26); color: #90ddb0; }
        .av4 { background: linear-gradient(135deg,#004d2e,#003020); color: #70cc98; }
        .social-text {
          font-size: 0.8rem;
          color: rgba(160,230,185,0.5);
          line-height: 1.4;
        }
        .social-text strong {
          color: rgba(200,255,220,0.75);
          font-weight: 600;
        }

        /* ── Auth card (right column) ── */
        .lp-auth {
          grid-column: 2;
          grid-row: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6rem 0 4rem 2rem;
          animation: fade-up 0.6s ease both 0.2s;
        }

        .glass-card {
          width: 100%;
          max-width: 400px;
          padding: 2.25rem;
          background: rgba(4, 18, 9, 0.6);
          backdrop-filter: blur(32px) saturate(160%);
          -webkit-backdrop-filter: blur(32px) saturate(160%);
          border: 1px solid rgba(0, 220, 100, 0.18);
          border-radius: 24px;
          box-shadow:
            0 0 0 1px rgba(0,255,120,0.04) inset,
            0 8px 60px rgba(0,0,0,0.65),
            0 0 100px rgba(0,180,80,0.07);
          position: relative;
        }
        .glass-card::before {
          content: '';
          position: absolute;
          top: 0; left: 12%; right: 12%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,230,100,0.55), transparent);
        }

        .card-header {
          margin-bottom: 1.75rem;
        }
        .card-title {
          font-size: 1.15rem; font-weight: 800;
          letter-spacing: -0.03em; color: #e8ffe8;
          margin-bottom: 0.3rem;
        }
        .card-subtitle {
          font-size: 0.8rem;
          color: rgba(150,220,170,0.45);
        }

        /* Tab switcher */
        .tab-bar {
          display: grid; grid-template-columns: 1fr 1fr;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(0,200,80,0.12);
          border-radius: 12px;
          padding: 3px; gap: 3px;
          margin-bottom: 1.5rem;
        }
        .tab-btn {
          padding: 0.55rem;
          border-radius: 9px; border: none;
          cursor: pointer;
          font-size: 0.82rem; font-family: 'Inter', sans-serif;
          font-weight: 500;
          transition: all 0.22s ease;
          color: rgba(140,210,165,0.45);
          background: transparent;
        }
        .tab-btn.active {
          background: rgba(0,200,80,0.14);
          color: #00e868; font-weight: 700;
          box-shadow: 0 0 0 1px rgba(0,200,80,0.22) inset;
        }
        .tab-btn:hover:not(.active) {
          background: rgba(0,200,80,0.06);
          color: rgba(150,220,170,0.7);
        }

        /* Form */
        .field-stack { display: flex; flex-direction: column; gap: 0.9rem; }
        .field-label {
          display: block;
          color: rgba(150,225,175,0.6);
          font-size: 0.75rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.09em;
          margin-bottom: 0.45rem;
        }
        .glass-input {
          width: 100%;
          background: rgba(0,0,0,0.38);
          border: 1px solid rgba(0,200,80,0.14);
          border-radius: 12px;
          padding: 0.8rem 1rem;
          color: #d0ffd8;
          font-size: 0.92rem; font-family: 'Inter', sans-serif;
          outline: none;
          transition: all 0.2s ease;
          box-shadow: 0 2px 10px rgba(0,0,0,0.28) inset;
          caret-color: #00e868;
        }
        .glass-input::placeholder { color: rgba(90,170,110,0.28); }
        .glass-input:focus {
          border-color: rgba(0,225,100,0.42);
          background: rgba(0,8,3,0.48);
          box-shadow: 0 0 0 3px rgba(0,200,80,0.09), 0 2px 10px rgba(0,0,0,0.28) inset;
        }

        .btn-primary {
          width: 100%; padding: 0.85rem;
          background: linear-gradient(135deg, #00e868 0%, #00c853 50%, #009e3f 100%);
          color: #031a09; font-weight: 800; font-size: 0.91rem;
          font-family: 'Inter', sans-serif;
          border-radius: 12px; border: none; cursor: pointer;
          letter-spacing: -0.01em;
          transition: all 0.22s ease;
          position: relative; overflow: hidden;
          box-shadow: 0 0 0 1px rgba(0,225,100,0.28), 0 4px 22px rgba(0,200,80,0.28);
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 0 1px rgba(0,225,100,0.38), 0 6px 30px rgba(0,200,80,0.38);
        }
        .btn-primary:active:not(:disabled) { transform: translateY(0); }
        .btn-primary:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }

        .error-box {
          color: #ff8a8a; font-size: 0.8rem;
          padding: 0.6rem 0.85rem;
          background: rgba(255,60,60,0.07);
          border: 1px solid rgba(255,80,80,0.18);
          border-radius: 9px;
        }
        .muted-hint {
          color: rgba(110,185,135,0.38);
          font-size: 0.74rem; text-align: center; line-height: 1.5;
        }

        /* Divider */
        .card-divider {
          display: flex; align-items: center; gap: 0.75rem;
          margin: 1.25rem 0;
        }
        .card-divider-line {
          flex: 1; height: 1px;
          background: rgba(0,200,80,0.1);
        }
        .card-divider-text {
          font-size: 0.72rem;
          color: rgba(120,190,140,0.35);
          white-space: nowrap;
        }

        /* Trust row inside card */
        .card-trust {
          display: flex; align-items: center; justify-content: center;
          gap: 1.25rem; margin-top: 1.25rem;
          padding-top: 1.1rem;
          border-top: 1px solid rgba(0,200,80,0.09);
        }
        .trust-item {
          display: flex; align-items: center; gap: 0.35rem;
          font-size: 0.72rem;
          color: rgba(120,190,140,0.38);
        }
        .trust-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: rgba(0,200,80,0.35);
        }

        /* Success screen */
        .success-card {
          text-align: center; padding: 1.4rem;
          background: rgba(0,200,80,0.05);
          border: 1px solid rgba(0,200,80,0.18);
          border-radius: 16px; margin-bottom: 1.25rem;
          animation: scale-in 0.4s cubic-bezier(0.22,1,0.36,1) both;
        }
        .success-emoji { font-size: 1.9rem; margin-bottom: 0.65rem; }
        .success-label {
          color: rgba(155,225,180,0.6); font-size: 0.82rem; margin-bottom: 0.9rem;
        }
        .code-display {
          font-family: 'JetBrains Mono', monospace;
          font-size: 1.3rem; font-weight: 800;
          color: #00e868; letter-spacing: 0.06em;
          padding: 0.7rem 1rem;
          background: rgba(0,200,80,0.07);
          border-radius: 9px;
          border: 1px solid rgba(0,200,80,0.2);
          margin-bottom: 0.7rem;
          text-shadow: 0 0 18px rgba(0,230,100,0.38);
        }
        .copy-btn {
          background: rgba(0,200,80,0.07);
          border: 1px solid rgba(0,200,80,0.16);
          color: rgba(130,215,160,0.65);
          border-radius: 8px; padding: 0.38rem 0.9rem;
          font-size: 0.78rem; font-family: 'Inter', sans-serif;
          cursor: pointer;
          display: inline-flex; align-items: center; gap: 0.38rem;
          transition: all 0.18s ease;
        }
        .copy-btn:hover, .copy-btn.copied { color: #00e868; border-color: rgba(0,220,90,0.32); }
        .save-hint {
          color: rgba(110,185,135,0.38); font-size: 0.73rem;
          text-align: center; margin-bottom: 1.1rem; line-height: 1.5;
        }



        /* Animations */
        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fade-down {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.94); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ── Responsive ── */
        @media (max-width: 800px) {
          .lp-inner {
            grid-template-columns: 1fr;
            padding: 0 1.25rem;
          }
          .lp-hero {
            grid-column: 1; grid-row: 1;
            padding: 5.5rem 0 1.5rem;
            text-align: center;
            align-items: center;
          }
          .hero-sub { max-width: 100%; }
          .feature-list { align-items: flex-start; width: 100%; max-width: 340px; }
          .social-proof { justify-content: center; }
          .lp-auth {
            grid-column: 1; grid-row: 2;
            padding: 0 0 2.5rem;
          }
        }
      `}</style>

      <div className="lp-root">
        <div className="bg-grid" />
        <div className="scanlines" />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />

        <div className="lp-inner">

          {/* ── Hero ── */}
          <section className="lp-hero">
            <div className="hero-eyebrow">
              <span className="hero-eyebrow-dot" />
              Split expenses. Zero friction.
            </div>

            <h1 className="hero-headline">
              Stop chasing<br />
              friends for<br />
              <span className="hl-accent">money.</span>
            </h1>

            <p className="hero-sub">
              Add a group, log expenses, and see exactly who owes what — all without accounts, passwords, or app installs.
            </p>

            <div className="feature-list">
              {[
                "One code to access your data, always",
                "Split bills equally or by custom amounts",
                "Settle up with one tap",
              ].map((f) => (
                <div className="feature-item" key={f}>
                  <div className="feature-check">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#00e868" strokeWidth="3" strokeLinecap="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  </div>
                  {f}
                </div>
              ))}
            </div>
          </section>

          {/* ── Auth card ── */}
          <section className="lp-auth">
            <div className="glass-card">

              {generatedCode ? (
                <div style={{ animation: "scale-in 0.4s ease both" }}>
                  <div className="success-card">
                    <p className="success-label">Account created! Your login code:</p>
                    <div className="code-display">{generatedCode}</div>
                    <button
                      id="copy-code-btn"
                      type="button"
                      onClick={handleCopyCode}
                      className={`copy-btn${copied ? " copied" : ""}`}
                    >
                      {copied ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M20 6L9 17l-5-5" /></svg>
                          Copied!
                        </>
                      ) : (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>
                          Copy code
                        </>
                      )}
                    </button>
                  </div>
                  <p className="save-hint">Save this — it&apos;s the only key to your account</p>
                  <button id="continue-btn" type="button" onClick={handleContinue} className="btn-primary">
                    Go to Dashboard →
                  </button>
                </div>
              ) : (
                <>
                  <div className="card-header">
                    <p className="card-title">Get started — it&apos;s instant</p>
                    <p className="card-subtitle">No email. No password. Just a code.</p>
                  </div>

                  <div className="tab-bar">
                    {(["create", "login"] as const).map((t) => (
                      <button
                        key={t}
                        id={`tab-${t}`}
                        type="button"
                        onClick={() => setTab(t)}
                        className={`tab-btn${tab === t ? " active" : ""}`}
                      >
                        {t === "create" ? "New here?" : "Have a code?"}
                      </button>
                    ))}
                  </div>

                  {tab === "create" && (
                    <form onSubmit={handleCreate} className="field-stack">
                      <div>
                        <label htmlFor="create-name-input" className="field-label">Your name</label>
                        <input
                          id="create-name-input"
                          type="text"
                          placeholder="e.g. Ayush"
                          value={createName}
                          onChange={(e) => setCreateName(e.target.value)}
                          autoComplete="off"
                          className="glass-input"
                        />
                      </div>
                      {createError && <div className="error-box">{createError}</div>}
                      <button
                        id="create-submit-btn"
                        type="submit"
                        disabled={createLoading || !createName.trim()}
                        className="btn-primary"
                      >
                        {createLoading ? "Creating…" : "Create my account →"}
                      </button>
                      <p className="muted-hint">We&apos;ll generate a code — that&apos;s your login, forever</p>
                    </form>
                  )}

                  {tab === "login" && (
                    <form onSubmit={handleLogin} className="field-stack">
                      <div>
                        <label htmlFor="login-code-input" className="field-label">Login code</label>
                        <input
                          id="login-code-input"
                          type="text"
                          placeholder="e.g. swift-fox-421"
                          value={loginCode}
                          onChange={(e) => setLoginCode(e.target.value)}
                          autoComplete="off"
                          spellCheck={false}
                          className="glass-input"
                        />
                      </div>
                      {loginError && <div className="error-box">{loginError}</div>}
                      <button
                        id="login-submit-btn"
                        type="submit"
                        disabled={loginLoading || !loginCode.trim()}
                        className="btn-primary"
                      >
                        {loginLoading ? "Signing in…" : "Sign in →"}
                      </button>
                    </form>
                  )}

                  <div className="card-trust">
                    {["No email needed", "Instant setup", "Free forever"].map((t) => (
                      <div className="trust-item" key={t}>
                        <div className="trust-dot" />
                        {t}
                      </div>
                    ))}
                  </div>
                </>
              )}

            </div>
          </section>

        </div>
        <Footer />
      </div>
    </>
  );
}