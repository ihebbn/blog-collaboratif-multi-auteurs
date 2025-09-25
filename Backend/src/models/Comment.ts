import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IComment extends Document {
  content: string;
  author: Types.ObjectId;
  article: Types.ObjectId;
  parentComment?: Types.ObjectId;
  replies: Types.ObjectId[];
  isApproved: boolean;
  likeCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  article: {
    type: Schema.Types.ObjectId,
    ref: 'Article',
    required: true,
    index: true
  },
  parentComment: {
    type: Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
    index: true
  },
  replies: [{
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  }],
  isApproved: {
    type: Boolean,
    default: true,
    index: true
  },
  likeCount: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true
});

// Compound indexes for common queries
CommentSchema.index({ article: 1, isApproved: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1, isApproved: 1, createdAt: 1 });
CommentSchema.index({ author: 1, isApproved: 1 });
CommentSchema.index({ article: 1, parentComment: 1, isApproved: 1 });

// Pre-save middleware to update parent comment's replies array
CommentSchema.pre('save', async function(next) {
  if (this.isNew && this.parentComment) {
    try {
      await mongoose.model('Comment').findByIdAndUpdate(
        this.parentComment,
        { $addToSet: { replies: this._id } }
      );
    } catch (error) {
      return next(error as Error);
    }
  }
  next();
});

// Pre-remove middleware to clean up replies when deleting a comment
CommentSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
  try {
    // Remove this comment from parent's replies array
    if (this.parentComment) {
      await mongoose.model('Comment').findByIdAndUpdate(
        this.parentComment,
        { $pull: { replies: this._id } }
      );
    }
    
    // Delete all replies to this comment
    await mongoose.model('Comment').deleteMany({ parentComment: this._id });
  } catch (error) {
    return next(error as Error);
  }
  next();
});

export const Comment = mongoose.model<IComment>('Comment', CommentSchema);
