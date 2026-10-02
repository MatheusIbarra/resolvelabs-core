import { NextResponse, type NextRequest } from "next/server";
import { User } from "@/models/User";
import { requireAdmin } from "@/lib/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 200;

export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  try {
    const users = await User.find().sort({ createdAt: -1 }).limit(LIMIT);
    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        usageCount: u.usageCount,
        planExpiresAt: u.planExpiresAt ?? null,
        affiliateCode: u.affiliateCode ?? null,
        referredBy: u.referredBy ?? null,
        createdAt: u.createdAt,
      })),
      limit: LIMIT,
    });
  } catch (err) {
    console.error("[admin/users]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
