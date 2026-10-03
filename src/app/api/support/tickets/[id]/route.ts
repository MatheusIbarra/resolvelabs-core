import { apiError } from "@/lib/apiError";
import { NextResponse, type NextRequest } from "next/server";
import { isValidObjectId } from "mongoose";
import { Ticket } from "@/models/Ticket";
import { User } from "@/models/User";
import { getCurrentUser, unauthenticated, type UserDoc } from "@/lib/serverAuth";
import { MAX_MESSAGES_PER_TICKET, MESSAGE_MAX, parseText, serializeMessage, serializeTicket } from "@/lib/tickets";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };


/** Dono do ticket ou admin. Para quem não tem acesso, responde 404 (não revela que o ticket existe). */
function canAccess(user: UserDoc, ticketUserId: unknown): boolean {
  return user.role === "admin" || String(ticketUserId) === user.id;
}

/** Detalhes + histórico. Usado pelo polling do widget e do painel admin. */
export async function GET(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isValidObjectId(id)) return apiError(request, "invalidId", 400);

  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated(request);

    const ticket = await Ticket.findById(id);
    if (!ticket || !canAccess(user, ticket.userId)) return apiError(request, "ticketNotFound", 404);

    let email: string | null = null;
    if (user.role === "admin") email = (await User.findById(ticket.userId).select("email"))?.email ?? null;
    return NextResponse.json({ ticket: serializeTicket(ticket, email) });
  } catch (err) {
    console.error("[support/tickets/:id GET]", err);
    return apiError(request, "internal", 500);
  }
}

/**
 * Adiciona uma mensagem: body { message }. Quem responde define o remetente (usuário ou admin) e o status:
 * resposta do admin -> 'answered'; resposta do usuário -> 'open'. Ticket fechado não aceita mensagens.
 */
export async function POST(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isValidObjectId(id)) return apiError(request, "invalidId", 400);

  let body: { message?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError(request, "invalidBody", 400);
  }
  const message = parseText(body.message, MESSAGE_MAX);
  if (!message) return apiError(request, "ticketMessage", 400, { max: MESSAGE_MAX });

  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated(request);

    const sender = user.role === "admin" ? "admin" : "user";
    // Filtro atômico: só anexa se o ticket pertence ao autor (ou é admin), segue aberto e não estourou o limite.
    const filter: Record<string, unknown> = {
      _id: id,
      status: { $ne: "closed" },
      [`messages.${MAX_MESSAGES_PER_TICKET - 1}`]: { $exists: false },
    };
    if (sender === "user") filter.userId = user._id;

    const ticket = await Ticket.findOneAndUpdate(
      filter,
      {
        $push: { messages: { sender, message, createdAt: new Date() } },
        $set: { status: sender === "admin" ? "answered" : "open" },
      },
      { new: true },
    );

    if (!ticket) {
      // Diferencia o motivo da recusa para devolver uma mensagem útil.
      const existing = await Ticket.findById(id).select("userId status messages");
      if (!existing || !canAccess(user, existing.userId)) return apiError(request, "ticketNotFound", 404);
      if (existing.status === "closed") return apiError(request, "ticketClosed", 409);
      return apiError(request, "ticketMessages", 429);
    }

    return NextResponse.json({ ticket: serializeTicket(ticket), message: serializeMessage(ticket.messages[ticket.messages.length - 1]) }, { status: 201 });
  } catch (err) {
    console.error("[support/tickets/:id POST]", err);
    return apiError(request, "internal", 500);
  }
}

/** Fecha o ticket (somente admin): body { status: "closed" }. */
export async function PATCH(request: NextRequest, { params }: Ctx) {
  const { id } = await params;
  if (!isValidObjectId(id)) return apiError(request, "invalidId", 400);

  let body: { status?: unknown };
  try {
    body = await request.json();
  } catch {
    return apiError(request, "invalidBody", 400);
  }
  if (body.status !== "closed") return apiError(request, "onlyClose", 400);

  try {
    const user = await getCurrentUser(request);
    if (!user) return unauthenticated(request);
    if (user.role !== "admin") return apiError(request, "adminOnly", 403);

    const ticket = await Ticket.findByIdAndUpdate(id, { status: "closed" }, { new: true });
    if (!ticket) return apiError(request, "ticketNotFound", 404);
    return NextResponse.json({ ticket: serializeTicket(ticket) });
  } catch (err) {
    console.error("[support/tickets/:id PATCH]", err);
    return apiError(request, "internal", 500);
  }
}
