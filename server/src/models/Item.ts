import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  uid?: string | null;
  source: 'user' | 'deepfashion';
  sourcePath?: string;
  name: string;
  category: string;
  tags: string[];
  description?: string;
  price?: number;
  brand?: string;
  color?: string;
  material?: string;
  seasonality?: string[];
  occasions?: string[];
  sustainabilityScore?: number;
  brandEthicsScore?: number;
  carbonScore?: number;
  imageUrl?: string;
  imageEmbedding?: number[]; // CLIP embedding vector for image search
  createdAt: Date;
  updatedAt: Date;
}

const itemSchema = new Schema<IItem>(
  {
    uid: { type: String, required: false, default: null, index: true },
    source: { type: String, enum: ['user', 'deepfashion'], default: 'user', index: true },
    sourcePath: { type: String, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    tags: { type: [String], default: [], index: true },
    description: { type: String },
    price: { type: Number },
    brand: { type: String },
    color: { type: String },
    material: { type: String },
    seasonality: { type: [String], default: [] },
    occasions: { type: [String], default: [] },
    sustainabilityScore: { type: Number, min: 0, max: 1 },
    brandEthicsScore: { type: Number, min: 0, max: 1 },
    carbonScore: { type: Number, min: 0, max: 1 },
    imageUrl: { type: String },
    imageEmbedding: { type: [Number], index: true }, // Indexed for efficient vector search
  },
  { timestamps: true }
);

export default mongoose.model<IItem>('Item', itemSchema);