const CHUNK_PUBLIC_PATH = "server/pages/_document.js";
const runtime = require("../chunks/ssr/[turbopack]_runtime.js");
runtime.loadChunk("server/chunks/ssr/d187a_1e0ce52e._.js");
runtime.loadChunk("server/chunks/ssr/[root-of-the-server]__c75c51b7._.js");
runtime.getOrInstantiateRuntimeModule("[project]/apps/splitz/node_modules/next/document.js [ssr] (ecmascript)", CHUNK_PUBLIC_PATH);
module.exports = runtime.getOrInstantiateRuntimeModule("[project]/apps/splitz/node_modules/next/document.js [ssr] (ecmascript)", CHUNK_PUBLIC_PATH).exports;
