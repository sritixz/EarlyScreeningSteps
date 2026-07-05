import mongoose from 'mongoose';

const { Schema } = mongoose;

const videoMetadataSchema = new Schema(
  {
    filename: { type: String, default: null },
    originalName: { type: String, default: null },
    path: { type: String, default: null },
    mimeType: { type: String, default: null },
    sizeBytes: { type: Number, default: null },
    uploadedAt: { type: Date, default: null },
  },
  { _id: false }
);

const reviewSchema = new Schema(
  {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: null,
    },
    observations: {
      type: [String],
      default: [],
    },
    recommendedNextSteps: {
      type: String,
      default: null,
    },
    notes: {
      type: String,
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

const screeningSchema = new Schema(
  {
    childId: {
      type: Schema.Types.ObjectId,
      ref: 'Child',
      required: true,
      index: true,
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignedReviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ['submitted', 'assigned', 'in_review', 'completed'],
      default: 'submitted',
      index: true,
    },
    jurisdiction: {
      type: String,
      required: true,
      trim: true,
    },

    questionnaireAnswers: {
      type: Map,
      of: Schema.Types.Mixed,
      default: () => new Map(),
    },
    totalScore: {
      type: Number,
      default: 0,
    },

    intake: {
      type: String,
      trim: true,
      default: '',
    },

    videoMetadata: {
      type: videoMetadataSchema,
      default: () => ({}),
    },

    review: {
      type: reviewSchema,
      default: () => ({}),
    },

    // Urgency
    isUrgent: {
      type: Boolean,
      default: false,
      index: true,
    },
    urgentFlaggedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    urgentFlaggedAt: {
      type: Date,
      default: null,
    },
    urgentReason: {
      type: String,
      default: null,
    },
    urgentAcknowledgedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    urgentAcknowledgedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

screeningSchema.index({ assignedReviewerId: 1, status: 1 });
screeningSchema.index({ isUrgent: 1, status: 1 });

const Screening = mongoose.model('Screening', screeningSchema);

export default Screening;
