"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        padding: "0 1.5rem",
        transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        background: scrolled
          ? "rgba(10, 12, 16, 0.88)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(1.5)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(1.5)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}
    >
      <nav
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          height: "68px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >

        <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "10px",
              background: "linear-gradient(135deg, #00c896, #007a5c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 16px rgba(0,200,150,0.3)",
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.15)" />
              <path d="M12 6v6l4 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M8 12h8M12 8v8" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: "1.2rem", color: "#f0f2f5", letterSpacing: "-0.02em" }}>
            Split<span style={{ color: "#00c896" }}>Wise</span>
          </span>
        </Link>

        <div
          className="desktop-only"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            color: "var(--text-muted)",
            fontSize: "0.82rem",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          Split expenses instantly
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "9999px",
              background: "rgba(0,200,150,0.1)",
              border: "1px solid rgba(0,200,150,0.2)",
              color: "var(--accent)",
              fontSize: "0.75rem",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
            }}
          >
            <div
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: "#00c896",
                animation: "pulse-ring 2s ease-in-out infinite",
              }}
            />
            Free Forever
          </div>
        </div>
      </nav>

      <style>{`
        @media (max-width: 700px) {
          .desktop-only { display: none !important; }
        }
      `}</style>
    </header>
  );
}
