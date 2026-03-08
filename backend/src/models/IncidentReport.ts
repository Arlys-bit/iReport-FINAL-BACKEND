import mongoose, { Schema, Document } from 'mongoose';

export type IncidentType =
  | 'Physical Bullying'
  | 'Verbal Threats'
  | 'Group Bullying'
  | 'fighting'
  | 'Trapping'
  | 'Sexual Harassment'
  | 'other';

export type ReportStatus = 'under_review' | 'accepted' | 'declined';
export type ReportPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IIncidentReport extends Document {
  _id: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reporterRole: 'student' | 'teacher' | 'staff';
  reporterName: string;
  reporterGradeLevel?: string;
  reporterSection?: string;
  isAnonymous: boolean;
  victimName?: string;
  victimGradeLevel?: string;
  victimSection?: string;
  location: string;
  buildingName?: string;
  floor?: string;
  room?: string;
  incidentType: IncidentType;
  incidentDate: Date;
  incidentTime?: string;
  description: string;
  photoEvidence?: string;
  status: ReportStatus;
  priority: ReportPriority;
  reviewHistory: Array<{
    reviewedBy: mongoose.Types.ObjectId;
    reviewedByName: string;
    status: ReportStatus;
    notes: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const IncidentReportSchema: Schema = new Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterRole: {
      type: String,
      enum: ['student', 'teacher', 'staff'],
      required: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    reporterGradeLevel: String,
    reporterSection: String,
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    victimName: String,
    victimGradeLevel: String,
    victimSection: String,
    location: {
      type: String,
      required: true,
    },
    buildingName: String,
    floor: String,
    room: String,
    incidentType: {
      type: String,
      enum: [
        'Physical Bullying',
        'Verbal Threats',
        'Group Bullying',
        'fighting',
        'Trapping',
        'Sexual Harassment',
        'other',
      ],
      required: true,
    },
    incidentDate: {
      type: Date,
      required: true,
    },
    incidentTime: String,
    description: {
      type: String,
      required: true,
    },
    photoEvidence: String,
    status: {
      type: String,
      enum: ['under_review', 'accepted', 'declined'],
      default: 'under_review',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    reviewHistory: [
      {
        reviewedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'StaffMember',
        },
        reviewedByName: String,
        status: String,
        notes: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { timestamps: true }
);

export const IncidentReport = mongoose.model<IIncidentReport>(
  'IncidentReport',
  IncidentReportSchema
);
