module.exports = {

"[project]/apps/splitz/.next-internal/server/app/api/trips/route/actions.js [app-rsc] (server actions loader, ecmascript)": (function(__turbopack_context__) {

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
"[project]/apps/splitz/lib/db.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "addExpense": (()=>addExpense),
    "createTrip": (()=>createTrip),
    "deleteExpense": (()=>deleteExpense),
    "getExpenses": (()=>getExpenses),
    "getTrip": (()=>getTrip),
    "initDB": (()=>initDB),
    "updateExpenseSplits": (()=>updateExpenseSplits)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$neondatabase$2f$serverless$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@neondatabase/serverless/index.mjs [app-route] (ecmascript)");
;
const sql = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$neondatabase$2f$serverless$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["neon"])(process.env.DATABASE_URL);
async function initDB() {
    await sql`
    CREATE TABLE IF NOT EXISTS trips (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code VARCHAR(6) UNIQUE NOT NULL,
      name TEXT NOT NULL,
      members TEXT[] NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
    await sql`
    CREATE TABLE IF NOT EXISTS expenses (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
      description TEXT NOT NULL,
      amount NUMERIC(10,2) NOT NULL,
      paid_by TEXT NOT NULL,
      splits JSONB NOT NULL DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
}
async function createTrip(name, members) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const [trip] = await sql`
    INSERT INTO trips (code, name, members)
    VALUES (${code}, ${name}, ${members})
    RETURNING *
  `;
    return trip;
}
async function getTrip(code) {
    const [trip] = await sql`SELECT * FROM trips WHERE code = ${code.toUpperCase()}`;
    return trip ?? null;
}
async function getExpenses(tripId) {
    return sql`SELECT * FROM expenses WHERE trip_id = ${tripId} ORDER BY created_at ASC`;
}
async function addExpense(tripId, description, amount, paidBy, splits) {
    const [expense] = await sql`
    INSERT INTO expenses (trip_id, description, amount, paid_by, splits)
    VALUES (${tripId}, ${description}, ${amount}, ${paidBy}, ${JSON.stringify(splits)})
    RETURNING *
  `;
    return expense;
}
async function deleteExpense(id) {
    await sql`DELETE FROM expenses WHERE id = ${id}`;
}
async function updateExpenseSplits(id, splits) {
    const [expense] = await sql`
    UPDATE expenses SET splits = ${JSON.stringify(splits)} WHERE id = ${id} RETURNING *
  `;
    return expense;
}
}}),
"[project]/apps/splitz/app/api/trips/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var { g: global, __dirname } = __turbopack_context__;
{
__turbopack_context__.s({
    "POST": (()=>POST)
});
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/splitz/lib/db.ts [app-route] (ecmascript)");
;
;
async function POST(req) {
    try {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["initDB"])();
        const { name, members } = await req.json();
        if (!name || !members?.length) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: "name and members required"
            }, {
                status: 400
            });
        }
        const trip = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$lib$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTrip"])(name, members);
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(trip);
    } catch (e) {
        console.error(e);
        return __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$splitz$2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: "Failed to create trip"
        }, {
            status: 500
        });
    }
}
}}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__57fdbe2b._.js.map