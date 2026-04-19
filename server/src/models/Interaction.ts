import mongoose, { Schema, Document, Types } from 'mongoose';

export type InteractionEvent = 'view' | 'like' | 'add_to_cart' | 'purchase';

export interface IInteractionContext {
  season?: string;
  timeOfDay?: string;
  weather?: string;
  occasion?: string;
  dwellTimeMs?: number;
}

export interface IInteraction extends Document {
  uid: string;
  itemId: Types.ObjectId;
  event: InteractionEvent;
  context?: IInteractionContext;
  createdAt: Date;
  updatedAt: Date;
}

const interactionContextSchema = new Schema<IInteractionContext>(
  {
    season: { type: String },
    timeOfDay: { type: String },
    weather: { type: String },
    occasion: { type: String },
    dwellTimeMs: { type: Number },
  },
  { _id: false }
);

const interactionSchema = new Schema<IInteraction>(
  {
    uid: { type: String, required: true, index: true },
    itemId: { type: Schema.Types.ObjectId, ref: 'Item', required: true, index: true },
    event: {
      type: String,
      enum: ['view', 'like', 'add_to_cart', 'purchase'],
      required: true,
      index: true,
    },
    context: { type: interactionContextSchema, default: {} },
  },
  { timestamps: true }
);

interactionSchema.index({ uid: 1, createdAt: -1 });
interactionSchema.index({ uid: 1, itemId: 1, createdAt: -1 });

export default mongoose.model<IInteraction>('Interaction', interactionSchema);