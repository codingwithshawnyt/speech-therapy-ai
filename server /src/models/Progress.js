// Progress.js - This file would typically be located in the 'server/src/models' directory

import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    overallFluencyScore: {
      type: Number,
      min: 0,
      max: 1,
      required: true,
    },
    detailedScores: {
      // This could be a nested schema with detailed scores for different aspects of speech
      syllableLevelFluency: {
        type: Number,
        min: 0,
        max: 1,
      },
      wordLevelFluency: {
        type: Number,
        min: 0,
        max: 1,
      },
      sentenceLevelFluency: {
        type: Number,
        min: 0,
        max: 1,
      },
      // ... other detailed fluency scores
    },
    speakingRate: {
      type: Number,
      required: true,
    },
    articulationRate: {
      type: Number,
      required: true,
    },
    pauseAnalysis: {
      totalPauseDuration: {
        type: Number,
        required: true,
      },
      averagePauseDuration: {
        type: Number,
        required: true,
      },
      pauseFrequency: {
        type: Number,
        required: true,
      },
      // ... other pause analysis data
    },
    voiceQuality: {
      // This could be a nested schema with detailed voice quality metrics
      jitter: {
        type: Number,
      },
      shimmer: {
        type: Number,
      },
      harmonicsToNoiseRatio: {
        type: Number,
      },
      // ... other voice quality metrics
    },
    prosodyAnalysis: {
      // This could be a nested schema with detailed prosody analysis data
      pitchVariation: {
        type: Number,
      },
      loudnessVariation: {
        type: Number,
      },
      speechRateVariation: {
        type: Number,
      },
      // ... other prosody analysis data
    },
    linguisticAnalysis: {
      // This could be a nested schema with detailed linguistic analysis data
      vocabularySize: {
        type: Number,
      },
      grammaticalComplexity: {
        type: Number,
      },
      semanticCoherence: {
        type: Number,
      },
      // ... other linguistic analysis data
    },
    disfluencyEvents: {
      // This could be a nested schema with detailed disfluency event data
      totalDisfluencies: {
        type: Number,
        required: true,
      },
      disfluencyTypes: {
        // This could be a map or an array of objects with disfluency type and count
        repetitions: {
          type: Number,
        },
        prolongations: {
          type: Number,
        },
        blocks: {
          type: Number,
        },
        interjections: {
          type: Number,
        },
        revisions: {
          type: Number,
        },
        // ... other disfluency types
      },
      // ... other disfluency event data
    },
  },
  {
    timestamps: true,
  }
);

// Virtual property to get progress history for a specific user
progressSchema.virtual('history', {
  ref: 'Progress', // Self-referencing to create a history
  localField: '_id',
  foreignField: 'userId',
  options: { sort: { date: -1 } }, // Sort by date in descending order
});

// Method to generate a progress report
progressSchema.methods.generateReport = function () {
  // Generate a comprehensive report based on the progress data
  // This could include charts, tables, and textual summaries
  // ... Implementation for generating report ...
};

// Create the Progress model
const Progress = mongoose.model('Progress', progressSchema);

export default Progress;