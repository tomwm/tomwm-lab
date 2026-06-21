"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function Home() {
  const router = useRouter();
  const [tab, setTab] = useState<"create" | "join">("create");

  // Create state
  const [tripName, setTripName] = useState("");
  const [memberInput, setMemberInput] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  // Join state
  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState("");

  function addMember() {
    const name = memberInput.trim();
    if (!name || members.includes(name)) return;
    setMembers([...members, name]);
    setMemberInput("");
  }

  function removeMember(name: string) {
    setMembers(members.filter((m) => m !== name));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!tripName.trim() || members.length < 2) return;
    setCreating(true);
    try {
      const res = await fetch(`${BASE}/api/trips`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: tripName.trim(), members }),
      });
      const trip = await res.json();
      router.push(`/trip/${trip.code}`);
    } catch {
      setCreating(false);
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setJoining(true);
    setJoinError("");
    const res = await fetch(`${BASE}/api/trips/${trimmed}`);
    if (res.ok) {
      router.push(`/trip/${trimmed}`);
    } else {
      setJoinError("Trip not found. Check your code and try again.");
      setJoining(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">Split trips, not friendships.</h1>
        <p className="text-[var(--muted)] text-lg">
          Create a trip, share the code, track who owes what. No sign-up needed.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-[var(--border)] overflow-hidden shadow-sm">
        <div className="flex border-b border-[var(--border)]">
          {(["create", "join"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                tab === t
                  ? "bg-[var(--accent-light)] text-[var(--accent)]"
                  : "text-[var(--muted)] hover:text-[var(--text)]"
              }`}
            >
              {t === "create" ? "Create a trip" : "Join a trip"}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "create" ? (
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trip name</label>
                <input
                  type="text"
                  value={tripName}
                  onChange={(e) => setTripName(e.target.value)}
                  placeholder="e.g. Barcelona 2025"
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Add travellers</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={memberInput}
                    onChange={(e) => setMemberInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addMember())}
                    placeholder="Enter a name"
                    className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                  <button
                    type="button"
                    onClick={addMember}
                    className="bg-[var(--accent-light)] text-[var(--accent)] font-semibold px-4 rounded-lg hover:bg-[var(--accent)] hover:text-white transition-colors"
                  >
                    Add
                  </button>
                </div>
                {members.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {members.map((m) => (
                      <span
                        key={m}
                        className="flex items-center gap-1 bg-[var(--accent-light)] text-[var(--accent)] text-sm font-medium px-3 py-1 rounded-full"
                      >
                        {m}
                        <button
                          type="button"
                          onClick={() => removeMember(m)}
                          className="hover:text-[var(--danger)] ml-1 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                {members.length < 2 && (
                  <p className="text-[var(--muted)] text-xs mt-1">Add at least 2 travellers</p>
                )}
              </div>

              <button
                type="submit"
                disabled={creating || !tripName.trim() || members.length < 2}
                className="bg-[var(--accent)] text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity mt-2"
              >
                {creating ? "Creating…" : "Create trip & get code"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Trip code</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. AB12CD"
                  maxLength={6}
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 text-center text-2xl font-bold tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  required
                />
                {joinError && <p className="text-[var(--danger)] text-sm mt-1">{joinError}</p>}
              </div>
              <button
                type="submit"
                disabled={joining || code.trim().length !== 6}
                className="bg-[var(--accent)] text-white font-semibold py-3 rounded-xl disabled:opacity-40 hover:opacity-90 transition-opacity"
              >
                {joining ? "Finding trip…" : "Join trip"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
