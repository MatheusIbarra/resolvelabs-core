// Cliente da API de suporte (/api/support/*). Autorização é sempre aplicada no servidor.

export type TicketStatus = "open" | "answered" | "closed";

export interface TicketMessage {
  id: string;
  sender: "user" | "admin";
  message: string;
  createdAt: string;
}

export interface TicketSummary {
  id: string;
  subject: string;
  status: TicketStatus;
  messageCount: number;
  lastSender: "user" | "admin" | null;
  lastMessage: string;
  userEmail: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Ticket extends TicketSummary {
  messages: TicketMessage[];
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, {
      cache: "no-store",
      ...init,
      headers: init?.body ? { "Content-Type": "application/json", ...init.headers } : init?.headers,
    });
  } catch {
    throw new Error("Não foi possível conectar ao servidor.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error ?? "Falha na requisição.");
  return data as T;
}

const json = (method: string, body: unknown): RequestInit => ({ method, body: JSON.stringify(body) });

export const supportApi = {
  list: (status?: TicketStatus) =>
    request<{ tickets: TicketSummary[] }>(`/api/support/tickets${status ? `?status=${status}` : ""}`),
  get: (id: string) => request<{ ticket: Ticket }>(`/api/support/tickets/${id}`),
  create: (input: { subject: string; message: string }) =>
    request<{ ticket: Ticket }>("/api/support/tickets", json("POST", input)),
  reply: (id: string, message: string) => request<{ ticket: Ticket }>(`/api/support/tickets/${id}`, json("POST", { message })),
  close: (id: string) => request<{ ticket: Ticket }>(`/api/support/tickets/${id}`, json("PATCH", { status: "closed" })),
};

export const STATUS_LABEL: Record<TicketStatus, string> = { open: "Aberto", answered: "Respondido", closed: "Fechado" };
