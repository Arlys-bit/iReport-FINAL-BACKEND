import mongoose, { Schema } from 'mongoose';
import { User, IUser } from './User';

export interface IStudent extends IUser {
  gradeLevel: string;
  section: string;
  studentId: string;
  dateOfBirth: Date;
  parentName?: string;
  parentContact?: string;
  violations: mongoose.Types.ObjectId[];
}

const StudentSchema: Schema = new Schema(
  {
    gradeLevel: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      required: true,
    },
    studentId: {
      type: String,
      unique: true,
      required: true,
    },
    dateOfBirth: {
      type: Date,
    },
    parentName: {
      type: String,
    },
    parentContact: {
      type: String,
    },
    violations: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'ViolationRecord',
      },
    ],
  },
  { _id: false }
);

export const Student = User.discriminator<IStudent>('Student', StudentSchema, 'student');
