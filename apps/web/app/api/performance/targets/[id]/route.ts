import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";
import { serializeTargetRow } from "@/lib/performance/serializers";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const body = await request.json();
    const { id } = params;

    const result = await db.query(
      `UPDATE targets 
       SET target_units = COALESCE($1, target_units),
           target_income = COALESCE($2, target_income),
           updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [body.targetUnits, body.targetIncome, id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    return NextResponse.json(serializeTargetRow(result.rows[0]));
  } catch (error) {
    console.error("Error updating target:", error);
    return NextResponse.json({ error: "Failed to update target" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireSession();
    const userId = session.user.id;
    const { id } = params;

    const result = await db.query(
      `DELETE FROM targets WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Target not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting target:", error);
    return NextResponse.json({ error: "Failed to delete target" }, { status: 500 });
  }
}
