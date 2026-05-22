"use client";

export default function Footer() {
  return (
    <footer
      style={{
        background: "var(--bg-secondary)",
        borderTop: "1px solid var(--border)",
        padding: "1.75rem 1.5rem",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #00c896, #007a5c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="rgba(255,255,255,0.15)" />
              <path d="M12 6v6l4 2" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
          <span style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--text-secondary)" }}>
            Split<span style={{ color: "var(--accent)" }}>Wise</span>
          </span>
          <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>
            — Split expenses, not friendships
          </span>
        </div>

        <p style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
          © {new Date().getFullYear()} SplitWise. Built with ❤️ — No data stored, everything runs in your browser.
        </p>
      </div>
    </footer>
  );
}
