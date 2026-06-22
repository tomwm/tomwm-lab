import { NextRequest, NextResponse } from "next/server";
import { getTrip, updateCouples, initDB } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await initDB();
    const { code } = await params;
    const { couples } = await req.json();
    const trip = await getTrip(code);
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    const result = await updateCouples(trip.id, couples);
    return NextResponse.json(result);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update couples" }, { status: 500 });
  }
}
