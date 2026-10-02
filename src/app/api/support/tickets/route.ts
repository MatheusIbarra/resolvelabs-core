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

const INTERNAL_ERROR = { error: "Erro interno. Tente novamente." };

/** Lista os tickets do usuário logado; para admin, todos (com o e-mail do autor). */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated();

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
    return NextResponse.json(INTERNAL_ERROR, { status: 500 });
  }
}

/** Abre um ticket: body { subject, message }. A primeira mensagem é do usuário. */
export async function POST(request: NextRequest) {
  let body: { subject?: unknown; message?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const subject = parseText(body.subject, SUBJECT_MAX);
  if (!subject) return NextResponse.json({ error: `Informe um assunto (até ${SUBJECT_MAX} caracteres).` }, { status: 400 });
  const message = parseText(body.message, MESSAGE_MAX);
  if (!message) return NextResponse.json({ error: `Informe a mensagem (até ${MESSAGE_MAX} caracteres).` }, { status: 400 });

  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated();

    const active = await Ticket.countDocuments({ userId: user._id, status: { $ne: "closed" } });
    if (active >= MAX_ACTIVE_TICKETS_PER_USER) {
      return NextResponse.json(
        { error: `Você já tem ${MAX_ACTIVE_TICKETS_PER_USER} tickets em aberto. Aguarde a resposta ou use um deles.` },
        { status: 429 },
      );
    }

    const ticket = await Ticket.create({ userId: user._id, subject, messages: [{ sender: "user", message }] });
    return NextResponse.json({ ticket: serializeTicket(ticket) }, { status: 201 });
  } catch (err) {
    console.error("[support/tickets POST]", err);
    return NextResponse.json(INTERNAL_ERROR, { status: 500 });
  }
}
