// Session.js - This file would typically be located in the 'server/src/models' directory

import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    metadata: {
      userAgent: {
        type: String,
      },
      ipAddress: {
        type: String,
      },
      location: {
        type: {
          type: String,
          enum: ['Point'],
          required: true,
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true,
        },
      },
      deviceInfo: {
        type: String,
      },
    },
    exercises: [
      {
        exerciseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Exercise', // Assuming you have an Exercise model
          required: true,
        },
        startTime: {
          type: Date,
          default: Date.now,
        },
        endTime: {
          type: Date,
        },
        userInput: {
          type: String, // Could be text, audio data URL, etc.
        },
        analysisData: {
          // This could be a nested schema with detailed analysis data
          fluencyScore: {
            type: Number,
            min: 0,
            max: 1,
          },
          speakingRate: {
            type: Number,
          },
          pauseDuration: {
            type: Number,
          },
          articulationRate: {
            type: Number,
          },
          voiceQuality: {
            type: String,
            enum: ['normal', 'breathy', 'strained', ' hoarse'],
          },
          // ... other analysis data
        },
        feedback: {
          type: String, // AI-generated feedback
        },
      },
    ],
    summary: {
      overallFluencyScore: {
        type: Number,
        min: 0,
        max: 1,
      },
      strengths: {
        type: [String],
      },
      weaknesses: {
        type: [String],
      },
      recommendations: {
        type: [String],
      },
    },
    notes: {
      type: String, // Notes from the therapist or user
    },
  },
  {
    timestamps: true,
  }
);

// Middleware to populate user data before returning the session
sessionSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'userId',
    select: 'firstName lastName email', // Select specific fields from the User model
  });
  next();
});

// Middleware to populate exercise data before returning the session
sessionSchema.pre(/^find/, function (next) {
  this.populate({
    path: 'exercises.exerciseId',
    select: 'name description instructions', // Select specific fields from the Exercise model
  });
  next();
});

// Method to calculate the overall fluency score for the session
sessionSchema.methods.calculateOverallFluency = function () {
  if (this.exercises.length === 0) {
    return 0;
  }

  const totalFluencyScore = this.exercises.reduce(
    (sum, exercise) => sum + (exercise.analysisData.fluencyScore || 0),
    0
  );
  return totalFluencyScore / this.exercises.length;
};

// Create the Session model
const Session = mongoose.model('Session', sessionSchema);

export default Session;