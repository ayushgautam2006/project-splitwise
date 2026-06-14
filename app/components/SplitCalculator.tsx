"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

interface Person {
  id: string;
  name: string;
  color: string;
}

interface DbExpense {
  id: string;
  description: string;
  amount: number;
  paidByName: string;
  participants: { id: string; name: string; amount: number }[];
  createdAt: string;
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

interface Props {
  userId: string;
  userName: string;
}

const AVATAR_COLORS = [
  "#6366f1", "#00c896", "#f59e0b", "#ec4899", "#8b5cf6",
  "#06b6d4", "#f97316", "#14b8a6", "#e879f9", "#3b82f6",
  "#ef4444", "#84cc16", "#a855f7", "#22d3ee", "#fb923c",
];

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function nameToColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// Convert DB expenses → local People + Expenses
function deriveFromDb(dbExpenses: DbExpense[]): { people: Person[]; expenses: Expense[] } {
  const nameSet = new Set<string>();
  dbExpenses.forEach((e) => {
    nameSet.add(e.paidByName);
    e.participants.forEach((p) => nameSet.add(p.name));
  });

  const people: Person[] = Array.from(nameSet).map((name) => ({
    id: name, // use name as stable ID
    name,
    color: nameToColor(name),
  }));

  const expenses: Expense[] = dbExpenses.map((e) => ({
    id: e.id,
    description: e.description,
    amount: e.amount,
    paidById: e.paidByName,
    splitAmong: e.participants.map((p) => p.name),
  }));

  return { people, expenses };
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

export default function SplitCalculator({ userId, userName }: Props) {
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Add person form
  const [newPersonName, setNewPersonName] = useState("");

  // Add expense form
  const [expDesc, setExpDesc] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expPaidBy, setExpPaidBy] = useState("");
  const [expSplitAmong, setExpSplitAmong] = useState<string[]>([]);

  // Load data from DB on mount
  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/groups?userId=${userId}`);
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      setGroupId(data.group.id);
      const { people: p, expenses: e } = deriveFromDb(data.group.expenses);
      setPeople(p);
      setExpenses(e);
    } catch {
      setError("Could not load your data. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleAddPerson() {
    const name = newPersonName.trim();
    if (!name || people.find((p) => p.name.toLowerCase() === name.toLowerCase())) return;
    const color = nameToColor(name);
    setPeople([...people, { id: name, name, color }]);
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

  async function handleAddExpense() {
    const desc = expDesc.trim();
    const amount = parseFloat(expAmount);
    if (!desc || isNaN(amount) || amount <= 0 || !expPaidBy || expSplitAmong.length === 0) return;
    if (!groupId) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: desc,
          amount,
          paidByName: expPaidBy,
          splitAmong: expSplitAmong,
        }),
      });
      if (!res.ok) throw new Error("Failed to save expense");
      const data = await res.json();
      const dbExp: DbExpense = data.expense;

      // Optimistically add to local state
      setExpenses([
        ...expenses,
        {
          id: dbExp.id,
          description: dbExp.description,
          amount: dbExp.amount,
          paidById: dbExp.paidByName,
          splitAmong: dbExp.participants.map((p) => p.name),
        },
      ]);
      setExpDesc("");
      setExpAmount("");
      setExpPaidBy("");
      setExpSplitAmong([]);
    } catch {
      setError("Failed to save expense. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveExpense(id: string) {
    if (!groupId) return;
    // Optimistic remove
    setExpenses(expenses.filter((e) => e.id !== id));
    try {
      const res = await fetch(`/api/groups/${groupId}/expenses/${id}`, { method: "DELETE" });
      if (!res.ok) {
        // Reload to restore correct state
        await loadData();
      }
    } catch {
      await loadData();
    }
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

  function handleLogout() {
    localStorage.removeItem("splitwise_session");
    router.push("/login");
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete account");
      // Clear session and redirect — loginCode is now free for a new user
      localStorage.removeItem("splitwise_session");
      router.push("/login");
    } catch {
      setError("Failed to delete account. Please try again.");
      setShowDeleteAccountModal(false);
    } finally {
      setDeleting(false);
    }
  }

  const settlements = calcSettlements(people, expenses);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const personById: Record<string, Person> = {};
  people.forEach((p) => (personById[p.id] = p));

  const canAddExpense =
    expDesc.trim().length > 0 &&
    parseFloat(expAmount) > 0 &&
    expPaidBy.length > 0 &&
    expSplitAmong.length > 0;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#030b05", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            border: "3px solid rgba(0,230,100,0.15)",
            borderTop: "3px solid #00e868",
            animation: "spin-slow 0.8s linear infinite",
            margin: "0 auto 1rem",
          }} />
          <p style={{ color: "rgba(150,220,170,0.5)", fontSize: "0.9rem" }}>Loading your expenses…</p>
        </div>
        <style>{`@keyframes spin-slow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#030b05", position: "relative", fontFamily: "'Inter', sans-serif", color: "#d4f5de" }}>

      {/* ── Background layers (matches login page) ── */}
      <div className="sc-bg-grid" />
      <div className="sc-scanlines" />
      <div className="sc-orb sc-orb-1" />
      <div className="sc-orb sc-orb-2" />
      <div className="sc-orb sc-orb-3" />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "6.5rem 1.5rem 3rem", position: "relative", zIndex: 2 }}>

        {/* Hero header */}
        <div style={{ textAlign: "center", marginBottom: "3rem", animation: "sc-fade-up 0.6s ease both 0.1s", opacity: 0 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "#00e868", marginBottom: "1rem" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#00e868", boxShadow: "0 0 8px rgba(0,230,100,0.8)", display: "inline-block", animation: "sc-pulse-dot 2s ease-in-out infinite" }} />
            Split expenses. Zero friction.
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.1, marginBottom: "0.75rem", color: "#f0fff4" }}>
            Split expenses.{" "}
            <span style={{ background: "linear-gradient(135deg, #00e868 0%, #00c853 60%, #009e3f 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>Settle smart.</span>
          </h1>
          <p style={{ color: "rgba(180,240,200,0.5)", fontSize: "1rem", maxWidth: "500px", margin: "0 auto", lineHeight: 1.7 }}>
            Your expenses are saved to the cloud — come back anytime with your login code.
          </p>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{
            marginBottom: "1.5rem", padding: "0.9rem 1.25rem",
            background: "rgba(248,113,113,0.07)",
            border: "1px solid rgba(248,113,113,0.25)",
            borderRadius: "12px",
            color: "#ff8a8a",
            fontSize: "0.85rem",
            display: "flex", alignItems: "center", gap: "0.75rem",
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            {error}
            <button type="button" onClick={() => setError("")} style={{ marginLeft: "auto", background: "none", border: "none", color: "inherit", cursor: "pointer", fontFamily: "inherit" }}>✕</button>
          </div>
        )}

        {/* Stats bar */}
        {(people.length > 0 || expenses.length > 0) && (
          <div style={{
            background: "rgba(4,18,9,0.6)", backdropFilter: "blur(24px)",
            border: "1px solid rgba(0,220,100,0.14)",
            borderRadius: "20px", padding: "1rem 2rem",
            display: "flex", justifyContent: "center", gap: "3rem",
            marginBottom: "2rem", flexWrap: "wrap",
            boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
            animation: "sc-fade-up 0.6s ease both 0.2s", opacity: 0,
          }}>
            {[
              { value: String(people.length), label: "People", color: "#00e868" },
              { value: String(expenses.length), label: "Expenses", color: "#6366f1" },
              { value: formatCurrency(totalExpenses), label: "Total Spent", color: "#f59e0b" },
              { value: String(settlements.length), label: "Settlements", color: "#f87171" },
            ].map((stat, i) => (
              <div key={stat.label} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <div style={{ width: "1px", height: "32px", background: "rgba(0,200,80,0.15)", marginRight: "1.5rem" }} />}
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: stat.color, fontWeight: 800, fontSize: "1.4rem" }}>{stat.value}</div>
                  <div style={{ color: "rgba(120,190,140,0.45)", fontSize: "0.72rem", textTransform: "uppercase" as const, letterSpacing: "0.08em" }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="app-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", alignItems: "start" }}>

          {/* LEFT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* People Panel */}
            <div className="sc-panel" style={{ animation: "sc-fade-up 0.6s ease both 0.25s", opacity: 0 }}>
              <div className="sc-panel-header">
                <div className="sc-panel-icon" style={{ background: "rgba(0,230,100,0.1)", border: "1px solid rgba(0,200,80,0.2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00e868" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <div>
                  <div className="sc-panel-title">People</div>
                  <div className="sc-panel-subtitle">Add everyone in your group</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
                <input
                  id="add-person-input"
                  type="text"
                  placeholder="Enter name…"
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddPerson(); } }}
                  className="sc-input"
                  style={{ flex: 1 }}
                />
                <button
                  id="add-person-btn"
                  type="button"
                  onClick={handleAddPerson}
                  disabled={!newPersonName.trim()}
                  className="sc-btn-primary"
                  style={{
                    opacity: newPersonName.trim() ? 1 : 0.38,
                    cursor: newPersonName.trim() ? "pointer" : "not-allowed",
                    padding: "0.7rem 1.25rem",
                    whiteSpace: "nowrap" as const,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  Add
                </button>
              </div>

              {people.length === 0 ? (
                <div className="sc-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
                  </svg>
                  <p>Start by adding people to your group. You need at least 2 to split expenses.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {people.map((person) => (
                    <div key={person.id} className="sc-list-item">
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${person.color}, ${person.color}aa)`, boxShadow: `0 2px 10px ${person.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.78rem", color: "white", flexShrink: 0 }}>
                        {person.name.slice(0, 2).toUpperCase()}
                      </div>
                      <span style={{ flex: 1, fontWeight: 600, fontSize: "0.9rem", color: "#d0ffd8" }}>{person.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePerson(person.id)}
                        aria-label={`Remove ${person.name}`}
                        className="sc-icon-btn"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settlements Panel */}
            <div className="sc-panel" style={{ animation: "sc-fade-up 0.6s ease both 0.35s", opacity: 0 }}>
              <div className="sc-panel-header">
                <div className="sc-panel-icon" style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                </div>
                <div>
                  <div className="sc-panel-title">Settlements</div>
                  <div className="sc-panel-subtitle">Minimum transactions to settle up</div>
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className="sc-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
                  </svg>
                  <p>Add expenses to see optimal settlements.</p>
                </div>
              ) : settlements.length === 0 ? (
                <div style={{ textAlign: "center", padding: "2rem 1rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎉</div>
                  <p style={{ color: "#00e868", fontWeight: 700, fontSize: "1rem", marginBottom: "0.25rem" }}>All settled up!</p>
                  <p style={{ color: "rgba(120,190,140,0.45)", fontSize: "0.85rem" }}>Everyone is even — no payments needed.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {settlements.map((s, i) => {
                    const fromPerson = personById[s.from];
                    const toPerson = personById[s.to];
                    if (!fromPerson || !toPerson) return null;
                    return (
                      <div key={`${s.from}-${s.to}-${i}`} className="sc-list-item" style={{ padding: "0.85rem 1rem" }}>
                        <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${fromPerson.color}, ${fromPerson.color}aa)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.7rem", color: "white", flexShrink: 0 }}>
                          {fromPerson.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.85rem" }}>
                            <span style={{ fontWeight: 700, color: fromPerson.color }}>{fromPerson.name}</span>
                            {" "}<span style={{ color: "rgba(120,190,140,0.45)" }}>pays</span>{" "}
                            <span style={{ fontWeight: 700, color: toPerson.color }}>{toPerson.name}</span>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(120,190,140,0.4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${toPerson.color}, ${toPerson.color}aa)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.7rem", color: "white", flexShrink: 0 }}>
                            {toPerson.name.slice(0, 2).toUpperCase()}
                          </div>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#00e868", whiteSpace: "nowrap" as const, marginLeft: "0.25rem" }}>
                          {formatCurrency(s.amount)}
                        </span>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", borderRadius: "12px", background: "rgba(0,200,80,0.06)", border: "1px solid rgba(0,200,80,0.15)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e868" strokeWidth="2" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                    <span style={{ color: "#00e868", fontSize: "0.82rem", fontWeight: 500 }}>
                      Optimized to just {settlements.length} payment{settlements.length > 1 ? "s" : ""} to settle everyone up
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

            {/* Add Expense Panel */}
            <div className="sc-panel" style={{ animation: "sc-fade-up 0.6s ease both 0.3s", opacity: 0 }}>
              <div className="sc-panel-header">
                <div className="sc-panel-icon" style={{ background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><path d="M1 10h22" />
                  </svg>
                </div>
                <div>
                  <div className="sc-panel-title">Add Expense</div>
                  <div className="sc-panel-subtitle">Log a shared expense</div>
                </div>
              </div>

              {people.length < 2 ? (
                <div className="sc-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" /><path d="M1 10h22" />
                  </svg>
                  <p>Add at least 2 people to start logging expenses.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div>
                    <label htmlFor="exp-desc" className="sc-label">What was it for?</label>
                    <input id="exp-desc" type="text" placeholder="e.g. Dinner, Cab, Hotel…" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} className="sc-input" />
                  </div>

                  <div>
                    <label htmlFor="exp-amount" className="sc-label">Amount (₹)</label>
                    <input id="exp-amount" type="number" min="0" step="0.01" placeholder="0.00" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} className="sc-input" />
                  </div>

                  <div>
                    <label htmlFor="exp-paidby" className="sc-label">Who paid?</label>
                    <select id="exp-paidby" value={expPaidBy} onChange={(e) => setExpPaidBy(e.target.value)} className="sc-input sc-select">
                      <option value="">Select person…</option>
                      {people.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
                    </select>
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                      <label className="sc-label" style={{ marginBottom: 0 }}>Split among</label>
                      <button type="button" onClick={selectAllForSplit} style={{ background: "none", border: "none", color: "#00e868", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", padding: "0.2rem 0.4rem", borderRadius: "4px", fontFamily: "'Inter', sans-serif" }}>Select All</button>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                      {people.map((p) => {
                        const isSelected = expSplitAmong.includes(p.id);
                        return (
                          <button key={p.id} type="button" onClick={() => toggleSplitPerson(p.id)}
                            style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", borderRadius: "9999px", fontSize: "0.8rem", fontWeight: 500, fontFamily: "'Inter', sans-serif", border: `1px solid ${isSelected ? p.color : "rgba(0,200,80,0.14)"}`, background: isSelected ? `${p.color}20` : "rgba(0,0,0,0.3)", color: isSelected ? p.color : "rgba(140,210,165,0.5)", cursor: "pointer", transition: "all 0.2s ease" }}>
                            <span style={{ width: "18px", height: "18px", borderRadius: "50%", background: isSelected ? p.color : `${p.color}30`, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 700, color: isSelected ? "white" : p.color }}>
                              {isSelected ? "✓" : p.name[0]}
                            </span>
                            {p.name}
                          </button>
                        );
                      })}
                    </div>
                    {expSplitAmong.length > 0 && parseFloat(expAmount) > 0 && (
                      <div style={{ marginTop: "0.6rem", padding: "0.5rem 0.75rem", borderRadius: "8px", background: "rgba(0,200,80,0.06)", border: "1px solid rgba(0,200,80,0.12)", fontSize: "0.78rem", color: "rgba(150,220,170,0.6)" }}>
                        💡 Each person pays{" "}
                        <span style={{ color: "#00e868", fontWeight: 700 }}>
                          {formatCurrency(parseFloat(expAmount) / expSplitAmong.length)}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    id="add-expense-btn"
                    type="button"
                    onClick={handleAddExpense}
                    disabled={!canAddExpense || saving}
                    className="sc-btn-primary"
                    style={{
                      width: "100%", marginTop: "0.25rem", padding: "0.85rem",
                      opacity: canAddExpense && !saving ? 1 : 0.38,
                      cursor: canAddExpense && !saving ? "pointer" : "not-allowed",
                    }}
                  >
                    {saving ? (
                      <>
                        <div style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", animation: "spin-slow 0.7s linear infinite" }} />
                        Saving…
                      </>
                    ) : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        Add Expense
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Expense History Panel */}
            <div className="sc-panel" style={{ animation: "sc-fade-up 0.6s ease both 0.4s", opacity: 0 }}>
              <div className="sc-panel-header">
                <div className="sc-panel-icon" style={{ background: "rgba(236,72,153,0.1)", border: "1px solid rgba(236,72,153,0.2)" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                </div>
                <div>
                  <div className="sc-panel-title">Expense History</div>
                  <div className="sc-panel-subtitle">{expenses.length} expense{expenses.length !== 1 ? "s" : ""} logged</div>
                </div>
              </div>

              {expenses.length === 0 ? (
                <div className="sc-empty-state">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <p>No expenses yet. Add an expense above to get started.</p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxHeight: "400px", overflowY: "auto" }}>
                  {expenses.map((exp) => {
                    const payer = personById[exp.paidById];
                    if (!payer) return null;
                    return (
                      <div key={exp.id} className="sc-list-item" style={{ padding: "0.75rem" }}>
                        <div style={{ width: 36, height: 36, borderRadius: "50%", background: `linear-gradient(135deg, ${payer.color}, ${payer.color}aa)`, boxShadow: `0 2px 10px ${payer.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.78rem", color: "white", flexShrink: 0 }}>
                          {payer.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: "0.88rem", marginBottom: "0.15rem", color: "#d0ffd8" }}>{exp.description}</div>
                          <div style={{ color: "rgba(120,190,140,0.45)", fontSize: "0.75rem" }}>
                            Paid by{" "}<span style={{ color: payer.color, fontWeight: 600 }}>{payer.name}</span>
                            {" · "}split among {exp.splitAmong.length}
                          </div>
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#00e868" }}>{formatCurrency(exp.amount)}</div>
                          <div style={{ color: "rgba(120,190,140,0.45)", fontSize: "0.7rem" }}>{formatCurrency(exp.amount / exp.splitAmong.length)}/person</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExpense(exp.id)}
                          aria-label={`Remove ${exp.description}`}
                          className="sc-icon-btn"
                          style={{ width: "28px", height: "28px" }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
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

      {/* Delete Account confirmation modal */}
      {showDeleteAccountModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 1000,
            background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1.5rem",
            animation: "sc-fade-up 0.2s ease forwards",
          }}
          onClick={(e) => { if (e.target === e.currentTarget && !deleting) setShowDeleteAccountModal(false); }}
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
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={deleting}
                style={{
                  flex: 1, padding: "0.75rem",
                  background: "rgba(0,0,0,0.38)",
                  border: "1px solid rgba(0,200,80,0.14)",
                  borderRadius: "12px",
                  color: "rgba(140,210,165,0.6)",
                  fontSize: "0.875rem", fontWeight: 600,
                  fontFamily: "'Inter', sans-serif", cursor: deleting ? "not-allowed" : "pointer",
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
                  fontFamily: "'Inter', sans-serif", cursor: deleting ? "not-allowed" : "pointer",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
                  transition: "all 0.2s ease",
                }}
              >
                {deleting ? (
                  <>
                    <div style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTop: "2px solid white", animation: "spin-slow 0.7s linear infinite" }} />
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

        /* ── Animated Background (mirrors login page) ── */
        .sc-bg-grid {
          position: fixed; inset: 0; z-index: 0;
          background-image:
            linear-gradient(rgba(0,210,100,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,210,100,0.045) 1px, transparent 1px);
          background-size: 52px 52px;
          animation: sc-grid-pan 28s linear infinite;
          pointer-events: none;
        }
        @keyframes sc-grid-pan {
          from { background-position: 0 0; }
          to   { background-position: 52px 52px; }
        }
        .sc-orb {
          position: fixed; border-radius: 50%;
          pointer-events: none; z-index: 0;
        }
        .sc-orb-1 {
          width: 700px; height: 700px; top: -180px; left: -200px;
          background: radial-gradient(circle at 38% 38%, rgba(0,230,100,0.11) 0%, transparent 62%);
          animation: sc-orb-drift 22s ease-in-out infinite;
        }
        .sc-orb-2 {
          width: 500px; height: 500px; bottom: -100px; right: -120px;
          background: radial-gradient(circle at 60% 60%, rgba(0,190,80,0.09) 0%, transparent 62%);
          animation: sc-orb-drift 28s ease-in-out infinite reverse;
        }
        .sc-orb-3 {
          width: 300px; height: 300px; top: 40%; left: 60%;
          background: radial-gradient(circle, rgba(0,255,120,0.055) 0%, transparent 68%);
          animation: sc-orb-drift 18s ease-in-out infinite 6s;
        }
        @keyframes sc-orb-drift {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(28px,-36px) scale(1.04); }
          66%      { transform: translate(-18px,22px) scale(0.97); }
        }
        .sc-scanlines {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px, transparent 3px,
            rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px
          );
        }

        /* ── Animations ── */
        @keyframes sc-fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sc-fade-down {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes sc-pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(0.7); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        /* ── Glassmorphism Panel (mirrors login card) ── */
        .sc-panel {
          width: 100%;
          padding: 2rem;
          background: rgba(4,18,9,0.6);
          backdrop-filter: blur(32px) saturate(160%);
          -webkit-backdrop-filter: blur(32px) saturate(160%);
          border: 1px solid rgba(0,220,100,0.18);
          border-radius: 24px;
          box-shadow:
            0 0 0 1px rgba(0,255,120,0.04) inset,
            0 8px 60px rgba(0,0,0,0.65),
            0 0 100px rgba(0,180,80,0.07);
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }
        .sc-panel::before {
          content: '';
          position: absolute; top: 0; left: 12%; right: 12%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(0,230,100,0.45), transparent);
          pointer-events: none;
        }
        .sc-panel-header {
          display: flex; align-items: center; gap: 0.75rem;
          margin-bottom: 1.5rem;
        }
        .sc-panel-icon {
          width: 42px; height: 42px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sc-panel-title {
          font-weight: 800; font-size: 1.05rem;
          letter-spacing: -0.03em; color: #e8ffe8;
        }
        .sc-panel-subtitle {
          color: rgba(150,220,170,0.45); font-size: 0.78rem;
        }

        /* ── Input / Select ── */
        .sc-input {
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
        .sc-input::placeholder { color: rgba(90,170,110,0.28); }
        .sc-input:focus {
          border-color: rgba(0,225,100,0.42);
          background: rgba(0,8,3,0.48);
          box-shadow: 0 0 0 3px rgba(0,200,80,0.09), 0 2px 10px rgba(0,0,0,0.28) inset;
        }
        .sc-select { cursor: pointer; }
        .sc-select option {
          background: #0a1a0c;
          color: #d0ffd8;
        }

        /* ── Label ── */
        .sc-label {
          display: block;
          color: rgba(150,225,175,0.6);
          font-size: 0.75rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.09em;
          margin-bottom: 0.45rem;
          font-family: 'Inter', sans-serif;
        }

        /* ── Primary Button ── */
        .sc-btn-primary {
          background: linear-gradient(135deg, #00e868 0%, #00c853 50%, #009e3f 100%);
          color: #031a09; font-weight: 800; font-size: 0.91rem;
          font-family: 'Inter', sans-serif;
          border-radius: 12px; border: none; cursor: pointer;
          letter-spacing: -0.01em;
          transition: all 0.22s ease;
          position: relative; overflow: hidden;
          box-shadow: 0 0 0 1px rgba(0,225,100,0.28), 0 4px 22px rgba(0,200,80,0.28);
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .sc-btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 0 0 1px rgba(0,225,100,0.38), 0 6px 30px rgba(0,200,80,0.38);
        }
        .sc-btn-primary:active:not(:disabled) { transform: translateY(0); }

        /* ── Icon Button ── */
        .sc-icon-btn {
          background: transparent;
          border: 1px solid rgba(0,200,80,0.14);
          border-radius: 8px;
          width: 30px; height: 30px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: rgba(120,190,140,0.45);
          transition: all 0.2s ease;
          font-family: 'Inter', sans-serif;
          flex-shrink: 0;
        }
        .sc-icon-btn:hover {
          border-color: rgba(0,225,100,0.35);
          color: #00e868;
          background: rgba(0,200,80,0.07);
        }

        /* ── List Item ── */
        .sc-list-item {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.6rem 0.75rem;
          border-radius: 12px;
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(0,200,80,0.1);
          transition: all 0.2s ease;
        }
        .sc-list-item:hover {
          border-color: rgba(0,200,80,0.22);
          background: rgba(0,200,80,0.04);
        }

        /* ── Empty State ── */
        .sc-empty-state {
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          padding: 2.5rem 1rem; text-align: center;
          color: rgba(120,190,140,0.35);
        }
        .sc-empty-state svg { margin-bottom: 1rem; opacity: 0.35; }
        .sc-empty-state p {
          font-size: 0.85rem; line-height: 1.6; max-width: 260px;
        }

        @media (max-width: 1024px) {
          .app-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 640px) {
          .sc-panel { padding: 1.25rem; }
        }
      `}</style>
    </div>
  );
}
