import mongoose, { Schema, Document } from 'mongoose';

export interface IItem extends Document {
  uid: string;
  name: string;
  category: string;
  color?: string;
  material?: string;
  imageUrl?: string;
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
  },
  { timestamps: true }
);

export default mongoose.model<IItem>('Item', itemSchema);