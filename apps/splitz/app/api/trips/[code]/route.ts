import { NextRequest, NextResponse } from "next/server";
import { getTrip, getExpenses, initDB } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await initDB();
    const { code } = await params;
    const trip = await getTrip(code);
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    const expenses = await getExpenses(trip.id);
    return NextResponse.json({ ...trip, expenses });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load trip" }, { status: 500 });
  }
}
