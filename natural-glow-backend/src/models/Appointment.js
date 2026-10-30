import mongoose from 'mongoose';
import { baseOptions } from './_options.js';
import { APPOINTMENT_STATUSES } from './constants.js';

const historySchema = new mongoose.Schema(
  {
    status: { type: String, enum: APPOINTMENT_STATUSES, required: true },
    at: { type: Date, default: Date.now },
    note: { type: String, trim: true, maxlength: 300, default: '' },
    preferredAt: { type: Date }, // the requested time that applied at this point
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },

    // Reference + immutable snapshot taken server-side at creation time.
    service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, required: true },
    servicePrice: { type: Number, required: true, min: 0 },

    preferredAt: { type: Date, required: true },
    notes: { type: String, trim: true, maxlength: 500, default: '' },

    status: { type: String, enum: APPOINTMENT_STATUSES, default: 'pending' },
    adminNotes: { type: String, trim: true, maxlength: 500, default: '' },
    statusHistory: { type: [historySchema], default: [] },

    // Unique while the request is active (pending/confirmed/rescheduled); removed otherwise.
    // Guards against duplicate submissions even under concurrent requests.
    dedupeKey: { type: String },
  },
  baseOptions
);

appointmentSchema.index({ status: 1, preferredAt: 1 });
appointmentSchema.index({ createdAt: -1 });
appointmentSchema.index({ phone: 1, status: 1 });
appointmentSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });

export const Appointment =
  mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
