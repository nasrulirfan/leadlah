import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const result = await db.query(
      `SELECT * FROM targets 
       WHERE user_id = $1 
       ORDER BY year DESC, month DESC NULLS LAST`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching targets:", error);
    return NextResponse.json({ error: "Failed to fetch targets" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const body = await request.json();

    const { year, month, targetUnits, targetIncome } = body;

    const result = await db.query(
      `INSERT INTO targets (user_id, year, month, target_units, target_income)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, year, month) 
       DO UPDATE SET 
         target_units = EXCLUDED.target_units,
         target_income = EXCLUDED.target_income,
         updated_at = NOW()
       RETURNING *`,
      [userId, year, month || null, targetUnits, targetIncome]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error creating target:", error);
    return NextResponse.json({ error: "Failed to create target" }, { status: 500 });
  }
}
