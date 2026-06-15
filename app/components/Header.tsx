"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";

interface Session {
  userId: string;
  name: string;
}

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const isCalculatorPage = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function readSession() {
    try {
      const raw = localStorage.getItem("splitwise_session");
      setSession(raw ? JSON.parse(raw) : null);
    } catch {
      setSession(null);
    }
  }

  // Read session on mount
  useEffect(() => {
    readSession();

    // Same-tab: fired by login/logout pages after updating localStorage
    window.addEventListener("splitwise:session", readSession);

    // Cross-tab: fired automatically by the browser on localStorage changes
    const onStorage = (e: StorageEvent) => {
      if (e.key === "splitwise_session") readSession();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("splitwise:session", readSession);
      window.removeEventListener("storage", onStorage);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function handleLogout() {
    localStorage.removeItem("splitwise_session");
    setSession(null);
    router.push("/login");
  }

  async function handleDeleteAccount() {
    if (!session) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${session.userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      localStorage.removeItem("splitwise_session");
      setSession(null);
      setShowDeleteModal(false);
      router.push("/login");
    } catch {
      // keep modal open so user can retry
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0, left: 0, right: 0,
          zIndex: 100,
          padding: "0 2rem",
          transition: "all 0.35s ease",
          background: scrolled ? "rgba(3,11,5,0.82)" : "rgba(3,11,5,0.55)",
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

          {/* Centre tagline — only on login page, hidden on calculator */}
          {!isCalculatorPage && (
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
          )}

          {/* Right side */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {session ? (
              <>
                {/* User badge */}
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
                  {session.name}
                </div>

                {/* Logout — only shown on SplitCalculator page */}
                {isCalculatorPage && (
                  <button
                    id="logout-btn"
                    type="button"
                    onClick={handleLogout}
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
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = "#d0ffd8";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,200,80,0.4)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.color = "rgba(140,210,165,0.55)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(0,200,80,0.15)";
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Logout
                  </button>
                )}

                {/* Delete Account — only shown on SplitCalculator page */}
                {isCalculatorPage && (
                  <button
                    id="delete-account-btn"
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
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
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.16)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(248,113,113,0.5)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = "rgba(248,113,113,0.08)";
                      (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(248,113,113,0.25)";
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
              /* No session — show generic badge */
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

      {/* Delete Account confirmation modal */}
      {showDeleteModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1.5rem",
          }}
          onClick={e => { if (e.target === e.currentTarget && !deleting) setShowDeleteModal(false); }}
        >
          <div
            style={{
              maxWidth: "420px", width: "100%",
              background: "rgba(4,18,9,0.88)",
              backdropFilter: "blur(32px) saturate(160%)",
              borderRadius: "24px",
              padding: "2rem",
              border: "1px solid rgba(248,113,113,0.25)",
              boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
              textAlign: "center",
              fontFamily: "'Inter', sans-serif",
            }}
          >
            <div style={{
              width: 52, height: 52, borderRadius: "50%",
              background: "rgba(248,113,113,0.12)",
              border: "1px solid rgba(248,113,113,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 1.25rem",
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: 800, marginBottom: "0.6rem", color: "#e8ffe8" }}>Delete your account?</h2>
            <p style={{ color: "rgba(150,220,170,0.5)", fontSize: "0.875rem", lineHeight: 1.65, marginBottom: "1.75rem" }}>
              This will permanently delete your account and all expenses.
              Your login code will be freed up for someone else to use.
              <br /><br />
              <strong style={{ color: "#f87171" }}>This cannot be undone.</strong>
            </p>
            <div style={{ display: "flex", gap: "0.75rem" }}>
              <button
                id="cancel-delete-account-btn"
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                style={{
                  flex: 1, padding: "0.75rem",
                  background: "rgba(0,0,0,0.38)",
                  border: "1px solid rgba(0,200,80,0.14)",
                  borderRadius: "12px",
                  color: "rgba(140,210,165,0.6)",
                  fontSize: "0.875rem", fontWeight: 600,
                  fontFamily: "'Inter', sans-serif",
                  cursor: deleting ? "not-allowed" : "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Cancel
              </button>
              <button
                id="confirm-delete-account-btn"
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleting}
                style={{
                  flex: 1, padding: "0.75rem",
                  background: deleting ? "rgba(248,113,113,0.2)" : "linear-gradient(135deg, #ef4444, #dc2626)",
                  border: "none",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "0.875rem", fontWeight: 700,
                  fontFamily: "'Inter', sans-serif",
                  cursor: deleting ? "not-allowed" : "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
                  transition: "all 0.2s ease",
                }}
              >
                {deleting ? (
                  <>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", animation: "hdr-spin 0.7s linear infinite" }} />
                    Deleting…
                  </>
                ) : (
                  <>🗑 Yes, Delete Account</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        .hdr-desktop-only { display: flex; }
        @keyframes hdr-pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.7); }
        }
        @keyframes hdr-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @media (max-width: 700px) {
          .hdr-desktop-only { display: none !important; }
          header { padding: 0 1.1rem !important; }
        }
      `}</style>
    </>
  );
}
