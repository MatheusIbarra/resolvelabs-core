import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";
import { REF_COOKIE, parseAffiliateCode } from "@/lib/affiliate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Indica se o visitante chegou por um link de indicação válido (cookie definido pelo middleware). */
export async function GET(request: NextRequest) {
  const code = parseAffiliateCode(request.cookies.get(REF_COOKIE)?.value);
  if (!code) return NextResponse.json({ code: null });

  try {
    await connectDB();
    const exists = await User.exists({ affiliateCode: code });
    return NextResponse.json({ code: exists ? code : null }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[referral]", err);
    return NextResponse.json({ code: null });
  }
}
