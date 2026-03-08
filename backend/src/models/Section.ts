import mongoose, { Schema, Document } from 'mongoose';

export interface ISection extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  gradeLevelId: mongoose.Types.ObjectId;
  adviser?: mongoose.Types.ObjectId;
  capacity: number;
  currentCount: number;
  isActive: boolean;
}

const SectionSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    gradeLevelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GradeLevel',
      required: true,
    },
    adviser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffMember',
    },
    capacity: {
      type: Number,
      default: 50,
    },
    currentCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Section = mongoose.model<ISection>('Section', SectionSchema);
