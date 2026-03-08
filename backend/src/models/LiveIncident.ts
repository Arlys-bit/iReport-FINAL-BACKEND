import mongoose, { Schema, Document } from 'mongoose';

export interface ILiveIncident extends Document {
  _id: mongoose.Types.ObjectId;
  reporterId: mongoose.Types.ObjectId;
  reporterName: string;
  reporterGradeLevelId: string;
  reporterSectionId: string;
  buildingId: string;
  buildingName: string;
  floor: string;
  room: string;
  incidentType: string;
  description: string;
  status: 'active' | 'responding' | 'resolved';
  responders: Array<{
    userId: mongoose.Types.ObjectId;
    userName: string;
    respondedAt: Date;
  }>;
  resolvedBy?: mongoose.Types.ObjectId;
  resolvedByName?: string;
  resolvedAt?: Date;
  createdAt: Date;
}

const LiveIncidentSchema: Schema = new Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterName: {
      type: String,
      required: true,
    },
    reporterGradeLevelId: {
      type: String,
      required: true,
    },
    reporterSectionId: {
      type: String,
      required: true,
    },
    buildingId: {
      type: String,
      required: true,
    },
    buildingName: {
      type: String,
      required: true,
    },
    floor: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      required: true,
    },
    incidentType: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'responding', 'resolved'],
      default: 'active',
    },
    responders: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'StaffMember',
        },
        userName: String,
        respondedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StaffMember',
    },
    resolvedByName: String,
    resolvedAt: Date,
  },
  { timestamps: true }
);

export const LiveIncident = mongoose.model<ILiveIncident>('LiveIncident', LiveIncidentSchema);
