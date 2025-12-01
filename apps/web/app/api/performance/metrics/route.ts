import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const userId = session.user.id;

    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const month = searchParams.get("month") ? parseInt(searchParams.get("month")!) : null;

    // Get target
    const targetResult = await db.query(
      `SELECT * FROM targets 
       WHERE user_id = $1 AND year = $2 AND month ${month ? '= $3' : 'IS NULL'}
       LIMIT 1`,
      month ? [userId, year, month] : [userId, year]
    );

    // Get commissions
    const commissionQuery = month
      ? `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as units
         FROM commissions 
         WHERE user_id = $1 
         AND EXTRACT(YEAR FROM closed_date) = $2 
         AND EXTRACT(MONTH FROM closed_date) = $3`
      : `SELECT COALESCE(SUM(amount), 0) as total, COUNT(*) as units
         FROM commissions 
         WHERE user_id = $1 
         AND EXTRACT(YEAR FROM closed_date) = $2`;

    const commissionResult = await db.query(
      commissionQuery,
      month ? [userId, year, month] : [userId, year]
    );

    // Get expenses
    const expenseQuery = month
      ? `SELECT COALESCE(SUM(amount), 0) as total
         FROM expenses 
         WHERE user_id = $1 
         AND EXTRACT(YEAR FROM date) = $2 
         AND EXTRACT(MONTH FROM date) = $3`
      : `SELECT COALESCE(SUM(amount), 0) as total
         FROM expenses 
         WHERE user_id = $1 
         AND EXTRACT(YEAR FROM date) = $2`;

    const expenseResult = await db.query(
      expenseQuery,
      month ? [userId, year, month] : [userId, year]
    );

    const target = targetResult.rows[0] || { target_units: 0, target_income: 0 };
    const commission = parseFloat(commissionResult.rows[0].total);
    const units = parseInt(commissionResult.rows[0].units);
    const expenses = parseFloat(expenseResult.rows[0].total);
    const netIncome = commission - expenses;

    const metrics = {
      period: { year, month },
      target: {
        units: target.target_units,
        income: target.target_income
      },
      actual: {
        units,
        commission,
        expenses,
        netIncome
      },
      progress: {
        unitsPercent: target.target_units > 0 ? (units / target.target_units) * 100 : 0,
        incomePercent: target.target_income > 0 ? (netIncome / target.target_income) * 100 : 0
      }
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return NextResponse.json({ error: "Failed to fetch metrics" }, { status: 500 });
  }
}
