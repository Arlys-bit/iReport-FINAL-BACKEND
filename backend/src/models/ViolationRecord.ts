import mongoose, { Schema, Document } from 'mongoose';

export interface IViolationRecord extends Document {
  _id: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  reportId: mongoose.Types.ObjectId;
  violationType: string;
  severity: 'minor' | 'moderate' | 'severe';
  recordedBy: mongoose.Types.ObjectId;
  recordedDate: Date;
  notes: string;
}

const ViolationRecordSchema: Schema = new Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'IncidentReport',
      required: true,
    },
    violationType: {
      type: String,
      required: true,
    },
    severity: {
      type: String,
      enum: ['minor', 'moderate', 'severe'],
      default: 'moderate',
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffMember',
      required: true,
    },
    recordedDate: {
      type: Date,
      default: Date.now,
    },
    notes: String,
  },
  { timestamps: true }
);

export const ViolationRecord = mongoose.model<IViolationRecord>(
  'ViolationRecord',
  ViolationRecordSchema
);
