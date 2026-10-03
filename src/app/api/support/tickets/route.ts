import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import { Ticket } from "@/models/Ticket";
import { User } from "@/models/User";
import { getCurrentUser, unauthenticated } from "@/lib/serverAuth";
import {
  MAX_ACTIVE_TICKETS_PER_USER,
  MESSAGE_MAX,
  SUBJECT_MAX,
  parseText,
  serializeTicket,
  serializeTicketSummary,
} from "@/lib/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";


/** Lista os tickets do usuário logado; para admin, todos (com o e-mail do autor). */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated(request);

    const isAdmin = user.role === "admin";
    const status = request.nextUrl.searchParams.get("status");
    const filter: Record<string, unknown> = isAdmin ? {} : { userId: user._id };
    if (status === "open" || status === "answered" || status === "closed") filter.status = status;

    const tickets = await Ticket.find(filter).sort({ updatedAt: -1 }).limit(200);

    let emails = new Map<string, string>();
    if (isAdmin && tickets.length > 0) {
      const users = await User.find({ _id: { $in: [...new Set(tickets.map((t) => String(t.userId)))] } }).select("email");
      emails = new Map(users.map((u) => [u.id as string, u.email]));
    }

    return NextResponse.json({
      tickets: tickets.map((t) => serializeTicketSummary(t, isAdmin ? (emails.get(String(t.userId)) ?? null) : null)),
    });
  } catch (err) {
    console.error("[support/tickets GET]", err);
    return apiError(request, "internal", 500);
  }
}

/** Abre um ticket: body { subject, message }. A primeira mensagem é do usuário. */
export async function POST(request: NextRequest) {
  let body: { subject?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError(request, "invalidBody", 400);
  }

  const subject = parseText(body.subject, SUBJECT_MAX);
  if (!subject) return apiError(request, "ticketSubject", 400, { max: SUBJECT_MAX });
  const message = parseText(body.message, MESSAGE_MAX);
  if (!message) return apiError(request, "ticketMessage", 400, { max: MESSAGE_MAX });

  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated(request);

    const active = await Ticket.countDocuments({ userId: user._id, status: { $ne: "closed" } });
    if (active >= MAX_ACTIVE_TICKETS_PER_USER) {
      return apiError(request, "ticketLimit", 429, { max: MAX_ACTIVE_TICKETS_PER_USER });
    }

    const ticket = await Ticket.create({ userId: user._id, subject, messages: [{ sender: "user", message }] });
    return NextResponse.json({ ticket: serializeTicket(ticket) }, { status: 201 });
  } catch (err) {
    console.error("[support/tickets POST]", err);
    return apiError(request, "internal", 500);
  }
}
