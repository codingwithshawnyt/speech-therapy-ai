// User.js - This file would typically be located in the 'server/src/models' directory

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import jwt from 'jsonwebtoken';

// JWT Secret Key (should be stored securely in environment variables)
const JWT_SECRET = process.env.JWT_SECRET;

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email format');
        }
      },
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      validate(value) {
        if (value.toLowerCase().includes('password')) {
          throw new Error('Password cannot contain "password"');
        }
      },
    },
    profilePicture: {
      type: String,
    },
    googleId: {
      type: String,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    settings: {
      theme: {
        type: String,
        enum: ['light', 'dark'],
        default: 'light',
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        push: {
          type: Boolean,
          default: true,
        },
      },
      // Add more settings as needed
    },
    tokens: [
      {
        token: {
          type: String,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Virtual property for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Method to generate JWT token
userSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, JWT_SECRET);
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};

// Method to hash the plain text password before saving
userSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

// Method to compare password with hashed password
userSchema.methods.comparePassword = async function (candidatePassword) {
  const user = this;
  return await bcrypt.compare(candidatePassword, user.password);
};

// Static method to find user by email and password
userSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Invalid credentials');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
  return user;
};

// Create the User model
const User = mongoose.model('User', userSchema);

export default User;