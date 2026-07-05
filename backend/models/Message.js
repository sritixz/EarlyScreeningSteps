import mongoose from 'mongoose';

const { Schema } = mongoose;

const messageSchema = new Schema(
  {
    screeningId: {
      type: Schema.Types.ObjectId,
      ref: 'Screening',
      required: true,
      index: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['parent', 'reviewer', 'admin'],
      required: true,
    },
    body: {
      type: String,
      required: [true, 'Message body cannot be empty'],
      trim: true,
      maxlength: 5000,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'createdAt', updatedAt: false },
  }
);

messageSchema.index({ screeningId: 1, createdAt: 1 });

const Message = mongoose.model('Message', messageSchema);

export default Message;
