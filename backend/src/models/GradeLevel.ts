import mongoose, { Schema, Document } from 'mongoose';

export interface IGradeLevel extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  order: number;
  isActive: boolean;
}

const GradeLevelSchema: Schema = new Schema(
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
    order: {
      type: Number,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const GradeLevel = mongoose.model<IGradeLevel>('GradeLevel', GradeLevelSchema);
