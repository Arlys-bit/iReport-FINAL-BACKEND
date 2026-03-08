import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  role: 'admin' | 'teacher' | 'student';
  fullName: string;
  email: string;
  password: string;
  schoolEmail: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    role: {
      type: String,
      enum: ['admin', 'teacher', 'student'],
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    schoolEmail: {
      type: String,
      unique: true,
      sparse: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, discriminatorKey: 'role' }
);

export const User = mongoose.model<IUser>('User', UserSchema);
