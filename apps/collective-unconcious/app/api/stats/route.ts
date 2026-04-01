import { NextResponse } from "next/server";
import { initDb, getDreamerCountForToday, getTotalDreamerCount } from "@/lib/db";

export async function GET() {
  await initDb();
  const today = new Date().toISOString().split("T")[0];
  return NextResponse.json({
    today: await getDreamerCountForToday(today),
    total: await getTotalDreamerCount(),
  });
}
export const dynamic = "force-dynamic";
