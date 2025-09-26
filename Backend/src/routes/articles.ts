import { Router } from 'express';
import {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getMyArticles,
  toggleLike
} from '../controllers/articleController';
import { authenticateToken, optionalAuth, requireAuthor } from '../middleware/auth';
import { sanitizeInput } from '../middleware/security';

const router = Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

// Public routes
router.get('/', optionalAuth, getArticles); // List articles (public with optional auth)
router.get('/:id', optionalAuth, getArticle); // Get single article (public with optional auth)

// Protected routes
router.use(authenticateToken); // All routes below require authentication

// Article management
router.post('/', requireAuthor, createArticle); // Create article (Authors+)
router.put('/:id', updateArticle); // Update article (with ownership check in controller)
router.delete('/:id', deleteArticle); // Delete article (Admin only)

// User's own articles
router.get('/my/articles', getMyArticles); // Get user's own articles

// Interactions
router.post('/:id/like', toggleLike); // Like/unlike article

export default router;
