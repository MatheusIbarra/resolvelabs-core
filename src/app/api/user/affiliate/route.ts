import { NextResponse, type NextRequest } from "next/server";
import { User } from "@/models/User";
import { getCurrentUser, unauthenticated } from "@/lib/serverAuth";
import { ensureAffiliateCode } from "@/lib/referrals";
import { appUrl } from "@/lib/stripe";
import { AFFILIATE_REWARD_DAYS } from "@/lib/content";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Dados do programa de indicação do usuário logado. */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated();

    const code = await ensureAffiliateCode(user);
    const [referredCount, convertedCount] = await Promise.all([
      User.countDocuments({ referredBy: code }),
      User.countDocuments({ referredBy: code, referralRewardedAt: { $exists: true } }),
    ]);

    return NextResponse.json(
      {
        code,
        link: `${appUrl(request.nextUrl.origin)}/?ref=${code}`,
        referredCount,
        convertedCount, // indicados que já iniciaram uma assinatura
        rewardDays: user.referralRewardDays ?? 0,
        rewardDaysPerReferral: AFFILIATE_REWARD_DAYS,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    console.error("[user/affiliate]", err);
    return NextResponse.json({ error: "Erro interno. Tente novamente." }, { status: 500 });
  }
}
