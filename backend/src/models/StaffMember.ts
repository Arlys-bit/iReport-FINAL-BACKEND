import mongoose, { Schema, Document } from 'mongoose';

export type StaffPermission =
  | 'edit_students'
  | 'assign_grades_sections'
  | 'promote_transfer_students'
  | 'edit_staff_profiles'
  | 'manage_reports'
  | 'access_sensitive_data'
  | 'manage_permissions'
  | 'view_all_reports'
  | 'create_grades_sections'
  | 'remove_students'
  | 'manage_buildings';

export interface IStaffMember extends Document {
  _id: mongoose.Types.ObjectId;
  staffId: string;
  position: string;
  department?: string;
  permissions: StaffPermission[];
  fullName: string;
  email: string;
  password: string;
  schoolEmail: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StaffMemberSchema: Schema = new Schema(
  {
    staffId: {
      type: String,
      unique: true,
      required: true,
    },
    position: {
      type: String,
      required: true,
    },
    department: {
      type: String,
    },
    permissions: [
      {
        type: String,
        enum: [
          'edit_students',
          'assign_grades_sections',
          'promote_transfer_students',
          'edit_staff_profiles',
          'manage_reports',
          'access_sensitive_data',
          'manage_permissions',
          'view_all_reports',
          'create_grades_sections',
          'remove_students',
          'manage_buildings',
        ],
      },
    ],
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
  { timestamps: true }
);

export const StaffMember = mongoose.model<IStaffMember>('StaffMember', StaffMemberSchema);
