module.exports = {

"[project]/apps/splitz/.next-internal/server/app/api/expenses/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": (function(__turbopack_context__) {

var { g: global, __dirname, m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/@libsql/client [external] (@libsql/client, esm_import)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
const mod = await __turbopack_context__.y("@libsql/client");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/apps/splitz/lib/db.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "addExpense": (()=>addExpense),
    "createTrip": (()=>createTrip),
    "deleteExpense": (()=>deleteExpense),
    "getExpenses": (()=>getExpenses),
    "getTrip": (()=>getTrip),
    "initDB": (()=>initDB),
    "updateExpenseSplits": (()=>updateExpenseSplits)
});
var __TURBOPACK__imported__module__$5b$externals$5d2f40$libsql$2f$client__$5b$external$5d$__$2840$libsql$2f$client$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/@libsql/client [external] (@libsql/client, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f40$libsql$2f$client__$5b$external$5d$__$2840$libsql$2f$client$2c$__esm_import$29$__
]);
([__TURBOPACK__imported__module__$5b$externals$5d2f40$libsql$2f$client__$5b$external$5d$__$2840$libsql$2f$client$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
function getClient() {
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f40$libsql$2f$client__$5b$external$5d$__$2840$libsql$2f$client$2c$__esm_import$29$__["createClient"])({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN
    });
}
async function initDB() {
    const db = getClient();
    await db.execute(`
    CREATE TABLE IF NOT EXISTS trips (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      members TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
    await db.execute(`
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      trip_id TEXT NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      paid_by TEXT NOT NULL,
      splits TEXT NOT NULL DEFAULT '{}',
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
}
function uuid() {
    return crypto.randomUUID();
}
function parseMembers(raw) {
    return JSON.parse(raw);
}
function parseSplits(raw) {
    return JSON.parse(raw);
}
async function createTrip(name, members) {
    const db = getClient();
    const id = uuid();
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    await db.execute({
        sql: `INSERT INTO trips (id, code, name, members) VALUES (?, ?, ?, ?)`,
        args: [
            id,
            code,
            name,
            JSON.stringify(members)
        ]
    });
    return {
        id,
        code,
        name,
        members
    };
}
async function getTrip(code) {
    const db = getClient();
    const res = await db.execute({
        sql: `SELECT * FROM trips WHERE code = ?`,
        args: [
            code.toUpperCase()
        ]
    });
    if (!res.rows.length) return null;
    const row = res.rows[0];
    return {
        id: row.id,
        code: row.code,
        name: row.name,
        members: parseMembers(row.members)
    };
}
async function getExpenses(tripId) {
    const db = getClient();
    const res = await db.execute({
        sql: `SELECT * FROM expenses WHERE trip_id = ? ORDER BY created_at ASC`,
        args: [
            tripId
        ]
    });
    return res.rows.map((row)=>({
            id: row.id,
            trip_id: row.trip_id,
            description: row.description,
            amount: row.amount,
            paid_by: row.paid_by,
            splits: parseSplits(row.splits)
        }));
}
async function addExpense(tripId, description, amount, paidBy, splits) {
    const db = getClient();
    const id = uuid();
    await db.execute({
        sql: `INSERT INTO expenses (id, trip_id, description, amount, paid_by, splits) VALUES (?, ?, ?, ?, ?, ?)`,
        args: [
            id,
            tripId,
            description,
            amount,
            paidBy,
            JSON.stringify(splits)
        ]
    });
    return {
        id,
        trip_id: tripId,
        description,
        amount,
        paid_by: paidBy,
        splits
    };
}
async function deleteExpense(id) {
    const db = getClient();
    await db.execute({
        sql: `DELETE FROM expenses WHERE id = ?`,
        args: [
            id
        ]
    });
}
async function updateExpenseSplits(id, splits) {
    const db = getClient();
    await db.execute({
        sql: `UPDATE expenses SET splits = ? WHERE id = ?`,
        args: [
            JSON.stringify(splits),
            id
        ]
    });
    return {
        id,
        splits
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/apps/splitz/lib/settle.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "calcBalances": (()=>calcBalances),
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
function equalSplits(members) {
    const pct = Math.round(100 / members.length * 100) / 100;
    const splits = {};
    members.forEach((m, i)=>{
        splits[m] = i === members.length - 1 ? 100 - pct * (members.length - 1) : pct;
    });
    return splits;
}
}}),
"[project]/apps/splitz/app/api/expenses/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname, a: __turbopack_async_module__ } = __turbopack_context__;
__turbopack_async_module__(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s({
    "POST": (()=>POST)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/lib/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/lib/settle.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
([__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__);
;
;
;
async function POST(req) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["initDB"])();
        const { tripCode, description, amount, paidBy, splits } = await req.json();
        if (!tripCode || !description || !amount || !paidBy) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "Missing required fields"
            }, {
                status: 400
            });
        }
        const trip = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getTrip"])(tripCode);
        if (!trip) return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Trip not found"
        }, {
            status: 404
        });
        const resolvedSplits = splits ?? (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$settle$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["equalSplits"])(trip.members);
        const expense = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["addExpense"])(trip.id, description, Number(amount), paidBy, resolvedSplits);
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(expense);
    } catch (e) {
        console.error(e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to add expense"
        }, {
            status: 500
        });
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__1151c221._.js.map