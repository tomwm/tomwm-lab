module.exports = {

"[project]/apps/splitz/lib/settle.ts [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
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
}}),
"[project]/apps/splitz/app/trip/[code]/page.tsx [app-ssr] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "default": (()=>TripPage)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/navigation.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/lib/settle.ts [app-ssr] (ecmascript)");
"use client";
;
;
;
;
function TripPage() {
    const { code } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useParams"])();
    const [trip, setTrip] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [view, setView] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("expenses");
    const [copied, setCopied] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Add expense form
    const [showAdd, setShowAdd] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [desc, setDesc] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [amount, setAmount] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [paidBy, setPaidBy] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])("");
    const [customSplits, setCustomSplits] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [saving, setSaving] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    // Split editor for existing expense
    const [editingSplitId, setEditingSplitId] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [splitDraft, setSplitDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    // Global member shares
    const [globalSharesMode, setGlobalSharesMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [sharesDraft, setSharesDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [savingShares, setSavingShares] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const load = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async ()=>{
        const res = await fetch(`/api/trips/${code}`);
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
        setSharesDraft(hasGlobal ? data.member_shares : (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["equalSplits"])(data.members));
        setLoading(false);
    }, [
        code,
        paidBy
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        load();
    }, [
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
        const splits = customSplits ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["equalSplits"])(trip.members);
        await fetch("/api/expenses", {
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
        await fetch(`/api/expenses/${id}`, {
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
    async function saveGlobalShares() {
        if (!trip) return;
        setSavingShares(true);
        const shares = globalSharesMode ? sharesDraft : {};
        await fetch(`/api/trips/${code}/shares`, {
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
        await fetch(`/api/expenses/${id}`, {
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
    function updateSplitDraft(member, value) {
        setSplitDraft((prev)=>({
                ...prev,
                [member]: value
            }));
    }
    if (loading) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "flex items-center justify-center h-48 text-[var(--muted)]",
            children: "Loading trip…"
        }, void 0, false, {
            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
            lineNumber: 132,
            columnNumber: 7
        }, this);
    }
    if (error || !trip) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center py-16",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-[var(--danger)] mb-4",
                    children: error || "Trip not found"
                }, void 0, false, {
                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                    lineNumber: 141,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "/",
                    className: "text-[var(--accent)] underline",
                    children: "Back to home"
                }, void 0, false, {
                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                    lineNumber: 142,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
            lineNumber: 140,
            columnNumber: 7
        }, this);
    }
    const hasGlobalShares = Object.keys(trip.member_shares || {}).length > 0;
    const balances = hasGlobalShares ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calcBalancesGlobal"])(trip.members, trip.expenses, trip.member_shares) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calcBalances"])(trip.members, trip.expenses);
    const settlements = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["calcSettlements"])(balances);
    const sharesTotalValid = Math.abs(Object.values(sharesDraft).reduce((a, b)=>a + b, 0) - 100) <= 0.5;
    const totalSpend = trip.expenses.reduce((s, e)=>s + Number(e.amount), 0);
    const splitTotal = Object.values(splitDraft).reduce((a, b)=>a + b, 0);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex flex-col gap-6",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-start justify-between gap-4",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        className: "text-2xl font-bold",
                                        children: trip.name
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 162,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "text-[var(--muted)] text-sm mt-0.5",
                                        children: trip.members.join(", ")
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 163,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 161,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: copyCode,
                                className: "flex flex-col items-center bg-[var(--accent-light)] rounded-xl px-4 py-2 hover:bg-[var(--accent)] hover:text-white group transition-colors",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "font-mono font-bold text-xl tracking-widest text-[var(--accent)] group-hover:text-white",
                                        children: trip.code
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 171,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-[var(--muted)] group-hover:text-white/80 mt-0.5",
                                        children: copied ? "Copied!" : "Tap to copy"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 174,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 167,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 160,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex gap-4 mt-4 text-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 bg-[var(--bg)] rounded-xl p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-bold text-lg",
                                        children: [
                                            "£",
                                            totalSpend.toFixed(2)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 182,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[var(--muted)]",
                                        children: "Total spend"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 183,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 181,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 bg-[var(--bg)] rounded-xl p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-bold text-lg",
                                        children: trip.expenses.length
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 186,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[var(--muted)]",
                                        children: "Expenses"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 187,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 185,
                                columnNumber: 11
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex-1 bg-[var(--bg)] rounded-xl p-3 text-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "font-bold text-lg",
                                        children: trip.members.length
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 190,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[var(--muted)]",
                                        children: "Travellers"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 191,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 189,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 180,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                lineNumber: 159,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2",
                children: [
                    "expenses",
                    "settle"
                ].map((v)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: ()=>setView(v),
                        className: `flex-1 py-2.5 rounded-xl font-semibold text-sm transition-colors ${view === v ? "bg-[var(--accent)] text-white" : "bg-white border border-[var(--border)] text-[var(--muted)] hover:text-[var(--text)]"}`,
                        children: v === "expenses" ? "Expenses" : "Settle up"
                    }, v, false, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 199,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                lineNumber: 197,
                columnNumber: 7
            }, this),
            view === "expenses" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    showAdd ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-semibold text-lg mb-4",
                                children: "Add expense"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 218,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                onSubmit: submitExpense,
                                className: "flex flex-col gap-3",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                        type: "text",
                                        value: desc,
                                        onChange: (e)=>setDesc(e.target.value),
                                        placeholder: "What was it? (e.g. Taxi to airport)",
                                        className: "border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
                                        required: true
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 220,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "relative flex-1",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]",
                                                        children: "£"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 230,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                                        lineNumber: 231,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 229,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                value: paidBy,
                                                onChange: (e)=>setPaidBy(e.target.value),
                                                className: "border border-[var(--border)] rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
                                                children: trip.members.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: m,
                                                        children: [
                                                            m,
                                                            " paid"
                                                        ]
                                                    }, m, true, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 248,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 242,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 228,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center justify-between mb-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-sm font-medium",
                                                        children: "Split"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 256,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>setCustomSplits(customSplits ? null : (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["equalSplits"])(trip.members)),
                                                        className: "text-xs text-[var(--accent)] underline",
                                                        children: customSplits ? "Reset to equal" : "Customise %"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 257,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 255,
                                                columnNumber: 19
                                            }, this),
                                            customSplits ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col gap-2",
                                                children: [
                                                    trip.members.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "flex items-center gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "w-24 text-sm truncate",
                                                                    children: m
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                                    lineNumber: 274,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                    type: "number",
                                                                    value: customSplits[m] ?? 0,
                                                                    onChange: (e)=>setCustomSplits({
                                                                            ...customSplits,
                                                                            [m]: Number(e.target.value)
                                                                        }),
                                                                    min: "0",
                                                                    max: "100",
                                                                    step: "1",
                                                                    className: "flex-1 border border-[var(--border)] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                                    lineNumber: 275,
                                                                    columnNumber: 27
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: "text-sm text-[var(--muted)] w-4",
                                                                    children: "%"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                                    lineNumber: 286,
                                                                    columnNumber: 27
                                                                }, this)
                                                            ]
                                                        }, m, true, {
                                                            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                            lineNumber: 273,
                                                            columnNumber: 25
                                                        }, this)),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: `text-xs text-right mt-1 ${Math.abs(Object.values(customSplits).reduce((a, b)=>a + b, 0) - 100) > 0.5 ? "text-[var(--danger)]" : "text-[var(--success)]"}`,
                                                        children: [
                                                            "Total:",
                                                            " ",
                                                            Object.values(customSplits).reduce((a, b)=>a + b, 0).toFixed(0),
                                                            "% ",
                                                            Math.abs(Object.values(customSplits).reduce((a, b)=>a + b, 0) - 100) > 0.5 ? "(must equal 100%)" : "✓"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 289,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 271,
                                                columnNumber: 21
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-sm text-[var(--muted)] bg-[var(--bg)] rounded-lg px-3 py-2",
                                                children: [
                                                    "Equal split between all ",
                                                    trip.members.length,
                                                    " travellers"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 306,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 254,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2 pt-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setShowAdd(false),
                                                className: "flex-1 border border-[var(--border)] py-2.5 rounded-xl font-semibold text-sm",
                                                children: "Cancel"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 313,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                disabled: saving || customSplits !== null && Math.abs(Object.values(customSplits).reduce((a, b)=>a + b, 0) - 100) > 0.5,
                                                className: "flex-1 bg-[var(--accent)] text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40",
                                                children: saving ? "Saving…" : "Add expense"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 320,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 312,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 219,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 217,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: openAdd,
                        className: "bg-[var(--accent)] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity",
                        children: "+ Add expense"
                    }, void 0, false, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 335,
                        columnNumber: 13
                    }, this),
                    trip.expenses.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "text-center py-12 text-[var(--muted)]",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-4xl mb-3",
                                children: "🧾"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 346,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "No expenses yet. Add the first one!"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 347,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 345,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: trip.expenses.map((exp)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bg-white rounded-2xl border border-[var(--border)] p-4 shadow-sm",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start justify-between gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 min-w-0",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "font-semibold truncate",
                                                        children: exp.description
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 355,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "text-sm text-[var(--muted)]",
                                                        children: [
                                                            "Paid by ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "font-medium text-[var(--text)]",
                                                                children: exp.paid_by
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                                lineNumber: 357,
                                                                columnNumber: 33
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 356,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 354,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-bold text-lg shrink-0",
                                                children: [
                                                    "£",
                                                    Number(exp.amount).toFixed(2)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 360,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 353,
                                        columnNumber: 19
                                    }, this),
                                    editingSplitId === exp.id ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-3 border-t border-[var(--border)] pt-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs font-semibold text-[var(--muted)] mb-2 uppercase tracking-wide",
                                                children: "Edit split"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 365,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex flex-col gap-1.5",
                                                children: trip.members.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "flex items-center gap-2",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "w-24 text-sm truncate",
                                                                children: m
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                                lineNumber: 369,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                                type: "number",
                                                                value: splitDraft[m] ?? 0,
                                                                onChange: (e)=>updateSplitDraft(m, Number(e.target.value)),
                                                                min: "0",
                                                                max: "100",
                                                                step: "1",
                                                                className: "flex-1 border border-[var(--border)] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                                lineNumber: 370,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-sm text-[var(--muted)] w-4",
                                                                children: "%"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                                lineNumber: 379,
                                                                columnNumber: 29
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                className: "text-xs text-[var(--muted)] w-14 text-right",
                                                                children: [
                                                                    "£",
                                                                    (Number(exp.amount) * (splitDraft[m] ?? 0) / 100).toFixed(2)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                                lineNumber: 380,
                                                                columnNumber: 29
                                                            }, this)
                                                        ]
                                                    }, m, true, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 368,
                                                        columnNumber: 27
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 366,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-xs text-right mt-1 ${Math.abs(splitTotal - 100) > 0.5 ? "text-[var(--danger)]" : "text-[var(--success)]"}`,
                                                children: [
                                                    "Total: ",
                                                    splitTotal.toFixed(0),
                                                    "%",
                                                    Math.abs(splitTotal - 100) > 0.5 ? " (must equal 100%)" : " ✓"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 386,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex gap-2 mt-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>setEditingSplitId(null),
                                                        className: "flex-1 border border-[var(--border)] py-1.5 rounded-lg text-sm font-medium",
                                                        children: "Cancel"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 394,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>saveSplits(exp.id),
                                                        disabled: Math.abs(splitTotal - 100) > 0.5,
                                                        className: "flex-1 bg-[var(--accent)] text-white py-1.5 rounded-lg text-sm font-medium disabled:opacity-40",
                                                        children: "Save"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 400,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 393,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 364,
                                        columnNumber: 21
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "mt-2 flex flex-wrap gap-1",
                                        children: Object.entries(exp.splits).map(([m, pct])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-xs bg-[var(--bg)] text-[var(--muted)] px-2 py-0.5 rounded-full",
                                                children: [
                                                    m,
                                                    ": ",
                                                    pct,
                                                    "%"
                                                ]
                                            }, m, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 412,
                                                columnNumber: 25
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 410,
                                        columnNumber: 21
                                    }, this),
                                    editingSplitId !== exp.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-3 mt-3 pt-3 border-t border-[var(--border)]",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>startEditSplit(exp),
                                                className: "text-xs text-[var(--accent)] font-medium hover:underline",
                                                children: "Edit split"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 421,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>deleteExpense(exp.id),
                                                className: "text-xs text-[var(--danger)] font-medium hover:underline ml-auto",
                                                children: "Delete"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 427,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 420,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, exp.id, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 352,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 350,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true),
            view === "settle" && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-4",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex items-center justify-between mb-1",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        className: "font-semibold",
                                        children: "Overall split"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 447,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: ()=>{
                                            const next = !globalSharesMode;
                                            setGlobalSharesMode(next);
                                            if (next && Object.keys(sharesDraft).length === 0) {
                                                setSharesDraft((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["equalSplits"])(trip.members));
                                            }
                                        },
                                        className: "text-xs text-[var(--accent)] underline",
                                        children: globalSharesMode ? "Reset to per-expense" : "Set overall %"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 448,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 446,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-[var(--muted)] mb-3",
                                children: globalSharesMode ? "Each person's share of the total trip spend. Overrides per-expense splits." : "Settlement uses per-expense splits. Switch to set one overall % per person."
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 461,
                                columnNumber: 13
                            }, this),
                            globalSharesMode && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex flex-col gap-2",
                                        children: trip.members.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "w-24 text-sm font-medium truncate",
                                                        children: m
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 472,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        type: "number",
                                                        value: sharesDraft[m] ?? 0,
                                                        onChange: (e)=>setSharesDraft((prev)=>({
                                                                    ...prev,
                                                                    [m]: Number(e.target.value)
                                                                })),
                                                        min: "0",
                                                        max: "100",
                                                        step: "1",
                                                        className: "flex-1 border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 473,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-sm text-[var(--muted)] w-4",
                                                        children: "%"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 484,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "text-xs text-[var(--muted)] w-16 text-right",
                                                        children: [
                                                            "£",
                                                            (totalSpend * (sharesDraft[m] ?? 0) / 100).toFixed(2)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 485,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, m, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 471,
                                                columnNumber: 21
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 469,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `text-xs text-right mt-1 ${sharesTotalValid ? "text-[var(--success)]" : "text-[var(--danger)]"}`,
                                        children: [
                                            "Total: ",
                                            Object.values(sharesDraft).reduce((a, b)=>a + b, 0).toFixed(0),
                                            "%",
                                            sharesTotalValid ? " ✓" : " (must equal 100%)"
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 491,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex gap-2 mt-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>setSharesDraft((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["equalSplits"])(trip.members)),
                                                className: "text-xs text-[var(--accent)] underline",
                                                children: "Reset equal"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 496,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: saveGlobalShares,
                                                disabled: savingShares || !sharesTotalValid,
                                                className: "ml-auto bg-[var(--accent)] text-white text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40",
                                                children: savingShares ? "Saving…" : "Apply"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 502,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 495,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true),
                            hasGlobalShares && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "mt-2 flex items-center gap-1.5",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "w-2 h-2 rounded-full bg-[var(--accent)] inline-block"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 515,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-[var(--accent)] font-medium",
                                        children: "Overall splits active"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 516,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        onClick: async ()=>{
                                            setGlobalSharesMode(false);
                                            await fetch(`/api/trips/${code}/shares`, {
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
                                        lineNumber: 517,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 514,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 445,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-semibold mb-3",
                                children: "Who's owed what"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 537,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-2",
                                children: trip.members.map((m)=>{
                                    const bal = balances[m] ?? 0;
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "w-24 text-sm font-medium truncate",
                                                children: m
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 543,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex-1 h-2 bg-[var(--bg)] rounded-full overflow-hidden",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: `h-full rounded-full ${bal >= 0 ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`,
                                                    style: {
                                                        width: `${Math.min(100, Math.abs(bal) / Math.max(...Object.values(balances).map(Math.abs), 1) * 100)}%`
                                                    }
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                    lineNumber: 545,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 544,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: `text-sm font-semibold w-20 text-right ${bal >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`,
                                                children: [
                                                    bal >= 0 ? "+" : "",
                                                    "£",
                                                    bal.toFixed(2)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 552,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, m, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 542,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 538,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 536,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-semibold mb-3",
                                children: "Who pays who"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 567,
                                columnNumber: 13
                            }, this),
                            settlements.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[var(--muted)] text-sm",
                                children: trip.expenses.length === 0 ? "Add some expenses first." : "Everyone's square! Nothing to settle."
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 569,
                                columnNumber: 15
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-2",
                                children: settlements.map((s, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 bg-[var(--bg)] rounded-xl p-3",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-medium",
                                                children: s.from
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 578,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[var(--muted)]",
                                                children: "pays"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 579,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-medium",
                                                children: s.to
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 580,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "ml-auto font-bold text-[var(--accent)]",
                                                children: [
                                                    "£",
                                                    s.amount.toFixed(2)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 581,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 577,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 575,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 566,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                lineNumber: 443,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
        lineNumber: 157,
        columnNumber: 5
    }, this);
}
}}),

};

//# sourceMappingURL=apps_splitz_645e0dbf._.js.map