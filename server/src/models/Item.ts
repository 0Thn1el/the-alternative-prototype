import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  uid: string;
  name: string;
  category: string;
  color?: string;
  material?: string;
  imageUrl?: string;
  imageEmbedding?: number[]; // CLIP embedding vector for image search
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    uid: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    color: { type: String },
    material: { type: String },
    imageUrl: { type: String },
    imageEmbedding: { type: [Number], index: true }, // Indexed for efficient vector search
  },
  { timestamps: true }
);

export default mongoose.model<IItem>('Item', itemSchema);