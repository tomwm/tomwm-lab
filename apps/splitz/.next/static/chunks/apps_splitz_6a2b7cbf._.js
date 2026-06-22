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
    "equalSplits": (()=>equalSplits),
    "mergeCouplesToBalances": (()=>mergeCouplesToBalances)
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
function mergeCouplesToBalances(balances, couples) {
    const merged = {
        ...balances
    };
    for (const [a, b] of couples){
        if (merged[a] === undefined || merged[b] === undefined) continue;
        const combinedName = `${a} & ${b}`;
        merged[combinedName] = (merged[a] ?? 0) + (merged[b] ?? 0);
        delete merged[a];
        delete merged[b];
    }
    return merged;
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
    // Couples
    const [couplesDraft, setCouplesDraft] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [savingCouples, setSavingCouples] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
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
            setCouplesDraft(data.couples || []);
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
    async function saveCouples(newCouples) {
        setSavingCouples(true);
        await fetch(`${BASE}/api/trips/${code}/couples`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                couples: newCouples
            })
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
            lineNumber: 176,
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
                    lineNumber: 185,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    href: "/",
                    className: "text-[var(--accent)] underline",
                    children: "Back to home"
                }, void 0, false, {
                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                    lineNumber: 186,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
            lineNumber: 184,
            columnNumber: 7
        }, this);
    }
    const hasGlobalShares = Object.keys(trip.member_shares || {}).length > 0;
    const rawBalances = hasGlobalShares ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calcBalancesGlobal"])(trip.members, trip.expenses, trip.member_shares) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["calcBalances"])(trip.members, trip.expenses);
    const balances = (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["mergeCouplesToBalances"])(rawBalances, trip.couples || []);
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
                                        lineNumber: 207,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-center gap-2 flex-wrap mt-0.5",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-[var(--muted)] text-sm",
                                                children: trip.members.join(", ")
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 209,
                                                columnNumber: 15
                                            }, this),
                                            !showAddMember && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>{
                                                    setShowAddMember(true);
                                                    setAddMemberError("");
                                                    setNewMemberName("");
                                                },
                                                className: "text-xs text-[var(--accent)] font-medium hover:underline",
                                                children: "+ Add member"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 211,
                                                columnNumber: 17
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 208,
                                        columnNumber: 13
                                    }, this),
                                    showAddMember && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                        onSubmit: addMember,
                                        className: "flex items-center gap-2 mt-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "text",
                                                value: newMemberName,
                                                onChange: (e)=>setNewMemberName(e.target.value),
                                                placeholder: "Name",
                                                autoFocus: true,
                                                className: "border border-[var(--border)] rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] w-32"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 221,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                disabled: addingMember || !newMemberName.trim(),
                                                className: "bg-[var(--accent)] text-white text-xs font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40",
                                                children: addingMember ? "…" : "Add"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 229,
                                                columnNumber: 17
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setShowAddMember(false),
                                                className: "text-xs text-[var(--muted)] hover:text-[var(--text)]",
                                                children: "Cancel"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 236,
                                                columnNumber: 17
                                            }, this),
                                            addMemberError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "text-xs text-[var(--danger)]",
                                                children: addMemberError
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 243,
                                                columnNumber: 36
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 220,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 206,
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
                                        lineNumber: 251,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-[var(--muted)] group-hover:text-white/80 mt-0.5",
                                        children: copied ? "Copied!" : "Tap to copy"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 254,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 247,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 205,
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
                                        lineNumber: 262,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[var(--muted)]",
                                        children: "Total spend"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 263,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 261,
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
                                        lineNumber: 266,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[var(--muted)]",
                                        children: "Expenses"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 267,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 265,
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
                                        lineNumber: 270,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "text-[var(--muted)]",
                                        children: "Travellers"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 271,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 269,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 260,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                lineNumber: 204,
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
                        lineNumber: 279,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                lineNumber: 277,
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
                                lineNumber: 298,
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
                                        lineNumber: 300,
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
                                                        lineNumber: 310,
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
                                                        lineNumber: 311,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 309,
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
                                                        lineNumber: 328,
                                                        columnNumber: 23
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 322,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 308,
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
                                                        lineNumber: 336,
                                                        columnNumber: 21
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>setCustomSplits(customSplits ? null : (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["equalSplits"])(trip.members)),
                                                        className: "text-xs text-[var(--accent)] underline",
                                                        children: customSplits ? "Reset to equal" : "Customise %"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 337,
                                                        columnNumber: 21
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 335,
                                                columnNumber: 19
                                            }, this),
                                            customSplits ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$components$2f$SplitEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                members: trip.members,
                                                splits: customSplits,
                                                onChange: setCustomSplits,
                                                totalAmount: Number(amount) || undefined
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 347,
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
                                                lineNumber: 354,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 334,
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
                                                lineNumber: 361,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "submit",
                                                disabled: saving || customSplits !== null && Math.abs(Object.values(customSplits).reduce((a, b)=>a + b, 0) - 100) > 0.5,
                                                className: "flex-1 bg-[var(--accent)] text-white py-2.5 rounded-xl font-semibold text-sm disabled:opacity-40",
                                                children: saving ? "Saving…" : "Add expense"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 368,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 360,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 299,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 297,
                        columnNumber: 13
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        onClick: openAdd,
                        className: "bg-[var(--accent)] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity",
                        children: "+ Add expense"
                    }, void 0, false, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 383,
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
                                lineNumber: 394,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: "No expenses yet. Add the first one!"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 395,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 393,
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
                                                        lineNumber: 403,
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
                                                                lineNumber: 405,
                                                                columnNumber: 33
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 404,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 402,
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
                                                lineNumber: 408,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 401,
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
                                                lineNumber: 413,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$components$2f$SplitEditor$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                                members: trip.members,
                                                splits: splitDraft,
                                                onChange: setSplitDraft,
                                                totalAmount: Number(exp.amount)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 414,
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
                                                        lineNumber: 421,
                                                        columnNumber: 25
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>saveSplits(exp.id),
                                                        disabled: Math.abs(splitTotal - 100) > 0.5,
                                                        className: "flex-1 bg-[var(--accent)] text-white py-1.5 rounded-lg text-sm font-medium disabled:opacity-40",
                                                        children: "Save"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 427,
                                                        columnNumber: 25
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 420,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 412,
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
                                                lineNumber: 439,
                                                columnNumber: 25
                                            }, this))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 437,
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
                                                lineNumber: 448,
                                                columnNumber: 23
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: ()=>deleteExpense(exp.id),
                                                className: "text-xs text-[var(--danger)] font-medium hover:underline ml-auto",
                                                children: "Delete"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 454,
                                                columnNumber: 23
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 447,
                                        columnNumber: 21
                                    }, this)
                                ]
                            }, exp.id, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 400,
                                columnNumber: 17
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 398,
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
                                        lineNumber: 474,
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
                                        lineNumber: 475,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 473,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-[var(--muted)] mb-3",
                                children: globalSharesMode ? "Each person's share of the total trip spend. Overrides per-expense splits." : "Settlement uses per-expense splits. Switch to set one overall % per person."
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 488,
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
                                        lineNumber: 496,
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
                                                lineNumber: 503,
                                                columnNumber: 19
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                onClick: saveGlobalShares,
                                                disabled: savingShares || !sharesTotalValid,
                                                className: "ml-auto bg-[var(--accent)] text-white text-sm font-semibold px-4 py-1.5 rounded-lg disabled:opacity-40",
                                                children: savingShares ? "Saving…" : "Apply"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 509,
                                                columnNumber: 19
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 502,
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
                                        lineNumber: 522,
                                        columnNumber: 17
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "text-xs text-[var(--accent)] font-medium",
                                        children: "Overall splits active"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 523,
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
                                        lineNumber: 524,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 521,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 472,
                        columnNumber: 11
                    }, this),
                    trip.members.length >= 2 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-semibold mb-1",
                                children: "Linked finances"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 545,
                                columnNumber: 15
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-xs text-[var(--muted)] mb-3",
                                children: "Mark couples or people who share finances — their balances are combined for settlement."
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 546,
                                columnNumber: 15
                            }, this),
                            couplesDraft.map(([a, b], i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 mb-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-sm font-medium flex-1",
                                            children: [
                                                a,
                                                " & ",
                                                b
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                            lineNumber: 552,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                const next = couplesDraft.filter((_, j)=>j !== i);
                                                setCouplesDraft(next);
                                                saveCouples(next);
                                            },
                                            className: "text-xs text-[var(--danger)] hover:underline",
                                            children: "Remove"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                            lineNumber: 553,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, i, true, {
                                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                    lineNumber: 551,
                                    columnNumber: 17
                                }, this)),
                            (()=>{
                                const paired = new Set(couplesDraft.flat());
                                const available = trip.members.filter((m)=>!paired.has(m));
                                if (available.length < 2) return null;
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center gap-2 mt-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            id: "couple-a",
                                            className: "flex-1 border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
                                            defaultValue: "",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    disabled: true,
                                                    children: "Person 1"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                    lineNumber: 578,
                                                    columnNumber: 23
                                                }, this),
                                                available.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: m,
                                                        children: m
                                                    }, m, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 579,
                                                        columnNumber: 45
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                            lineNumber: 573,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[var(--muted)] text-sm",
                                            children: "&"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                            lineNumber: 581,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            id: "couple-b",
                                            className: "flex-1 border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]",
                                            defaultValue: "",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    disabled: true,
                                                    children: "Person 2"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                    lineNumber: 587,
                                                    columnNumber: 23
                                                }, this),
                                                available.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: m,
                                                        children: m
                                                    }, m, false, {
                                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                        lineNumber: 588,
                                                        columnNumber: 45
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                            lineNumber: 582,
                                            columnNumber: 21
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            disabled: savingCouples,
                                            onClick: ()=>{
                                                const a = document.getElementById("couple-a").value;
                                                const b = document.getElementById("couple-b").value;
                                                if (!a || !b || a === b) return;
                                                const next = [
                                                    ...couplesDraft,
                                                    [
                                                        a,
                                                        b
                                                    ]
                                                ];
                                                setCouplesDraft(next);
                                                saveCouples(next);
                                            },
                                            className: "bg-[var(--accent)] text-white text-sm font-semibold px-3 py-1.5 rounded-lg disabled:opacity-40 whitespace-nowrap",
                                            children: "Link"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                            lineNumber: 590,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                    lineNumber: 572,
                                    columnNumber: 19
                                }, this);
                            })()
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 544,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white rounded-2xl border border-[var(--border)] p-5 shadow-sm",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                className: "font-semibold mb-3",
                                children: "Who's owed what"
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 612,
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
                                                lineNumber: 618,
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
                                                    lineNumber: 620,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 619,
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
                                                lineNumber: 627,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, m, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 617,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 613,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 611,
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
                                lineNumber: 642,
                                columnNumber: 13
                            }, this),
                            settlements.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "text-[var(--muted)] text-sm",
                                children: trip.expenses.length === 0 ? "Add some expenses first." : "Everyone's square! Nothing to settle."
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 644,
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
                                                lineNumber: 653,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-[var(--muted)]",
                                                children: "pays"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 654,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "font-medium",
                                                children: s.to
                                            }, void 0, false, {
                                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                                lineNumber: 655,
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
                                                lineNumber: 656,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                        lineNumber: 652,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                                lineNumber: 650,
                                columnNumber: 15
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                        lineNumber: 641,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
                lineNumber: 470,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/splitz/app/trip/[code]/page.tsx",
        lineNumber: 202,
        columnNumber: 5
    }, this);
}
_s(TripPage, "wA9A/54xrGsANHjX4rfkZu6tkNI=", false, function() {
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
}]);

//# sourceMappingURL=apps_splitz_6a2b7cbf._.js.map