import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  uid?: string | null;
  source: 'user' | 'deepfashion';
  name: string;
  category: string;
  tags: string[];
  price?: number;
  brand?: string;
  color?: string;
  material?: string;
  imageUrl?: string;
  imageEmbedding?: number[]; // CLIP embedding vector for image search
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    uid: { type: String, required: false, default: null, index: true },
    source: { type: String, enum: ['user', 'deepfashion'], default: 'user', index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [], index: true },
    price: { type: Number },
    brand: { type: String },
    color: { type: String },
    material: { type: String },
    imageUrl: { type: String },
    imageEmbedding: { type: [Number], index: true }, // Indexed for efficient vector search
  },
  { timestamps: true }
);

export default mongoose.model<IItem>('Item', itemSchema);