(globalThis.TURBOPACK = globalThis.TURBOPACK || []).push([typeof document === "object" ? document.currentScript : undefined, {

"[project]/apps/splitz/components/SplitEditor.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>SplitEditor)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
"use client";
;
function SplitEditor({ members, splits, onChange, totalAmount }) {
    const total = Object.values(splits).reduce((a, b)=>a + b, 0);
    const isValid = Math.abs(total - 100) <= 0.5;
    function handleChange(changed, newVal) {
        const clamped = Math.max(0, Math.min(100, isNaN(newVal) ? 0 : newVal));
        const others = members.filter((m)=>m !== changed);
        const remaining = Math.max(0, 100 - clamped);
        // Distribute remainder proportionally among others, or equally if all zero
        const otherCurrentTotal = others.reduce((s, m)=>s + (splits[m] ?? 0), 0);
        const next = {
            ...splits,
            [changed]: clamped
        };
        if (otherCurrentTotal === 0 || others.length === 0) {
            const each = remaining / others.length;
            others.forEach((m)=>next[m] = Math.round(each * 10) / 10);
        } else {
            others.forEach((m)=>{
                next[m] = Math.round((splits[m] ?? 0) / otherCurrentTotal * remaining * 10) / 10;
            });
        }
        // Fix rounding so it always sums to exactly 100
        const newTotal = Object.values(next).reduce((a, b)=>a + b, 0);
        const diff = Math.round((100 - newTotal) * 10) / 10;
        if (diff !== 0 && others.length > 0) {
            next[others[others.length - 1]] = Math.round((next[others[others.length - 1]] + diff) * 10) / 10;
        }
        onChange(next);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-2",
        children: [
            members.map((m)=>{
                const pct = splits[m] ?? 0;
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "w-24 text-sm font-medium truncate",
                            children: m
                        }, void 0, false, {
                            fileName: "[project]/apps/splitz/components/SplitEditor.tsx",
                            lineNumber: 48,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex-1 relative",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                    type: "number",
                                    value: pct,
                                    min: "0",
                                    max: "100",
                                    step: "1",
                                    onFocus: (e)=>e.target.select(),
                                    onChange: (e)=>handleChange(m, parseFloat(e.target.value)),
                                    className: "w-full border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm pr-7 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                }, void 0, false, {
                                    fileName: "[project]/apps/splitz/components/SplitEditor.tsx",
                                    lineNumber: 50,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted)]",
                                    children: "%"
                                }, void 0, false, {
                                    fileName: "[project]/apps/splitz/components/SplitEditor.tsx",
                                    lineNumber: 60,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/splitz/components/SplitEditor.tsx",
                            lineNumber: 49,
                            columnNumber: 13
                        }, this),
                        totalAmount !== undefined && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-[var(--muted)] w-14 text-right shrink-0",
                            children: [
                                "£",
                                (totalAmount * pct / 100).toFixed(2)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/splitz/components/SplitEditor.tsx",
                            lineNumber: 63,
                            columnNumber: 15
                        }, this)
                    ]
                }, m, true, {
                    fileName: "[project]/apps/splitz/components/SplitEditor.tsx",
                    lineNumber: 47,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: `text-xs text-right mt-0.5 ${isValid ? "text-[var(--success)]" : "text-[var(--danger)]"}`,
                children: [
                    "Total: ",
                    total.toFixed(1),
                    "%",
                    isValid ? " ✓" : " (must equal 100%)"
                ]
            }, void 0, true, {
                fileName: "[project]/apps/splitz/components/SplitEditor.tsx",
                lineNumber: 70,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/splitz/components/SplitEditor.tsx",
        lineNumber: 43,
        columnNumber: 5
    }, this);
}
_c = SplitEditor;
var _c;
__turbopack_context__.k.register(_c, "SplitEditor");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/apps/splitz/lib/settle.ts [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "calcBalances": (()=>calcBalances),
    "calcBalancesGlobal": (()=>calcBalancesGlobal),
    "calcSettlements": (()=>calcSettlements),
    "equalSplits": (()=>equalSplits)
});
function calcBalances(members, expenses) {
    const balances = {};
    members.forEach((m)=>balances[m] = 0);
    for (const expense of expenses){
        const total = Number(expense.amount);
        const splits = expense.splits;
        // What each person owes for this expense
        for (const [member, pct] of Object.entries(splits)){
            balances[member] = (balances[member] ?? 0) - total * pct / 100;
        }
        // Payer gets credited
        balances[expense.paid_by] = (balances[expense.paid_by] ?? 0) + total;
    }
    return balances;
}
function calcSettlements(balances) {
    const creditors = [];
    const debtors = [];
    for (const [name, balance] of Object.entries(balances)){
        if (balance > 0.005) creditors.push({
            name,
            amount: balance
        });
        else if (balance < -0.005) debtors.push({
            name,
            amount: -balance
        });
    }
    creditors.sort((a, b)=>b.amount - a.amount);
    debtors.sort((a, b)=>b.amount - a.amount);
    const settlements = [];
    let ci = 0;
    let di = 0;
    while(ci < creditors.length && di < debtors.length){
        const credit = creditors[ci];
        const debt = debtors[di];
        const amount = Math.min(credit.amount, debt.amount);
        settlements.push({
            from: debt.name,
            to: credit.name,
            amount: Math.round(amount * 100) / 100
        });
        credit.amount -= amount;
        debt.amount -= amount;
        if (credit.amount < 0.005) ci++;
        if (debt.amount < 0.005) di++;
    }
    return settlements;
}
function calcBalancesGlobal(members, expenses, memberShares) {
    const balances = {};
    members.forEach((m)=>balances[m] = 0);
    const totalSpend = expenses.reduce((s, e)=>s + Number(e.amount), 0);
    // Credit each payer for what they paid
    for (const expense of expenses){
        balances[expense.paid_by] = (balances[expense.paid_by] ?? 0) + Number(expense.amount);
    }
    // Deduct each person's share of the total
    for (const [member, pct] of Object.entries(memberShares)){
        balances[member] = (balances[member] ?? 0) - totalSpend * pct / 100;
    }
    return balances;
}
function equalSplits(members) {
    const pct = Math.round(100 / members.length * 100) / 100;
    const splits = {};
    members.forEach((m, i)=>{
        splits[m] = i === members.length - 1 ? 100 - pct * (members.length - 1) : pct;
    });
    return splits;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/apps/splitz/app/trip/[code]/page.tsx [app-client] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, k: __turbopack_refresh__, m: module } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>TripPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$components$2f$SplitEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/components/SplitEditor.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/lib/settle.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
