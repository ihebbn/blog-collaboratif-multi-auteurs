import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  content: string;
  excerpt?: string;
  author: Types.ObjectId;
  tags: string[];
  imageUrl?: string;
  status: 'draft' | 'published' | 'archived';
  publishedAt?: Date;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema = new Schema<IArticle>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
    index: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: {
    type: String,
    maxlength: 500
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  imageUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  publishedAt: {
    type: Date,
    index: true
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  },
  shareCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
ArticleSchema.index({ status: 1, publishedAt: -1 });
ArticleSchema.index({ author: 1, status: 1 });
ArticleSchema.index({ tags: 1, status: 1 });
ArticleSchema.index({ publishedAt: -1, status: 1 });
ArticleSchema.index({ viewCount: -1, status: 1 });
ArticleSchema.index({ likeCount: -1, status: 1 });

// Text search index
ArticleSchema.index({
  title: 'text',
  content: 'text',
  excerpt: 'text',
  tags: 'text'
});

// Pre-save middleware to set publishedAt when status changes to published
ArticleSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Virtual for reading time estimation (assuming 200 words per minute)
ArticleSchema.virtual('readingTime').get(function() {
  const wordCount = this.content.split(/\s+/).length;
  return Math.ceil(wordCount / 200);
});

// Ensure virtual fields are serialized
ArticleSchema.set('toJSON', {
  virtuals: true
});

export const Article = mongoose.model<IArticle>('Article', ArticleSchema);
