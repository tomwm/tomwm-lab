import { NextRequest, NextResponse } from "next/server";
import { addExpense, getTrip, initDB } from "@/lib/db";
import { equalSplits } from "@/lib/settle";

export async function POST(req: NextRequest) {
  try {
    await initDB();
    const { tripCode, description, amount, paidBy, splits } = await req.json();
    if (!tripCode || !description || !amount || !paidBy) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    const trip = await getTrip(tripCode);
    if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

    const resolvedSplits = splits ?? equalSplits(trip.members);
    const expense = await addExpense(trip.id, description, Number(amount), paidBy, resolvedSplits);
    return NextResponse.json(expense);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to add expense" }, { status: 500 });
  }
}
