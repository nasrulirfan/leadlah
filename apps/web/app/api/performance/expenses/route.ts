import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { serializeExpenseRow } from "@/lib/performance/serializers";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let query = `SELECT * FROM expenses WHERE user_id = $1`;
    const params: any[] = [userId];

    if (year) {
      query += ` AND EXTRACT(YEAR FROM date) = $${params.length + 1}`;
      params.push(year);
    }

    if (month) {
      query += ` AND EXTRACT(MONTH FROM date) = $${params.length + 1}`;
      params.push(month);
    }

    query += ` ORDER BY date DESC`;

    const result = await db.query(query, params);

    return NextResponse.json(result.rows.map(serializeExpenseRow));
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const body = await request.json();

    const { category, amount, description, date, receiptUrl } = body;

    const result = await db.query(
      `INSERT INTO expenses (user_id, category, amount, description, date, receipt_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [userId, category, amount, description, date, receiptUrl || null]
    );

    return NextResponse.json(serializeExpenseRow(result.rows[0]));
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
