import mongoose, { Schema, type Model, type Types } from "mongoose";

export const TICKET_STATUSES = ["open", "answered", "closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export interface ITicketMessage {
  _id: Types.ObjectId;
  sender: "user" | "admin";
  message: string;
  createdAt: Date;
}

export interface ITicket {
  userId: Types.ObjectId;
  subject: string;
  status: TicketStatus;
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<ITicketMessage>({
  sender: { type: String, enum: ["user", "admin"], required: true },
  message: { type: String, required: true, trim: true, maxlength: 4000 },
  createdAt: { type: Date, default: Date.now },
});

const TicketSchema = new Schema<ITicket>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    status: { type: String, enum: TICKET_STATUSES, default: "open", required: true, index: true },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true },
);

// Ver comentário em models/User.ts: evita schema antigo em cache durante o hot reload.
if (process.env.NODE_ENV !== "production" && mongoose.models.Ticket) mongoose.deleteModel("Ticket");

export const Ticket: Model<ITicket> =
  (mongoose.models.Ticket as Model<ITicket> | undefined) ?? mongoose.model<ITicket>("Ticket", TicketSchema);
