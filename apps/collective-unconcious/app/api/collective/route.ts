import { NextResponse } from "next/server";
import { initDb, getTopItems } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  await initDb();
  const [themes, symbols] = await Promise.all([
    getTopItems("themes", 7, 20),
    getTopItems("symbols", 7, 20),
  ]);
  return NextResponse.json({ themes, symbols });
}
