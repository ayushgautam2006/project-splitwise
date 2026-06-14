"use client";

export default function Footer() {
  return (
    <>
      <footer
        style={{
          borderTop: "1px solid rgba(0,210,100,0.08)",
          padding: "1.25rem 2rem",
          fontFamily: "'Inter', sans-serif",
          position: "relative",
          zIndex: 2,
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
            gap: "0.75rem",
          }}
        >
          {/* Left — branding */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
            <div
              style={{
                width: 26, height: 26, borderRadius: 7,
                background: "linear-gradient(135deg, #00e868, #009e3f)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 0 0 1px rgba(0,230,100,0.25), 0 2px 10px rgba(0,200,80,0.2)",
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </div>
            <span style={{ fontWeight: 700, fontSize: "0.88rem", letterSpacing: "-0.04em", color: "#e8ffe8" }}>
              Split<span style={{ background: "linear-gradient(135deg, #00e868, #00c853)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>wise</span>
            </span>
            <span style={{ color: "rgba(100,175,125,0.35)", fontSize: "0.75rem" }}>
              · Built for groups
            </span>
          </div>

          {/* Right — copy + link */}
          <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
            <span style={{ color: "rgba(100,175,125,0.3)", fontSize: "0.75rem" }}>
              © {new Date().getFullYear()} Splitwise · Made by Ayush
            </span>
            <a
              href="/contact"
              style={{
                fontSize: "0.75rem",
                color: "rgba(100,175,125,0.3)",
                textDecoration: "none",
                transition: "color 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(150,220,170,0.55)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(100,175,125,0.3)")}
            >
              Contact
            </a>
          </div>
        </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @media (max-width: 640px) {
          footer > div > div:last-child { flex-direction: column; gap: 0.35rem; align-items: flex-start; }
          footer > div { flex-direction: column; }
        }
      `}</style>
    </>
  );
}
