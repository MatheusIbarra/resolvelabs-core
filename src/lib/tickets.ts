import type { HydratedDocument } from "mongoose";
import type { ITicket } from "@/models/Ticket";

export const SUBJECT_MAX = 120;
export const MESSAGE_MAX = 4000;
/** Teto de mensagens por conversa e de tickets abertos por usuário (contenção de abuso). */
export const MAX_MESSAGES_PER_TICKET = 200;
export const MAX_ACTIVE_TICKETS_PER_USER = 5;

type TicketDoc = HydratedDocument<ITicket>;

export function parseText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length > 0 && text.length <= max ? text : null;
}

export function serializeMessage(m: ITicket["messages"][number]) {
  return { id: String(m._id), sender: m.sender, message: m.message, createdAt: m.createdAt.toISOString() };
}

/** Resumo para listagens: sem o histórico completo. `userEmail` só é preenchido para admin. */
export function serializeTicketSummary(ticket: TicketDoc, userEmail?: string | null) {
  const last = ticket.messages[ticket.messages.length - 1];
  return {
    id: ticket.id as string,
    subject: ticket.subject,
    status: ticket.status,
    messageCount: ticket.messages.length,
    lastSender: last?.sender ?? null,
    lastMessage: last ? last.message.slice(0, 140) : "",
    userEmail: userEmail ?? null,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

export function serializeTicket(ticket: TicketDoc, userEmail?: string | null) {
  return { ...serializeTicketSummary(ticket, userEmail), messages: ticket.messages.map(serializeMessage) };
}
