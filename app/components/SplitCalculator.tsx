"use client";

import { useState } from "react";

/* ─── Types ─────────────────────────────────────────────── */
interface Person {
  id: string;
  name: string;
  color: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidById: string;
  splitAmong: string[];
}

interface Settlement {
  from: string;
  to: string;
  amount: number;
}

/* ─── Constants ─────────────────────────────────────────── */
const AVATAR_COLORS = [
  "#6366f1", "#00c896", "#f59e0b", "#ec4899", "#8b5cf6",
  "#06b6d4", "#f97316", "#14b8a6", "#e879f9", "#3b82f6",
  "#ef4444", "#84cc16", "#a855f7", "#22d3ee", "#fb923c",
];

/* ─── Helpers ───────────────────────────────────────────── */
function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function calcSettlements(people: Person[], expenses: Expense[]): Settlement[] {
  const balances: Record<string, number> = {};
  people.forEach((p) => (balances[p.id] = 0));

  expenses.forEach((exp) => {
    const share = exp.amount / exp.splitAmong.length;
    balances[exp.paidById] = (balances[exp.paidById] || 0) + exp.amount;
    exp.splitAmong.forEach((pid) => {
      balances[pid] = (balances[pid] || 0) - share;
    });
  });

  const debtors: { id: string; amount: number }[] = [];
  const creditors: { id: string; amount: number }[] = [];

  Object.entries(balances).forEach(([id, bal]) => {
    const rounded = Math.round(bal * 100) / 100;
    if (rounded < -0.01) debtors.push({ id, amount: -rounded });
    else if (rounded > 0.01) creditors.push({ id, amount: rounded });
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const settlements: Settlement[] = [];
  let di = 0;
  let ci = 0;

  while (di < debtors.length && ci < creditors.length) {
    const transfer = Math.min(debtors[di].amount, creditors[ci].amount);
    if (transfer > 0.01) {
      settlements.push({
        from: debtors[di].id,
        to: creditors[ci].id,
        amount: Math.round(transfer * 100) / 100,
      });
    }
    debtors[di].amount -= transfer;
    creditors[ci].amount -= transfer;
    if (debtors[di].amount < 0.01) di++;
    if (creditors[ci].amount < 0.01) ci++;
  }

  return settlements;
}

function formatCurrency(amount: number): string {
  return "₹" + amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ═══════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════ */
export default function SplitCalculator() {
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Add person form
  const [newPersonName, setNewPersonName] = useState("");

  // Add expense form
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expPaidBy, setExpPaidBy] = useState("");
  const [expSplitAmong, setExpSplitAmong] = useState<string[]>([]);

  /* ── People handlers ───────────────────────────────────── */
  function handleAddPerson() {
    const name = newPersonName.trim();
    if (!name) return;
    const id = genId();
    const color = AVATAR_COLORS[people.length % AVATAR_COLORS.length];
    setPeople([...people, { id, name, color }]);
    setNewPersonName("");
  }

  function handleRemovePerson(id: string) {
    setPeople(people.filter((p) => p.id !== id));
    setExpenses(
      expenses
        .filter((e) => e.paidById !== id)
        .map((e) => ({ ...e, splitAmong: e.splitAmong.filter((pid) => pid !== id) }))
        .filter((e) => e.splitAmong.length > 0)
    );
    if (expPaidBy === id) setExpPaidBy("");
    setExpSplitAmong(expSplitAmong.filter((pid) => pid !== id));
  }

  /* ── Expense handlers ──────────────────────────────────── */
  function handleAddExpense() {
    const desc = expDesc.trim();
    const amount = parseFloat(expAmount);
    if (!desc || isNaN(amount) || amount <= 0 || !expPaidBy || expSplitAmong.length === 0) return;
    setExpenses([
      ...expenses,
      { id: genId(), description: desc, amount, paidById: expPaidBy, splitAmong: [...expSplitAmong] },
    ]);
    setExpDesc("");
    setExpAmount("");
    setExpPaidBy("");
    setExpSplitAmong([]);
  }

  function handleRemoveExpense(id: string) {
    setExpenses(expenses.filter((e) => e.id !== id));
  }

  function toggleSplitPerson(pid: string) {
    if (expSplitAmong.includes(pid)) {
      setExpSplitAmong(expSplitAmong.filter((id) => id !== pid));
    } else {
      setExpSplitAmong([...expSplitAmong, pid]);
    }
  }

  function selectAllForSplit() {
    setExpSplitAmong(people.map((p) => p.id));
  }

  /* ── Computed ───────────────────────────────────────────── */
  const settlements = calcSettlements(people, expenses);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const personById: Record<string, Person> = {};
  people.forEach((p) => (personById[p.id] = p));

  const canAddExpense =
    expDesc.trim().length > 0 &&
    parseFloat(expAmount) > 0 &&
    expPaidBy.length > 0 &&
    expSplitAmong.length > 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--gradient-hero)", position: "relative" }}>
      {/* ── Background Orbs ── */}
      <div
        style={{
          position: "fixed", top: "10%", left: "-10%",
          width: "600px", height: "600px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,200,150,0.06) 0%, transparent 70%)",
          animation: "orb-drift 18s ease-in-out infinite",
          pointerEvents: "none", zIndex: 0,
        }}
      />
      <div
        style={{
          position: "fixed", bottom: "5%", right: "-5%",
          width: "500px", height: "500px", borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 70%)",
          animation: "orb-drift 22s ease-in-out infinite reverse",
          pointerEvents: "none", zIndex: 0,
        }}
      />

      {/* ── Content Container ── */}
      <div
        style={{
          maxWidth: "1200px", margin: "0 auto",
          padding: "7rem 1.5rem 3rem",
          position: "relative", zIndex: 1,
        }}
      >
        {/* ── Hero Header ── */}
        <div style={{ textAlign: "center", marginBottom: "3rem", animation: "fadeInUp 0.6s ease forwards" }}>
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              color: "var(--accent)", fontSize: "0.78rem", fontWeight: 600,
              letterSpacing: "0.1em", textTransform: "uppercase" as const,
              padding: "0.35rem 1rem",
              background: "var(--accent-glow)",
              border: "1px solid rgba(0,200,150,0.25)",
              borderRadius: "9999px", marginBottom: "1.25rem",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
            No login required — just split!
          </div>
          <h1
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900,
              letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "0.75rem",
            }}
          >
            Split expenses.{" "}
            <span className="accent-text">Settle smart.</span>
          </h1>
          <p
            style={{
              color: "var(--text-secondary)", fontSize: "1rem",
              maxWidth: "500px", margin: "0 auto", lineHeight: 1.7,
            }}
          >
            Add your group, log expenses, and instantly see who owes whom — no accounts, no fuss.
          </p>
        </div>

        {/* ── Stats Bar ── */}
        {(people.length > 0 || expenses.length > 0) && (
          <div
            className="glass"
            style={{
              borderRadius: "var(--radius-xl)", padding: "1rem 2rem",
              display: "flex", justifyContent: "center",
              gap: "3rem", marginBottom: "2rem", flexWrap: "wrap",
            }}
          >
            {[
              { value: String(people.length), label: "People", color: "var(--accent)" },
              { value: String(expenses.length), label: "Expenses", color: "#6366f1" },
              { value: formatCurrency(totalExpenses), label: "Total Spent", color: "#f59e0b" },
              { value: String(settlements.length), label: "Settlements", color: "var(--danger)" },
            ].map((stat, i) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center", gap: i > 0 ? "0" : "0" }}>
                {i > 0 && (
                  <div style={{ width: "1px", height: "32px", background: "var(--border)", marginRight: "1.5rem" }} />
                )}
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: stat.color, fontWeight: 800, fontSize: "1.4rem" }}>{stat.value}</div>
                  <div style={{ color: "var(--text-muted)", fontSize: "0.72rem", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Main Grid ── */}
        <div
          className="app-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}
        >
          {/* ═══════ LEFT COLUMN ═══════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* ── People Panel ── */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-icon" style={{ background: "rgba(0,200,150,0.12)", border: "1px solid rgba(0,200,150,0.2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div>
                  <div className="panel-title">People</div>
                  <div className="panel-subtitle">Add everyone in your group</div>
                </div>
              </div>

              {/* Add person input */}
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  id="add-person-input"
                  type="text"
                  placeholder="Enter name..."
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddPerson();
                    }
                  }}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "0.75rem 1rem",
                    color: "var(--text-primary)",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    outline: "none",
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddPerson}
                  disabled={!newPersonName.trim()}
                  style={{
                    background: newPersonName.trim() ? "linear-gradient(135deg, #00c896, #00a37a, #007a5c)" : "rgba(255,255,255,0.05)",
                    color: newPersonName.trim() ? "#fff" : "var(--text-muted)",
                    fontWeight: 600,
                    padding: "0.7rem 1.25rem",
                    borderRadius: "12px",
                    border: "none",
                    cursor: newPersonName.trim() ? "pointer" : "not-allowed",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    fontSize: "0.9rem",
                    fontFamily: "inherit",
                    whiteSpace: "nowrap" as const,
                    transition: "all 0.3s ease",
                    opacity: newPersonName.trim() ? 1 : 0.5,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Add
                </button>
              </div>

              {/* People list */}
              {people.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" />
                    <path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <p>Start by adding people to your group. You need at least 2 to split expenses.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {people.map((person) => (
                    <div
                      key={person.id}
                      style={{
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        padding: "0.6rem 0.75rem", borderRadius: "12px",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid var(--border)",
                        animation: "scaleIn 0.3s ease forwards",
                      }}
                    >
                      <div
                        style={{
                          width: 34, height: 34, borderRadius: "50%",
                          background: `linear-gradient(135deg, ${person.color}, ${person.color}aa)`,
                          boxShadow: `0 2px 10px ${person.color}30`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: 700, fontSize: "0.78rem", color: "white", flexShrink: 0,
                        }}
                      >
                        {person.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem" }}>{person.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePerson(person.id)}
                        aria-label={`Remove ${person.name}`}
                        style={{
                          background: "transparent",
                          border: "1px solid var(--border)",
                          borderRadius: "8px",
                          width: "30px", height: "30px",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          cursor: "pointer", color: "var(--text-secondary)",
                          fontFamily: "inherit",
                        }}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                          <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Settlements Panel ── */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-icon" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <div>
                  <div className="panel-title">Settlements</div>
                  <div className="panel-subtitle">Minimum transactions to settle up</div>
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                  <p>Add expenses to see optimal settlements. We&apos;ll find the fewest payments needed.</p>
                </div>
              ) : settlements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎉</div>
                  <p style={{ color: "var(--accent)", fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>
                    All settled up!
                  </p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    Everyone is even — no payments needed.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {settlements.map((s, i) => {
                    const fromPerson = personById[s.from];
                    const toPerson = personById[s.to];
                    if (!fromPerson || !toPerson) return null;
                    return (
                      <div
                        key={`${s.from}-${s.to}-${i}`}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.75rem",
                          padding: "0.85rem 1rem", borderRadius: "12px",
                          background: "rgba(255,255,255,0.025)",
                          border: "1px solid var(--border)",
                          animation: `fadeInUp 0.4s ease ${i * 0.08}s forwards`,
                          opacity: 0,
                        }}
                      >
                        {/* From avatar */}
                        <div
                          style={{
                            width: 32, height: 32, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${fromPerson.color}, ${fromPerson.color}aa)`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "0.7rem", color: "white", flexShrink: 0,
                          }}
                        >
                          {fromPerson.name.slice(0, 2).toUpperCase()}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.85rem" }}>
                            <span style={{ fontWeight: 700, color: fromPerson.color }}>{fromPerson.name}</span>
                            {" "}
                            <span style={{ color: "var(--text-muted)" }}>pays</span>
                            {" "}
                            <span style={{ fontWeight: 700, color: toPerson.color }}>{toPerson.name}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                          <div
                            style={{
                              width: 32, height: 32, borderRadius: "50%",
                              background: `linear-gradient(135deg, ${toPerson.color}, ${toPerson.color}aa)`,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontWeight: 700, fontSize: "0.7rem", color: "white", flexShrink: 0,
                            }}
                          >
                            {toPerson.name.slice(0, 2).toUpperCase()}
                          </div>
                        </div>

                        <span
                          style={{
                            fontWeight: 800, fontSize: "0.95rem",
                            color: "var(--accent)", whiteSpace: "nowrap" as const, marginLeft: "0.25rem",
                          }}
                        >
                          {formatCurrency(s.amount)}
                        </span>
                      </div>
                    );
                  })}

                  <div
                    style={{
                      marginTop: "0.75rem", padding: "0.75rem 1rem",
                      borderRadius: "12px",
                      background: "rgba(0,200,150,0.06)",
                      border: "1px solid rgba(0,200,150,0.15)",
                      display: "flex", alignItems: "center", gap: "0.5rem",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00c896" strokeWidth="2" strokeLinecap="round">
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    <span style={{ color: "var(--accent)", fontSize: "0.82rem", fontWeight: 500 }}>
                      Optimized to just {settlements.length} payment{settlements.length > 1 ? "s" : ""} to settle everyone up
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════ RIGHT COLUMN ═══════ */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* ── Add Expense Panel ── */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-icon" style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <path d="M1 10h22" />
                  </svg>
                </div>
                <div>
                  <div className="panel-title">Add Expense</div>
                  <div className="panel-subtitle">Log a shared expense</div>
                </div>
              </div>

              {people.length < 2 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                    <path d="M1 10h22" />
                  </svg>
                  <p>Add at least 2 people to start logging expenses.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Description */}
                  <div>
                    <label htmlFor="exp-desc" style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.4rem" }}>
                      What was it for?
                    </label>
                    <input
                      id="exp-desc"
                      type="text"
                      placeholder="e.g. Dinner, Cab, Hotel..."
                      value={expDesc}
                      onChange={(e) => setExpDesc(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "0.75rem 1rem",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label htmlFor="exp-amount" style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.4rem" }}>
                      Amount (₹)
                    </label>
                    <input
                      id="exp-amount"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      value={expAmount}
                      onChange={(e) => setExpAmount(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "0.75rem 1rem",
                        color: "var(--text-primary)",
                        fontSize: "0.9rem",
                        fontFamily: "inherit",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Paid by */}
                  <div>
                    <label htmlFor="exp-paidby" style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 500, marginBottom: "0.4rem" }}>
                      Who paid?
                    </label>
                    <select
                      id="exp-paidby"
                      value={expPaidBy}
                      onChange={(e) => setExpPaidBy(e.target.value)}
                      style={{
                        width: "100%",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "0.75rem 1rem",
                        color: expPaidBy ? "var(--text-primary)" : "var(--text-muted)",
                        fontSize: "0.9rem",
                        fontFamily: "inherit",
                        outline: "none",
                        cursor: "pointer",
                      }}
                    >
                      <option value="">Select person...</option>
                      {people.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Split among */}
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <label style={{ color: "var(--text-secondary)", fontSize: "0.8rem", fontWeight: 500 }}>Split among</label>
                      <button
                        type="button"
                        onClick={selectAllForSplit}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--accent)",
                          fontSize: "0.75rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "0.2rem 0.4rem",
                          borderRadius: "4px",
                          fontFamily: "inherit",
                        }}
                      >
                        Select All
                      </button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {people.map((p) => {
                        const isSelected = expSplitAmong.includes(p.id);
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleSplitPerson(p.id)}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.4rem",
                              padding: "0.35rem 0.75rem",
                              borderRadius: "9999px",
                              fontSize: "0.8rem",
                              fontWeight: 500,
                              fontFamily: "inherit",
                              border: `1px solid ${isSelected ? p.color : "var(--border)"}`,
                              background: isSelected ? `${p.color}20` : "var(--bg-card)",
                              color: isSelected ? p.color : "var(--text-secondary)",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <span
                              style={{
                                width: "18px", height: "18px", borderRadius: "50%",
                                background: isSelected ? p.color : `${p.color}30`,
                                display: "inline-flex", alignItems: "center", justifyContent: "center",
                                fontSize: "0.6rem", fontWeight: 700,
                                color: isSelected ? "white" : p.color,
                              }}
                            >
                              {isSelected ? "✓" : p.name[0]}
                            </span>
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                    {expSplitAmong.length > 0 && parseFloat(expAmount) > 0 && (
                      <div
                        style={{
                          marginTop: "0.6rem", padding: "0.5rem 0.75rem",
                          borderRadius: "8px",
                          background: "rgba(0,200,150,0.06)",
                          border: "1px solid rgba(0,200,150,0.12)",
                          fontSize: "0.78rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        💡 Each person pays{" "}
                        <span style={{ color: "var(--accent)", fontWeight: 700 }}>
                          {formatCurrency(parseFloat(expAmount) / expSplitAmong.length)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={handleAddExpense}
                    disabled={!canAddExpense}
                    style={{
                      width: "100%",
                      marginTop: "0.25rem",
                      padding: "0.85rem",
                      background: canAddExpense ? "linear-gradient(135deg, #00c896, #00a37a, #007a5c)" : "rgba(255,255,255,0.05)",
                      color: canAddExpense ? "#fff" : "var(--text-muted)",
                      fontWeight: 600,
                      borderRadius: "12px",
                      border: "none",
                      cursor: canAddExpense ? "pointer" : "not-allowed",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      fontFamily: "inherit",
                      transition: "all 0.3s ease",
                      opacity: canAddExpense ? 1 : 0.5,
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    Add Expense
                  </button>
                </div>
              )}
            </div>

            {/* ── Expense History Panel ── */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-icon" style={{ background: "rgba(236,72,153,0.12)", border: "1px solid rgba(236,72,153,0.2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <div className="panel-title">Expense History</div>
                  <div className="panel-subtitle">{expenses.length} expense{expenses.length !== 1 ? "s" : ""} logged</div>
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className="empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <p>No expenses yet. Add an expense above to get started.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "400px", overflowY: "auto" }}>
                  {expenses.map((exp) => {
                    const payer = personById[exp.paidById];
                    if (!payer) return null;
                    return (
                      <div
                        key={exp.id}
                        style={{
                          display: "flex", alignItems: "center", gap: "0.75rem",
                          padding: "0.75rem", borderRadius: "12px",
                          background: "rgba(255,255,255,0.025)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            width: 36, height: 36, borderRadius: "50%",
                            background: `linear-gradient(135deg, ${payer.color}, ${payer.color}aa)`,
                            boxShadow: `0 2px 10px ${payer.color}30`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: 700, fontSize: "0.78rem", color: "white", flexShrink: 0,
                          }}
                        >
                          {payer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.15rem" }}>
                            {exp.description}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                            Paid by{" "}
                            <span style={{ color: payer.color, fontWeight: 600 }}>{payer.name}</span>
                            {" · "}split among {exp.splitAmong.length}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "var(--accent)" }}>
                            {formatCurrency(exp.amount)}
                          </div>
                          <div style={{ color: "var(--text-muted)", fontSize: "0.7rem" }}>
                            {formatCurrency(exp.amount / exp.splitAmong.length)}/person
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExpense(exp.id)}
                          aria-label={`Remove ${exp.description}`}
                          style={{
                            background: "transparent",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            width: "28px", height: "28px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", color: "var(--text-secondary)",
                            flexShrink: 0, fontFamily: "inherit",
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .app-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