"use client";
;
;
;
const BASE = __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BASE_PATH ?? "";
;
function TripPage() {
    _s();
    const { code } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"])();
    const [trip, setTrip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("expenses");
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Add expense form
    const [showAdd, setShowAdd] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [desc, setDesc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [amount, setAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [paidBy, setPaidBy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [customSplits, setCustomSplits] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Split editor for existing expense
    const [editingSplitId, setEditingSplitId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [splitDraft, setSplitDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    // Add member
    const [showAddMember, setShowAddMember] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [newMemberName, setNewMemberName] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    const [addingMember, setAddingMember] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [addMemberError, setAddMemberError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])("");
    // Global member shares
    const [globalSharesMode, setGlobalSharesMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [sharesDraft, setSharesDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [savingShares, setSavingShares] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const load = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TripPage.useCallback[load]": async ()=>{
            const res = await fetch(`${BASE}/api/trips/${code}`);
            if (!res.ok) {
                setError("Trip not found. Check your code.");
                setLoading(false);
                return;
            }
            const data = await res.json();
            setTrip(data);
            if (!paidBy && data.members.length) setPaidBy(data.members[0]);
            const hasGlobal = Object.keys(data.member_shares || {}).length > 0;
            setGlobalSharesMode(hasGlobal);
            setSharesDraft(hasGlobal ? data.member_shares : (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalSplits"])(data.members));
            setLoading(false);
        }
    }["TripPage.useCallback[load]"], [
        code,
        paidBy
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TripPage.useEffect": ()=>{
            load();
        }
    }["TripPage.useEffect"], [
        load
    ]);
    function copyCode() {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(()=>setCopied(false), 2000);
    }
    function openAdd() {
        if (!trip) return;
        setDesc("");
        setAmount("");
        setPaidBy(trip.members[0]);
        setCustomSplits(null);
        setShowAdd(true);
    }
    async function submitExpense(e) {
        e.preventDefault();
        if (!trip || !desc || !amount || !paidBy) return;
        setSaving(true);
        const splits = customSplits ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalSplits"])(trip.members);
        await fetch(`${BASE}/api/expenses`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                tripCode: code,
                description: desc,
                amount: Number(amount),
                paidBy,
                splits
            })
        });
        setSaving(false);
        setShowAdd(false);
        load();
    }
    async function deleteExpense(id) {
        await fetch(`${BASE}/api/expenses/${id}`, {
            method: "DELETE"
        });
        load();
    }
    function startEditSplit(expense) {
        setEditingSplitId(expense.id);
        setSplitDraft({
            ...expense.splits
        });
    }
    async function addMember(e) {
        e.preventDefault();
        const name = newMemberName.trim();
        if (!name) return;
        setAddingMember(true);
        setAddMemberError("");
        const res = await fetch(`${BASE}/api/trips/${code}/members`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name
            })
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
    async function saveGlobalShares() {
        if (!trip) return;
        setSavingShares(true);
        const shares = globalSharesMode ? sharesDraft : {};
        await fetch(`${BASE}/api/trips/${code}/shares`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                memberShares: shares
            })
        });
        setSavingShares(false);
        load();
    }
    async function saveSplits(id) {
        const total = Object.values(splitDraft).reduce((a, b)=>a + b, 0);
        if (Math.abs(total - 100) > 0.5) return;
        await fetch(`${BASE}/api/expenses/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                splits: splitDraft
            })
        });
        setEditingSplitId(null);
        load();
    }
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center h-48 text-[var(--muted)]",
            children: "Loading trip…"
        }, void 0, false, {
            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
            lineNumber: 159,
            columnNumber: 7
        }, this);
    }
    if (error || !trip) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center py-16",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[var(--danger)] mb-4",
                    children: error || "Trip not found"
                }, void 0, false, {
                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                    lineNumber: 168,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "/",
                    className: "text-[var(--accent)] underline",
                    children: "Back to home"
                }, void 0, false, {
                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                    lineNumber: 169,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
            lineNumber: 167,
            columnNumber: 7
        }, this);
    }
    const hasGlobalShares = Object.keys(trip.member_shares || {}).length > 0;
    const balances = hasGlobalShares ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calcBalancesGlobal"])(trip.members, trip.expenses, trip.member_shares) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calcBalances"])(trip.members, trip.expenses);
    const settlements = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calcSettlements"])(balances);
    const sharesTotalValid = Math.abs(Object.values(sharesDraft).reduce((a, b)=>a + b, 0) - 100) <= 0.5;
    const totalSpend = trip.expenses.reduce((s, e)=>s + Number(e.amount), 0);
    const splitTotal = Object.values(splitDraft).reduce((a, b)=>a + b, 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-start justify-between gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-bold",
                                        children: trip.name
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 189,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[var(--muted)] text-sm mt-0.5",
                                        children: trip.members.join(", ")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 190,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 188,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: copyCode,
                                className: "flex flex-col items-center bg-[var(--accent-light)] rounded-xl px-4 py-2 hover:bg-[var(--accent)] hover:text-white group transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-mono font-bold text-xl tracking-widest text-[var(--accent)] group-hover:text-white",
                                        children: trip.code
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 198,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-[var(--muted)] group-hover:text-white/80 mt-0.5",
                                        children: copied ? "Copied!" : "Tap to copy"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 201,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 194,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 187,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-4 mt-4 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 bg-[var(--bg)] rounded-xl p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-bold text-lg",
                                        children: [
                                            "£",
                                            totalSpend.toFixed(2)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 209,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[var(--muted)]",
                                        children: "Total spend"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 210,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 208,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 bg-[var(--bg)] rounded-xl p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-bold text-lg",
                                        children: trip.expenses.length
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 213,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[var(--muted)]",
                                        children: "Expenses"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 214,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 212,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 bg-[var(--bg)] rounded-xl p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-bold text-lg",
                                        children: trip.members.length
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 217,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[var(--muted)]",
                                        children: "Travellers"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 218,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 216,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 207,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                lineNumber: 186,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: [
                    "expenses",
                    "settle"
                ].map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setView(v),
                        className: `flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${view === v ? "bg-[var(--accent)] text-white" : "bg-white border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`,
                        children: v === "expenses" ? "Expenses" : "Settle up"
                    }, v, false, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 226,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                lineNumber: 224,
                columnNumber: 7
            }, this),
            view === "expenses" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    showAdd ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-semibold text-lg mb-4",
                                children: "Add expense"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 245,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: submitExpense,
                                className: "flex flex-col gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: desc,
                                        onChange: (e)=>setDesc(e.target.value),
                                        placeholder: "What was it? (e.g. Taxi to airport)",
                                        className: "border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
                                        required: true
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 247,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative flex-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]",
                                                        children: "£"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 257,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "number",
                                                        value: amount,
                                                        onChange: (e)=>setAmount(e.target.value),
                                                        placeholder: "0.00",
                                                        step: "0.01",
                                                        min: "0.01",
                                                        className: "w-full border border-[var(--border)] rounded-lg pl-7 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
                                                        required: true
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 258,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 256,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                value: paidBy,
                                                onChange: (e)=>setPaidBy(e.target.value),
                                                className: "border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
                                                children: trip.members.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: m,
                                                        children: [
                                                            m,
                                                            " paid"
                                                        ]
                                                    }, m, true, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 275,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 269,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 255,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between mb-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-sm font-medium",
                                                        children: "Split"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 283,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>setCustomSplits(customSplits ? null : (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalSplits"])(trip.members)),
                                                        className: "text-xs text-[var(--accent)] underline",
                                                        children: customSplits ? "Reset to equal" : "Customise %"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 284,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 282,
                                                columnNumber: 19
                                            }, this),
                                            customSplits ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$components$2f$SplitEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                members: trip.members,
                                                splits: customSplits,
                                                onChange: setCustomSplits,
                                                totalAmount: Number(amount) || undefined
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 294,
                                                columnNumber: 21
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-[var(--muted)] bg-[var(--bg)] rounded-lg px-3 py-2",
                                                children: [
                                                    "Equal split between all ",
                                                    trip.members.length,
                                                    " travellers"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 301,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 281,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2 pt-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setShowAdd(false),
                                                className: "flex-1 border border-[var(--border)] py-2.5 rounded-xl font-semibold text-sm",
                                                children: "Cancel"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 308,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                disabled: saving || customSplits !== null && Math.abs(Object.values(customSplits).reduce((a, b)=>a + b, 0) - 100) > 0.5,
                                                className: "flex-1 bg-[var(--accent)] text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40",
                                                children: saving ? "Saving…" : "Add expense"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 315,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 307,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 246,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 244,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: openAdd,
                        className: "bg-[var(--accent)] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity",
                        children: "+ Add expense"
                    }, void 0, false, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 330,
                        columnNumber: 13
                    }, this),
                    trip.expenses.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-12 text-[var(--muted)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-4xl mb-3",
                                children: "🧾"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 341,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "No expenses yet. Add the first one!"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 342,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 340,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: trip.expenses.map((exp)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white rounded-2xl border border-[var(--border)] p-4 shadow-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start justify-between gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 min-w-0",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "font-semibold truncate",
                                                        children: exp.description
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 350,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-[var(--muted)]",
                                                        children: [
                                                            "Paid by ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-medium text-[var(--text)]",
                                                                children: exp.paid_by
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                                lineNumber: 352,
                                                                columnNumber: 33
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 351,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 349,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-bold text-lg shrink-0",
                                                children: [
                                                    "£",
                                                    Number(exp.amount).toFixed(2)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 355,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 348,
                                        columnNumber: 19
                                    }, this),
                                    editingSplitId === exp.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-3 border-t border-[var(--border)] pt-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs font-semibold text-[var(--muted)] mb-2 uppercase tracking-wide",
                                                children: "Edit split"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 360,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$components$2f$SplitEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                members: trip.members,
                                                splits: splitDraft,
                                                onChange: setSplitDraft,
                                                totalAmount: Number(exp.amount)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 361,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex gap-2 mt-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setEditingSplitId(null),
                                                        className: "flex-1 border border-[var(--border)] py-1.5 rounded-lg text-sm font-medium",
                                                        children: "Cancel"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 368,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>saveSplits(exp.id),
                                                        disabled: Math.abs(splitTotal - 100) > 0.5,
                                                        className: "flex-1 bg-[var(--accent)] text-white py-1.5 rounded-lg text-sm font-medium disabled:opacity-40",
                                                        children: "Save"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 374,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 367,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 359,
                                        columnNumber: 21
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 flex flex-wrap gap-1",
                                        children: Object.entries(exp.splits).map(([m, pct])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs bg-[var(--bg)] text-[var(--muted)] px-2 py-0.5 rounded-full",
                                                children: [
                                                    m,
                                                    ": ",
                                                    pct,
                                                    "%"
                                                ]
                                            }, m, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 386,
                                                columnNumber: 25
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 384,
                                        columnNumber: 21
                                    }, this),
                                    editingSplitId !== exp.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-3 mt-3 pt-3 border-t border-[var(--border)]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>startEditSplit(exp),
                                                className: "text-xs text-[var(--accent)] font-medium hover:underline",
                                                children: "Edit split"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 395,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>deleteExpense(exp.id),
                                                className: "text-xs text-[var(--danger)] font-medium hover:underline ml-auto",
                                                children: "Delete"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 401,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 394,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, exp.id, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 347,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 345,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true),
            view === "settle" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between mb-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "font-semibold",
                                        children: "Overall split"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 421,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            const next = !globalSharesMode;
                                            setGlobalSharesMode(next);
                                            if (next && Object.keys(sharesDraft).length === 0) {
                                                setSharesDraft((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalSplits"])(trip.members));
                                            }
                                        },
                                        className: "text-xs text-[var(--accent)] underline",
                                        children: globalSharesMode ? "Reset to per-expense" : "Set overall %"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 422,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 420,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-[var(--muted)] mb-3",
                                children: globalSharesMode ? "Each person's share of the total trip spend. Overrides per-expense splits." : "Settlement uses per-expense splits. Switch to set one overall % per person."
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 435,
                                columnNumber: 13
                            }, this),
                            globalSharesMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$components$2f$SplitEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                        members: trip.members,
                                        splits: sharesDraft,
                                        onChange: setSharesDraft,
                                        totalAmount: totalSpend
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 443,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2 mt-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setSharesDraft((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalSplits"])(trip.members)),
                                                className: "text-xs text-[var(--accent)] underline",
                                                children: "Reset equal"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 450,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: saveGlobalShares,
                                                disabled: savingShares || !sharesTotalValid,
                                                className: "ml-auto bg-[var(--accent)] text-white text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40",
                                                children: savingShares ? "Saving…" : "Apply"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 456,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 449,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true),
                            hasGlobalShares && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 flex items-center gap-1.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-2 h-2 rounded-full bg-[var(--accent)] inline-block"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 469,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-[var(--accent)] font-medium",
                                        children: "Overall splits active"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 470,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: async ()=>{
                                            setGlobalSharesMode(false);
                                            await fetch(`${BASE}/api/trips/${code}/shares`, {
                                                method: "PATCH",
                                                headers: {
                                                    "Content-Type": "application/json"
                                                },
                                                body: JSON.stringify({
                                                    memberShares: {}
                                                })
                                            });
                                            load();
                                        },
                                        className: "text-xs text-[var(--muted)] underline ml-1",
                                        children: "Clear"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 471,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 468,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 419,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-semibold mb-3",
                                children: "Who's owed what"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 491,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-2",
                                children: trip.members.map((m)=>{
                                    const bal = balances[m] ?? 0;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-24 text-sm font-medium truncate",
                                                children: m
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 497,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 h-2 bg-[var(--bg)] rounded-full overflow-hidden",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `h-full rounded-full ${bal >= 0 ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`,
                                                    style: {
                                                        width: `${Math.min(100, Math.abs(bal) / Math.max(...Object.values(balances).map(Math.abs), 1) * 100)}%`
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                    lineNumber: 499,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 498,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-semibold w-20 text-right ${bal >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`,
                                                children: [
                                                    bal >= 0 ? "+" : "",
                                                    "£",
                                                    bal.toFixed(2)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 506,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, m, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 496,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 492,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 490,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-semibold mb-3",
                                children: "Who pays who"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 521,
                                columnNumber: 13
                            }, this),
                            settlements.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[var(--muted)] text-sm",
                                children: trip.expenses.length === 0 ? "Add some expenses first." : "Everyone's square! Nothing to settle."
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 523,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-2",
                                children: settlements.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 bg-[var(--bg)] rounded-xl p-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-medium",
                                                children: s.from
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 532,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[var(--muted)]",
                                                children: "pays"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 533,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-medium",
                                                children: s.to
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 534,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "ml-auto font-bold text-[var(--accent)]",
                                                children: [
                                                    "£",
                                                    s.amount.toFixed(2)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 535,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 531,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 529,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 520,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                lineNumber: 417,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
        lineNumber: 184,
        columnNumber: 5
    }, this);
}
_s(TripPage, "ifBh7Pku95X9mRY2WHAeeT7YZ+Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useParams"]
    ];
});
_c = TripPage;
var _c;
__turbopack_context__.k.register(_c, "TripPage");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(module, globalThis.$RefreshHelpers$);
}
}}),
"[project]/apps/splitz/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
"use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return (type.displayName || "Context") + ".Provider";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, self, source, owner, props, debugStack, debugTask) {
        self = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== self ? self : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, source, self, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, self, source, getOwner(), maybeKey, debugStack, debugTask);
    }
    function validateChildKeys(node) {
        "object" === typeof node && null !== node && node.$$typeof === REACT_ELEMENT_TYPE && node._store && (node._store.validated = 1);
    }
    var React = __turbopack_context__.r("[project]/apps/splitz/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler");
    Symbol.for("react.provider");
    var REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        "react-stack-bottom-frame": function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React["react-stack-bottom-frame"].bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren, source, self) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, source, self, trackActualOwner ? Error("react-stack-top-frame") : unknownOwnerDebugStack, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}}),
"[project]/apps/splitz/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) {
    "TURBOPACK unreachable";
} else {
    module.exports = __turbopack_context__.r("[project]/apps/splitz/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}}),
"[project]/apps/splitz/node_modules/next/navigation.js [app-client] (ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
module.exports = __turbopack_context__.r("[project]/apps/splitz/node_modules/next/dist/client/components/navigation.js [app-client] (ecmascript)");
}}),
}]);

//# sourceMappingURL=apps_splitz_80ad28f3._.js.map