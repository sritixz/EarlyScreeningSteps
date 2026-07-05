import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema } = mongoose;

const consentSchema = new Schema(
  {
    accepted: { type: Boolean, default: false },
    acceptedAt: { type: Date, default: null },
    version: { type: String, default: null },
  },
  { _id: false }
);

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['parent', 'reviewer', 'admin'],
      required: true,
      default: 'parent',
    },
    jurisdiction: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    consent: {
      type: consentSchema,
      default: () => ({}),
    },

    // Reviewer-specific fields
    licenseNumber: {
      type: String,
      trim: true,
      default: null,
    },
    specialty: {
      type: String,
      trim: true,
      default: null,
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
    applicationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: undefined, // only meaningful for reviewers
    },
    appliedAt: {
      type: Date,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.index({ role: 1, applicationStatus: 1, isAvailable: 1 });

// Set reviewer-only defaults when role is reviewer
userSchema.pre('validate', function setReviewerDefaults(next) {
  if (this.role === 'reviewer') {
    if (!this.applicationStatus) this.applicationStatus = 'pending';
    if (!this.appliedAt) this.appliedAt = new Date();
  } else {
    // Non-reviewers shouldn't carry reviewer application state
    this.applicationStatus = undefined;
  }
  next();
});

userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function matchPassword(enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Reviewer is usable for assignment only if approved, available, and active
userSchema.methods.isAssignable = function isAssignable() {
  return (
    this.role === 'reviewer' &&
    this.applicationStatus === 'approved' &&
    this.isAvailable === true &&
    this.isActive === true
  );
};

userSchema.methods.toSafeObject = function toSafeObject() {
  const obj = this.toObject({ virtuals: false });
  delete obj.password;
  return obj;
};

const User = mongoose.model('User', userSchema);

export default User;
