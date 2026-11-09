
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
    },
    // ALN-8 new field
    role: {
      type: String,
      enum: ['member', 'admin'],
      default: 'member',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    studentId: {
      type: String,
    },
    institution: {
      type: String,
    },
        institution: {
      type: String,
    },
    // ALN-9: graduation details and privacy consent collected at registration
    degree: {
      type: String,
    },
    graduationYear: {
      type: Number,
    },
    verificationLink: {
      type: String,
    },
    consentAt: {
      type: Date,
    },
  },
    

  
  {
    timestamps: true,
  }
);

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);
