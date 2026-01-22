import mongoose, { Document, Schema } from 'mongoose';

interface IFilm extends Document {
  title: string;
  description: string;
  youtubeId: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
}

const FilmSchema = new Schema<IFilm>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    youtubeId: {
      type: String,
      required: true,
      trim: true,
    },
    thumbnail: {
      type: String,
      default: function() {
        // Use a regular function to maintain 'this' context
        const doc = this as any;
        if (doc.youtubeId) {
          return `https://img.youtube.com/vi/${doc.youtubeId}/hqdefault.jpg`;
        }
        return '';
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index for better query performance
FilmSchema.index({ youtubeId: 1 });

// Create the model if it doesn't exist
const Film = mongoose.models.Film || mongoose.model<IFilm>('Film', FilmSchema);

export default Film;
