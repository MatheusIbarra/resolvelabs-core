import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Desempenho por código de afiliado: cadastros gerados e quantos já são PRO. */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  try {
    const rows = await User.aggregate<{ _id: string; signups: number; conversions: number; lastSignupAt: Date }>([
      { $match: { referredBy: { $type: "string", $ne: "" } } },
      {
        $group: {
          _id: "$referredBy",
          signups: { $sum: 1 },
          conversions: { $sum: { $cond: [{ $eq: ["$role", "pro"] }, 1, 0] } },
          lastSignupAt: { $max: "$createdAt" },
        },
      },
      { $sort: { signups: -1, lastSignupAt: -1 } },
      { $limit: 200 },
    ]);

    const owners = await User.find({ affiliateCode: { $in: rows.map((r) => r._id) } }, { email: 1, affiliateCode: 1 });
    const ownerByCode = new Map(owners.map((o) => [o.affiliateCode, o.email]));

    return NextResponse.json({
      affiliates: rows.map((r) => ({
        code: r._id,
        ownerEmail: ownerByCode.get(r._id) ?? null,
        signups: r.signups,
        conversions: r.conversions,
        lastSignupAt: r.lastSignupAt,
      })),
    });
  } catch (err) {
    console.error("[admin/affiliates]", err);
    return apiError(request, "internal", 500);
  }
}
