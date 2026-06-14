"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface HeaderProps {
  /** When provided, shows user badge + logout + delete-account controls */
  userName?: string;
  onLogout?: () => void;
  onDeleteAccount?: () => void;
}

export default function Header({ userName, onLogout, onDeleteAccount }: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          padding: "0 2rem",
          transition: "all 0.35s ease",
          background: scrolled
            ? "rgba(3,11,5,0.9)"
            : "rgba(3,11,5,0.75)",
          backdropFilter: "blur(24px) saturate(160%)",
          WebkitBackdropFilter: "blur(24px) saturate(160%)",
          borderBottom: scrolled
            ? "1px solid rgba(0,210,100,0.18)"
            : "1px solid rgba(0,210,100,0.1)",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            height: "62px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <div
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: "linear-gradient(135deg, #00e868, #009e3f)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 0 1px rgba(0,230,100,0.3), 0 3px 14px rgba(0,200,80,0.3)",
                flexShrink: 0,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: "1.1rem", letterSpacing: "-0.05em", color: "#e8ffe8" }}>
              Split<span style={{ background: "linear-gradient(135deg, #00e868, #00c853)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>wise</span>
            </span>
          </Link>

          {/* Centre tagline — hide on mobile */}
          <div
            className="hdr-desktop-only"
            style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              color: "rgba(120,190,140,0.45)",
              fontSize: "0.78rem",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e868", boxShadow: "0 0 8px rgba(0,230,100,0.8)", display: "inline-block", animation: "hdr-pulse-dot 2s ease-in-out infinite" }} />
            Split expenses. Zero friction.
          </div>

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {userName ? (
              /* Dashboard controls */
              <>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: "0.4rem",
                  color: "#00e868", fontSize: "0.75rem", fontWeight: 600,
                  letterSpacing: "0.05em", textTransform: "uppercase" as const,
                  padding: "0.3rem 0.85rem",
                  background: "rgba(0,200,80,0.07)",
                  border: "1px solid rgba(0,200,80,0.2)",
                  borderRadius: "9999px",
                }}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                  {userName}
                </div>
                {onLogout && (
                  <button
                    id="logout-btn"
                    type="button"
                    onClick={onLogout}
                    style={{
                      background: "transparent",
                      border: "1px solid rgba(0,200,80,0.15)",
                      borderRadius: "9999px",
                      padding: "0.3rem 0.8rem",
                      color: "rgba(140,210,165,0.55)",
                      fontSize: "0.72rem",
                      fontFamily: "'Inter', sans-serif",
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: "0.35rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                )}
                {onDeleteAccount && (
                  <button
                    id="delete-account-btn"
                    type="button"
                    onClick={onDeleteAccount}
                    style={{
                      background: "rgba(248,113,113,0.08)",
                      border: "1px solid rgba(248,113,113,0.25)",
                      borderRadius: "9999px",
                      padding: "0.3rem 0.8rem",
                      color: "#f87171",
                      fontSize: "0.72rem",
                      fontFamily: "'Inter', sans-serif",
                      cursor: "pointer",
                      display: "inline-flex", alignItems: "center", gap: "0.35rem",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                    </svg>
                    Delete Account
                  </button>
                )}
              </>
            ) : (
              /* Login page badge */
              <div style={{
                padding: "0.3rem 0.85rem",
                borderRadius: "9999px",
                background: "rgba(0,200,80,0.07)",
                border: "1px solid rgba(0,200,80,0.2)",
                color: "rgba(0,230,100,0.7)",
                fontSize: "0.72rem", fontWeight: 600,
                letterSpacing: "0.04em",
              }}>
                Free · No signup required
              </div>
            )}
          </div>
        </div>
      </header>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .hdr-desktop-only { display: flex; }
        @keyframes hdr-pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.7); }
        }
        @media (max-width: 700px) {
          .hdr-desktop-only { display: none !important; }
          header { padding: 0 1.1rem !important; }
        }
      `}</style>
    </>
  );
}
