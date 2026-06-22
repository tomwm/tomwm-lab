"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import SplitEditor from "@/components/SplitEditor";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
import { calcBalances, calcBalancesGlobal, calcSettlements, mergeCouplesToBalances, equalSplits, type Expense } from "@/lib/settle";

type Trip = {
  id: string;
  code: string;
  name: string;
  members: string[];
  member_shares: Record<string, number>;
  couples: [string, string][];
  expenses: Expense[];
};

type View = "expenses" | "settle";

export default function TripPage() {
  const { code } = useParams<{ code: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState<View>("expenses");
  const [copied, setCopied] = useState(false);

  // Add expense form
  const [showAdd, setShowAdd] = useState(false);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [customSplits, setCustomSplits] = useState<Record<string, number> | null>(null);
  const [saving, setSaving] = useState(false);

  // Split editor for existing expense
  const [editingSplitId, setEditingSplitId] = useState<string | null>(null);
  const [splitDraft, setSplitDraft] = useState<Record<string, number>>({});

  // Add member
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [addMemberError, setAddMemberError] = useState("");

  // Couples
  const [couplesDraft, setCouplesDraft] = useState<[string, string][]>([]);
  const [savingCouples, setSavingCouples] = useState(false);

  // Global member shares
  const [globalSharesMode, setGlobalSharesMode] = useState(false);
  const [sharesDraft, setSharesDraft] = useState<Record<string, number>>({});
  const [savingShares, setSavingShares] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`${BASE}/api/trips/${code}`);
    if (!res.ok) {
      setError("Trip not found. Check your code.");
      setLoading(false);
      return;
    }
    const data = await res.json();
    setTrip(data);
    if (!paidBy && data.members.length) setPaidBy(data.members[0]);
    setCouplesDraft(data.couples || []);
    const hasGlobal = Object.keys(data.member_shares || {}).length > 0;
    setGlobalSharesMode(hasGlobal);
    setSharesDraft(hasGlobal ? data.member_shares : equalSplits(data.members));
    setLoading(false);
  }, [code, paidBy]);

  useEffect(() => { load(); }, [load]);

  function copyCode() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openAdd() {
    if (!trip) return;
    setDesc("");
    setAmount("");
    setPaidBy(trip.members[0]);
    setCustomSplits(null);
    setShowAdd(true);
  }

  async function submitExpense(e: React.FormEvent) {
    e.preventDefault();
    if (!trip || !desc || !amount || !paidBy) return;
    setSaving(true);
    const splits = customSplits ?? equalSplits(trip.members);
    await fetch(`${BASE}/api/expenses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tripCode: code, description: desc, amount: Number(amount), paidBy, splits }),
    });
    setSaving(false);
    setShowAdd(false);
    load();
  }

  async function deleteExpense(id: string) {
    await fetch(`${BASE}/api/expenses/${id}`, { method: "DELETE" });
    load();
  }

  function startEditSplit(expense: Expense) {
    setEditingSplitId(expense.id);
    setSplitDraft({ ...expense.splits });
  }

  async function addMember(e: React.FormEvent) {
    e.preventDefault();
    const name = newMemberName.trim();
    if (!name) return;
    setAddingMember(true);
    setAddMemberError("");
    const res = await fetch(`${BASE}/api/trips/${code}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      setNewMemberName("");
      setShowAddMember(false);
      load();
    } else {
      const data = await res.json();
      setAddMemberError(data.error ?? "Failed to add member");
    }
    setAddingMember(false);
  }

  async function saveCouples(newCouples: [string, string][]) {
    setSavingCouples(true);
    await fetch(`${BASE}/api/trips/${code}/couples`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ couples: newCouples }),
    });
    setSavingCouples(false);
    load();
  }

  async function saveGlobalShares() {
    if (!trip) return;
    setSavingShares(true);
    const shares = globalSharesMode ? sharesDraft : {};
    await fetch(`${BASE}/api/trips/${code}/shares`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberShares: shares }),
    });
    setSavingShares(false);
    load();
  }

  async function saveSplits(id: string) {
    const total = Object.values(splitDraft).reduce((a, b) => a + b, 0);
    if (Math.abs(total - 100) > 0.5) return;
    await fetch(`${BASE}/api/expenses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ splits: splitDraft }),
    });
    setEditingSplitId(null);
    load();
  }

if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--muted)]">
        Loading trip…
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="text-center py-16">
        <p className="text-[var(--danger)] mb-4">{error || "Trip not found"}</p>
        <a href="/" className="text-[var(--accent)] underline">Back to home</a>
      </div>
    );
  }

  const hasGlobalShares = Object.keys(trip.member_shares || {}).length > 0;
  const rawBalances = hasGlobalShares
    ? calcBalancesGlobal(trip.members, trip.expenses, trip.member_shares)
    : calcBalances(trip.members, trip.expenses);
  const balances = mergeCouplesToBalances(rawBalances, trip.couples || []);
  const settlements = calcSettlements(balances);
  const sharesTotalValid = Math.abs(Object.values(sharesDraft).reduce((a, b) => a + b, 0) - 100) <= 0.5;
  const totalSpend = trip.expenses.reduce((s, e) => s + Number(e.amount), 0);
  const splitTotal = Object.values(splitDraft).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{trip.name}</h1>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <p className="text-[var(--muted)] text-sm">{trip.members.join(", ")}</p>
              {!showAddMember && (
                <button
                  onClick={() => { setShowAddMember(true); setAddMemberError(""); setNewMemberName(""); }}
                  className="text-xs text-[var(--accent)] font-medium hover:underline"
                >
                  + Add member
                </button>
              )}
            </div>
            {showAddMember && (
              <form onSubmit={addMember} className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="Name"
                  autoFocus
                  className="border border-[var(--border)] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] w-32"
                />
                <button
                  type="submit"
                  disabled={addingMember || !newMemberName.trim()}
                  className="bg-[var(--accent)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40"
                >
                  {addingMember ? "…" : "Add"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddMember(false)}
                  className="text-xs text-[var(--muted)] hover:text-[var(--text)]"
                >
                  Cancel
                </button>
                {addMemberError && <p className="text-xs text-[var(--danger)]">{addMemberError}</p>}
              </form>
            )}
          </div>
          <button
            onClick={copyCode}
            className="flex flex-col items-center bg-[var(--accent-light)] rounded-xl px-4 py-2 hover:bg-[var(--accent)] hover:text-white group transition-colors"
          >
            <span className="font-mono font-bold text-xl tracking-widest text-[var(--accent)] group-hover:text-white">
              {trip.code}
            </span>
            <span className="text-xs text-[var(--muted)] group-hover:text-white/80 mt-0.5">
              {copied ? "Copied!" : "Tap to copy"}
            </span>
          </button>
        </div>

        <div className="flex gap-4 mt-4 text-sm">
          <div className="flex-1 bg-[var(--bg)] rounded-xl p-3 text-center">
            <div className="font-bold text-lg">£{totalSpend.toFixed(2)}</div>
            <div className="text-[var(--muted)]">Total spend</div>
          </div>
          <div className="flex-1 bg-[var(--bg)] rounded-xl p-3 text-center">
            <div className="font-bold text-lg">{trip.expenses.length}</div>
            <div className="text-[var(--muted)]">Expenses</div>
          </div>
          <div className="flex-1 bg-[var(--bg)] rounded-xl p-3 text-center">
            <div className="font-bold text-lg">{trip.members.length}</div>
            <div className="text-[var(--muted)]">Travellers</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(["expenses", "settle"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              view === v
                ? "bg-[var(--accent)] text-white"
                : "bg-white border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"
            }`}
          >
            {v === "expenses" ? "Expenses" : "Settle up"}
          </button>
        ))}
      </div>

      {view === "expenses" && (
        <>
          {/* Add expense form */}
          {showAdd ? (
            <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Add expense</h2>
              <form onSubmit={submitExpense} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="What was it? (e.g. Taxi to airport)"
                  className="border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  required
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]">£</span>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      step="0.01"
                      min="0.01"
                      className="w-full border border-[var(--border)] rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      required
                    />
                  </div>
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    {trip.members.map((m) => (
                      <option key={m} value={m}>{m} paid</option>
                    ))}
                  </select>
                </div>

                {/* Split options */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Split</span>
                    <button
                      type="button"
                      onClick={() => setCustomSplits(customSplits ? null : equalSplits(trip.members))}
                      className="text-xs text-[var(--accent)] underline"
                    >
                      {customSplits ? "Reset to equal" : "Customise %"}
                    </button>
                  </div>

                  {customSplits ? (
                    <SplitEditor
                      members={trip.members}
                      splits={customSplits}
                      onChange={setCustomSplits}
                      totalAmount={Number(amount) || undefined}
                    />
                  ) : (
                    <p className="text-sm text-[var(--muted)] bg-[var(--bg)] rounded-lg px-3 py-2">
                      Equal split between all {trip.members.length} travellers
                    </p>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 border border-[var(--border)] py-2.5 rounded-xl font-semibold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={
                      saving ||
                      (customSplits !== null &&
                        Math.abs(Object.values(customSplits).reduce((a, b) => a + b, 0) - 100) > 0.5)
                    }
                    className="flex-1 bg-[var(--accent)] text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40"
                  >
                    {saving ? "Saving…" : "Add expense"}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <button
              onClick={openAdd}
              className="bg-[var(--accent)] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
            >
              + Add expense
            </button>
          )}

          {/* Expense list */}
          {trip.expenses.length === 0 ? (
            <div className="text-center py-12 text-[var(--muted)]">
              <p className="text-4xl mb-3">🧾</p>
              <p>No expenses yet. Add the first one!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {trip.expenses.map((exp) => (
                <div key={exp.id} className="bg-white rounded-2xl border border-[var(--border)] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">{exp.description}</p>
                      <p className="text-sm text-[var(--muted)]">
                        Paid by <span className="font-medium text-[var(--text)]">{exp.paid_by}</span>
                      </p>
                    </div>
                    <span className="font-bold text-lg shrink-0">£{Number(exp.amount).toFixed(2)}</span>
                  </div>

                  {editingSplitId === exp.id ? (
                    <div className="mt-3 border-t border-[var(--border)] pt-3">
                      <p className="text-xs font-semibold text-[var(--muted)] mb-2 uppercase tracking-wide">Edit split</p>
                      <SplitEditor
                        members={trip.members}
                        splits={splitDraft}
                        onChange={setSplitDraft}
                        totalAmount={Number(exp.amount)}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setEditingSplitId(null)}
                          className="flex-1 border border-[var(--border)] py-1.5 rounded-lg text-sm font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveSplits(exp.id)}
                          disabled={Math.abs(splitTotal - 100) > 0.5}
                          className="flex-1 bg-[var(--accent)] text-white py-1.5 rounded-lg text-sm font-medium disabled:opacity-40"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(exp.splits).map(([m, pct]) => (
                        <span key={m} className="text-xs bg-[var(--bg)] text-[var(--muted)] px-2 py-0.5 rounded-full">
                          {m}: {pct}%
                        </span>
                      ))}
                    </div>
                  )}

                  {editingSplitId !== exp.id && (
                    <div className="flex gap-3 mt-3 pt-3 border-t border-[var(--border)]">
                      <button
                        onClick={() => startEditSplit(exp)}
                        className="text-xs text-[var(--accent)] font-medium hover:underline"
                      >
                        Edit split
                      </button>
                      <button
                        onClick={() => deleteExpense(exp.id)}
                        className="text-xs text-[var(--danger)] font-medium hover:underline ml-auto"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {view === "settle" && (
        <div className="flex flex-col gap-4">
          {/* Overall split override */}
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-semibold">Overall split</h2>
              <button
                onClick={() => {
                  const next = !globalSharesMode;
                  setGlobalSharesMode(next);
                  if (next && Object.keys(sharesDraft).length === 0) {
                    setSharesDraft(equalSplits(trip.members));
                  }
                }}
                className="text-xs text-[var(--accent)] underline"
              >
                {globalSharesMode ? "Reset to per-expense" : "Set overall %"}
              </button>
            </div>
            <p className="text-xs text-[var(--muted)] mb-3">
              {globalSharesMode
                ? "Each person's share of the total trip spend. Overrides per-expense splits."
                : "Settlement uses per-expense splits. Switch to set one overall % per person."}
            </p>

            {globalSharesMode && (
              <>
                <SplitEditor
                  members={trip.members}
                  splits={sharesDraft}
                  onChange={setSharesDraft}
                  totalAmount={totalSpend}
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setSharesDraft(equalSplits(trip.members))}
                    className="text-xs text-[var(--accent)] underline"
                  >
                    Reset equal
                  </button>
                  <button
                    onClick={saveGlobalShares}
                    disabled={savingShares || !sharesTotalValid}
                    className="ml-auto bg-[var(--accent)] text-white text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40"
                  >
                    {savingShares ? "Saving…" : "Apply"}
                  </button>
                </div>
              </>
            )}

            {hasGlobalShares && (
              <div className="mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--accent)] inline-block" />
                <span className="text-xs text-[var(--accent)] font-medium">Overall splits active</span>
                <button
                  onClick={async () => {
                    setGlobalSharesMode(false);
                    await fetch(`${BASE}/api/trips/${code}/shares`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ memberShares: {} }),
                    });
                    load();
                  }}
                  className="text-xs text-[var(--muted)] underline ml-1"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Couples */}
          {trip.members.length >= 2 && (
            <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm">
              <h2 className="font-semibold mb-1">Linked finances</h2>
              <p className="text-xs text-[var(--muted)] mb-3">
                Mark couples or people who share finances — their balances are combined for settlement.
              </p>

              {couplesDraft.map(([a, b], i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium flex-1">{a} & {b}</span>
                  <button
                    onClick={() => {
                      const next = couplesDraft.filter((_, j) => j !== i);
                      setCouplesDraft(next);
                      saveCouples(next);
                    }}
                    className="text-xs text-[var(--danger)] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}

              {/* Pair picker */}
              {(() => {
                const paired = new Set(couplesDraft.flat());
                const available = trip.members.filter((m) => !paired.has(m));
                if (available.length < 2) return null;
                return (
                  <div className="flex items-center gap-2 mt-2">
                    <select
                      id="couple-a"
                      className="flex-1 border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      defaultValue=""
                    >
                      <option value="" disabled>Person 1</option>
                      {available.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <span className="text-[var(--muted)] text-sm">&</span>
                    <select
                      id="couple-b"
                      className="flex-1 border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                      defaultValue=""
                    >
                      <option value="" disabled>Person 2</option>
                      {available.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button
                      disabled={savingCouples}
                      onClick={() => {
                        const a = (document.getElementById("couple-a") as HTMLSelectElement).value;
                        const b = (document.getElementById("couple-b") as HTMLSelectElement).value;
                        if (!a || !b || a === b) return;
                        const next: [string, string][] = [...couplesDraft, [a, b]];
                        setCouplesDraft(next);
                        saveCouples(next);
                      }}
                      className="bg-[var(--accent)] text-white text-sm font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 whitespace-nowrap"
                    >
                      Link
                    </button>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Balances */}
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm">
            <h2 className="font-semibold mb-3">Who's owed what</h2>
            <div className="flex flex-col gap-2">
              {trip.members.map((m) => {
                const bal = balances[m] ?? 0;
                return (
                  <div key={m} className="flex items-center gap-3">
                    <div className="w-24 text-sm font-medium truncate">{m}</div>
                    <div className="flex-1 h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${bal >= 0 ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`}
                        style={{
                          width: `${Math.min(100, (Math.abs(bal) / Math.max(...Object.values(balances).map(Math.abs), 1)) * 100)}%`,
                        }}
                      />
                    </div>
                    <div
                      className={`text-sm font-semibold w-20 text-right ${
                        bal >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"
                      }`}
                    >
                      {bal >= 0 ? "+" : ""}£{bal.toFixed(2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Settlements */}
          <div className="bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm">
            <h2 className="font-semibold mb-3">Who pays who</h2>
            {settlements.length === 0 ? (
              <p className="text-[var(--muted)] text-sm">
                {trip.expenses.length === 0
                  ? "Add some expenses first."
                  : "Everyone's square! Nothing to settle."}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {settlements.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 bg-[var(--bg)] rounded-xl p-3">
                    <span className="font-medium">{s.from}</span>
                    <span className="text-[var(--muted)]">pays</span>
                    <span className="font-medium">{s.to}</span>
                    <span className="ml-auto font-bold text-[var(--accent)]">£{s.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
