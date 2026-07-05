import mongoose from 'mongoose';

const { Schema } = mongoose;

const childSchema = new Schema(
  {
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, "Child's name is required"],
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: [true, 'Date of birth is required'],
      validate: {
        validator: (value) => value instanceof Date && value.getTime() <= Date.now(),
        message: 'Date of birth cannot be in the future',
      },
    },
  },
  { timestamps: true }
);

childSchema.virtual('ageInMonths').get(function ageInMonths() {
  if (!this.dateOfBirth) return null;
  const now = new Date();
  const dob = new Date(this.dateOfBirth);
  let months = (now.getFullYear() - dob.getFullYear()) * 12;
  months += now.getMonth() - dob.getMonth();
  if (now.getDate() < dob.getDate()) months -= 1;
  return months;
});

childSchema.set('toJSON', { virtuals: true });
childSchema.set('toObject', { virtuals: true });

const Child = mongoose.model('Child', childSchema);

export default Child;
