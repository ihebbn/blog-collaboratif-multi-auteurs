import { Request, Response } from 'express';
import { Comment } from '../models';
import { Article } from '../models';
import { User } from '../models';

// Get comments for an article (with nested replies)
export const getArticleComments = async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Get top-level comments (no parent)
    const topLevelComments = await Comment.find({
      article: articleId,
      parentComment: null,
      isApproved: true
    })
    .populate('author', 'firstName lastName email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .lean();

    // Get replies for each top-level comment
    const commentsWithReplies = await Promise.all(
      topLevelComments.map(async (comment) => {
        const replies = await Comment.find({
          parentComment: comment._id,
          isApproved: true
        })
        .populate('author', 'firstName lastName email')
        .sort({ createdAt: 1 })
        .lean();

        return {
          ...comment,
          replies
        };
      })
    );

    const total = await Comment.countDocuments({
      article: articleId,
      parentComment: null,
      isApproved: true
    });

    res.json({
      comments: commentsWithReplies,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalComments: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get article comments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create a new comment
export const createComment = async (req: Request, res: Response) => {
  try {
    const { articleId } = req.params;
    const { content, parentCommentId } = req.body;
    const authorId = req.user!.userId;

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        message: 'Comment content is required'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        message: 'Comment content must be less than 1000 characters'
      });
    }

    // Verify article exists
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // If replying to a comment, verify parent exists
    let parentComment = null;
    if (parentCommentId) {
      parentComment = await Comment.findById(parentCommentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
      if (parentComment.article.toString() !== articleId) {
        return res.status(400).json({ message: 'Parent comment does not belong to this article' });
      }
    }

    // Create comment
    const comment = new Comment({
      content: content.trim(),
      author: authorId,
      article: articleId,
      parentComment: parentCommentId || null,
      isApproved: true // Auto-approve for now, can be changed based on user role
    });

    await comment.save();

    // Populate author info
    await comment.populate('author', 'firstName lastName email');

    // Emit real-time notification
    const io = (global as any).io;
    if (io) {
      io.to(`article-${articleId}`).emit('new-comment', {
        comment,
        articleId,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      message: 'Comment created successfully',
      comment
    });

  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update a comment (only by author or admin)
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check permissions
    const isAuthor = comment.author.toString() === userId;
    const isAdmin = userRole === 'Admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        message: 'You can only edit your own comments'
      });
    }

    // Validation
    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        message: 'Comment content is required'
      });
    }

    if (content.length > 1000) {
      return res.status(400).json({
        message: 'Comment content must be less than 1000 characters'
      });
    }

    // Update comment
    comment.content = content.trim();
    await comment.save();

    // Populate author info
    await comment.populate('author', 'firstName lastName email');

    // Emit real-time notification
    const io = (global as any).io;
    if (io) {
      io.to(`article-${comment.article}`).emit('comment-updated', {
        comment,
        articleId: comment.article,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      message: 'Comment updated successfully',
      comment
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a comment (only by author or admin)
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Find comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check permissions
    const isAuthor = comment.author.toString() === userId;
    const isAdmin = userRole === 'Admin';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({
        message: 'You can only delete your own comments'
      });
    }

    // Store article ID before deletion
    const articleId = comment.article.toString();

    // Delete comment (this will also delete all replies due to pre-remove middleware)
    await Comment.findByIdAndDelete(commentId);

    // Emit real-time notification
    const io = (global as any).io;
    if (io) {
      io.to(`article-${articleId}`).emit('comment-deleted', {
        commentId,
        articleId,
        timestamp: new Date().toISOString()
      });
    }

    res.json({ message: 'Comment deleted successfully' });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Like/unlike a comment
export const toggleCommentLike = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { action } = req.body; // 'like' or 'unlike'

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    if (action === 'like') {
      await Comment.findByIdAndUpdate(commentId, { $inc: { likeCount: 1 } });
    } else if (action === 'unlike') {
      await Comment.findByIdAndUpdate(commentId, { $inc: { likeCount: -1 } });
    } else {
      return res.status(400).json({ message: 'Invalid action. Use "like" or "unlike"' });
    }

    res.json({ message: `Comment ${action}d successfully` });

  } catch (error) {
    console.error('Toggle comment like error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's comments
export const getMyComments = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page = 1, limit = 20 } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const comments = await Comment.find({ author: userId })
      .populate('author', 'firstName lastName email')
      .populate('article', 'title')
      .populate('parentComment', 'content')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Comment.countDocuments({ author: userId });

    res.json({
      comments,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalComments: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get my comments error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
