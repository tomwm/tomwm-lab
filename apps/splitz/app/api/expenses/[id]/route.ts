import { NextRequest, NextResponse } from "next/server";
import { deleteExpense, updateExpenseSplits, updateExpense, initDB } from "@/lib/db";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDB();
    const { id } = await params;
    await deleteExpense(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await initDB();
    const { id } = await params;
    const body = await req.json();
    let expense;
    if (body.splits) {
      expense = await updateExpenseSplits(id, body.splits);
    } else {
      expense = await updateExpense(id, body.description, Number(body.amount), body.paidBy);
    }
    return NextResponse.json(expense);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
