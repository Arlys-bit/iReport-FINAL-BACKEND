import mongoose, { Schema, Document } from 'mongoose';

export interface IBuilding extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  floors: number;
  color: string;
  isActive: boolean;
}

const BuildingSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    floors: {
      type: Number,
      required: true,
      min: 1,
    },
    color: {
      type: String,
      default: '#3B82F6',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Building = mongoose.model<IBuilding>('Building', BuildingSchema);
