import mongoose, { Schema, Document } from 'mongoose';

export interface IWardrobe extends Document {
  uid: string;
  name: string;
  items: string[];
  createdAt: Date;
  updatedAt: Date;
}

const wardrobeSchema = new Schema<IWardrobe>(
  {
    uid: { type: String, required: true },
    name: { type: String, required: true },
    items: [{ type: Schema.Types.ObjectId, ref: 'Item' }],
  },
  { timestamps: true }
);

export default mongoose.model<IWardrobe>('Wardrobe', wardrobeSchema);