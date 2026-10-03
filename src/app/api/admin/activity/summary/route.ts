import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin } from "@/lib/serverAuth";
import { ActivityLog } from "@/models/ActivityLog";
import { activityFilter } from "@/lib/activityQuery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOP = 10;

/** Agregados do período e dos filtros atuais: totais, tops (usuário, IP, local, ferramenta, página) e série diária. */
export async function GET(request: NextRequest) {
  const guard = await requireAdmin(request);
  if (guard.response) return guard.response;

  try {
    await connectDB();
    const match = { $match: activityFilter(request) };
    const [facets] = await ActivityLog.aggregate([
      match,
      {
        $facet: {
          totals: [
            {
              $group: {
                _id: null,
                events: { $sum: 1 },
                users: { $addToSet: "$userId" },
                ips: { $addToSet: "$ip" },
                logins: { $sum: { $cond: [{ $eq: ["$event", "login"] }, 1, 0] } },
                failedLogins: { $sum: { $cond: [{ $eq: ["$event", "login_failed"] }, 1, 0] } },
              },
            },
            {
              $project: {
                events: 1,
                logins: 1,
                failedLogins: 1,
                users: { $size: { $setDifference: ["$users", [null]] } },
                ips: { $size: "$ips" },
              },
            },
          ],
          byEvent: [{ $group: { _id: "$event", count: { $sum: 1 } } }, { $sort: { count: -1 } }],
          byDay: [
            { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "America/Sao_Paulo" } }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          topUsers: [
            { $match: { email: { $nin: [null, ""] }, userId: { $ne: null } } },
            { $group: { _id: { id: "$userId", email: "$email" }, count: { $sum: 1 }, ips: { $addToSet: "$ip" }, last: { $max: "$createdAt" } } },
            { $project: { count: 1, last: 1, ips: { $size: "$ips" } } },
            { $sort: { count: -1 } },
            { $limit: TOP },
          ],
          topIps: [
            { $group: { _id: "$ip", count: { $sum: 1 }, users: { $addToSet: "$userId" }, country: { $last: "$country" }, city: { $last: "$city" } } },
            { $project: { count: 1, country: 1, city: 1, users: { $size: { $setDifference: ["$users", [null]] } } } },
            { $sort: { count: -1 } },
            { $limit: TOP },
          ],
          topPlaces: [
            { $match: { country: { $nin: [null, ""] } } },
            { $group: { _id: { country: "$country", region: "$region", city: "$city" }, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: TOP },
          ],
          topTools: [{ $match: { tool: { $nin: [null, ""] } } }, { $group: { _id: "$tool", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: TOP }],
          topPaths: [{ $match: { path: { $nin: [null, ""] } } }, { $group: { _id: "$path", count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: TOP }],
        },
      },
    ]);
    const t = facets.totals[0] ?? { events: 0, users: 0, ips: 0, logins: 0, failedLogins: 0 };
    return NextResponse.json({
      totals: { events: t.events, users: t.users, ips: t.ips, logins: t.logins, failedLogins: t.failedLogins },
      byEvent: facets.byEvent.map((r: { _id: string; count: number }) => ({ event: r._id, count: r.count })),
      byDay: facets.byDay.map((r: { _id: string; count: number }) => ({ day: r._id, count: r.count })),
      topUsers: facets.topUsers.map((r: { _id: { id: string; email: string }; count: number; ips: number; last: Date }) => ({
        userId: String(r._id.id), email: r._id.email, count: r.count, ips: r.ips, last: r.last,
      })),
      topIps: facets.topIps.map((r: { _id: string; count: number; users: number; country?: string; city?: string }) => ({
        ip: r._id, count: r.count, users: r.users, country: r.country ?? null, city: r.city ?? null,
      })),
      topPlaces: facets.topPlaces.map((r: { _id: { country: string; region?: string; city?: string }; count: number }) => ({
        country: r._id.country, region: r._id.region ?? null, city: r._id.city ?? null, count: r.count,
      })),
      topTools: facets.topTools.map((r: { _id: string; count: number }) => ({ tool: r._id, count: r.count })),
      topPaths: facets.topPaths.map((r: { _id: string; count: number }) => ({ path: r._id, count: r.count })),
    });
  } catch (err) {
    console.error("[admin/activity/summary]", err);
    return apiError(request, "internal", 500);
  }
}
