import mongoose, { Schema, Document } from 'mongoose';

export interface IIntroductionContent extends Document {
  mainDescription: string;
  philosophy: {
    text: string;
    image: {
      url: string;
      alt: string;
    };
  };
  approach: {
    text: string;
    image: {
      url: string;
      alt: string;
    };
  };
  cta: {
    headline: string;
    description: string;
    buttonText: string;
    buttonLink: string;
  };
  lastUpdated?: Date;
  updatedBy?: string;
}

const introductionContentSchema = new Schema<IIntroductionContent>({
  mainDescription: {
    type: String,
    required: true,
    trim: true
  },
  philosophy: {
    text: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      url: {
        type: String,
        required: true,
        trim: true
      },
      alt: {
        type: String,
        required: true,
        trim: true,
        default: 'Philosophy'
      }
    }
  },
  approach: {
    text: {
      type: String,
      required: true,
      trim: true
    },
    image: {
      url: {
        type: String,
        required: true,
        trim: true
      },
      alt: {
        type: String,
        required: true,
        trim: true,
        default: 'Our Approach'
      }
    }
  },
  cta: {
    headline: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: true,
      trim: true
    },
    buttonText: {
      type: String,
      required: true,
      trim: true
    },
    buttonLink: {
      type: String,
      required: true,
      trim: true
    }
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

// Create and export the model
export default mongoose.models.IntroductionContent || 
  mongoose.model<IIntroductionContent>('IntroductionContent', introductionContentSchema);
