import { NextRequest, NextResponse } from "next/server";
import { getTrip, updateCurrency, initDB } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await initDB();
    const { code } = await params;
    const { currency } = await req.json();
    const trip = await getTrip(code);
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    const result = await updateCurrency(trip.id, currency);
    return NextResponse.json({ currency: result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update currency" }, { status: 500 });
  }
}
