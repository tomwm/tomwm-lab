import { NextRequest, NextResponse } from "next/server";
import { getTrip, initDB } from "@/lib/db";
import { createClient } from "@libsql/client";

function getClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  try {
    await initDB();
    const { code } = await params;
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

    const trip = await getTrip(code);
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    if (trip.members.includes(name.trim())) {
      return NextResponse.json({ error: "Member already exists" }, { status: 400 });
    }

    const newMembers = [...trip.members, name.trim()];
    const db = getClient();
    await db.execute({
      sql: `UPDATE trips SET members = ? WHERE id = ?`,
      args: [JSON.stringify(newMembers), trip.id],
    });

    return NextResponse.json({ members: newMembers });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add member" }, { status: 500 });
  }
}
