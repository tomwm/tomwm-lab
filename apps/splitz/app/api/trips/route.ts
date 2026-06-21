import { NextRequest, NextResponse } from "next/server";
import { createTrip, initDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const { name, members } = await req.json();
    if (!name || !members?.length) {
      return NextResponse.json({ error: "name and members required" }, { status: 400 });
    }
    const trip = await createTrip(name, members);
    return NextResponse.json(trip);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create trip" }, { status: 500 });
  }
}
