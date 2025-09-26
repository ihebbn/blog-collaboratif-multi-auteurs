import { Router } from 'express';
import {
  getArticleComments,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
  getMyComments
} from '../controllers/commentController';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { sanitizeInput } from '../middleware/security';

const router = Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Public routes
router.get('/article/:articleId', optionalAuth, getArticleComments); // Get comments for an article

// Protected routes
router.use(authenticateToken); // All routes below require authentication

// Comment management
router.post('/article/:articleId', createComment); // Create comment
router.put('/:commentId', updateComment); // Update comment (author or admin)
router.delete('/:commentId', deleteComment); // Delete comment (author or admin)

// Interactions
router.post('/:commentId/like', toggleCommentLike); // Like/unlike comment

// User's comments
router.get('/my/comments', getMyComments); // Get user's own comments

export default router;
