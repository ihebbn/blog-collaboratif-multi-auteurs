import { Request, Response } from 'express';
import { Article } from '../models';
import { User } from '../models';

// Get all articles with pagination, filtering, and search
export const getArticles = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = 'published',
      author,
      tags,
      search,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = {};

    // Status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Author filter
    if (author) {
      query.author = author;
    }

    // Tags filter
    if (tags) {
      const tagArray = (tags as string).split(',').map(tag => tag.trim().toLowerCase());
      query.tags = { $in: tagArray };
    }

    // Search filter
    if (search) {
      query.$text = { $search: search as string };
    }

    // Sort options
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const articles = await Article.find(query)
      .populate('author', 'firstName lastName email')
      .select('-content') // Exclude full content for list view
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Article.countDocuments(query);

    res.json({
      articles,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalArticles: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get articles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get single article by ID
export const getArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id)
      .populate('author', 'firstName lastName email')
      .lean();

    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Increment view count
    await Article.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });

    res.json({ article });

  } catch (error) {
    console.error('Get article error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Create new article
export const createArticle = async (req: Request, res: Response) => {
  try {
    const { title, content, excerpt, tags, imageUrl, status = 'draft' } = req.body;
    const authorId = req.user!.userId;

    // Validation
    if (!title || !content) {
      return res.status(400).json({
        message: 'Title and content are required'
      });
    }

    // Create article
    const article = new Article({
      title: title.trim(),
      content: content.trim(),
      excerpt: excerpt?.trim() || content.trim().substring(0, 200) + '...',
      author: authorId,
      tags: tags ? tags.map((tag: string) => tag.trim().toLowerCase()) : [],
      imageUrl: imageUrl?.trim(),
      status: status as 'draft' | 'published' | 'archived'
    });

    await article.save();

    // Populate author info
    await article.populate('author', 'firstName lastName email');

    res.status(201).json({
      message: 'Article created successfully',
      article
    });

  } catch (error) {
    console.error('Create article error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update article
export const updateArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, tags, imageUrl, status } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Find article
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check permissions
    const isOwner = article.author.toString() === userId;
    const canEdit = isOwner || userRole === 'Admin' || userRole === 'Editor';

    if (!canEdit) {
      return res.status(403).json({
        message: 'You can only edit your own articles'
      });
    }

    // Update fields
    if (title) article.title = title.trim();
    if (content) {
      article.content = content.trim();
      // Update excerpt if not provided
      if (!excerpt) {
        article.excerpt = content.trim().substring(0, 200) + '...';
      }
    }
    if (excerpt) article.excerpt = excerpt.trim();
    if (tags) article.tags = tags.map((tag: string) => tag.trim().toLowerCase());
    if (imageUrl !== undefined) article.imageUrl = imageUrl?.trim();
    if (status) article.status = status as 'draft' | 'published' | 'archived';

    await article.save();

    // Populate author info
    await article.populate('author', 'firstName lastName email');

    res.json({
      message: 'Article updated successfully',
      article
    });

  } catch (error) {
    console.error('Update article error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete article
export const deleteArticle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    // Find article
    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // Check permissions - only Admin can delete
    if (userRole !== 'Admin') {
      return res.status(403).json({
        message: 'Only administrators can delete articles'
      });
    }

    await Article.findByIdAndDelete(id);

    res.json({ message: 'Article deleted successfully' });

  } catch (error) {
    console.error('Delete article error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user's own articles
export const getMyArticles = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { author: userId };
    if (status && status !== 'all') {
      query.status = status;
    }

    // Sort options
    const sortOptions: any = {};
    sortOptions[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const articles = await Article.find(query)
      .populate('author', 'firstName lastName email')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const total = await Article.countDocuments(query);

    res.json({
      articles,
      pagination: {
        currentPage: pageNum,
        totalPages: Math.ceil(total / limitNum),
        totalArticles: total,
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get my articles error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Like/Unlike article
export const toggleLike = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const article = await Article.findById(id);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }

    // For now, we'll just increment/decrement like count
    // In a real app, you'd track individual user likes
    const action = req.body.action; // 'like' or 'unlike'
    
    if (action === 'like') {
      await Article.findByIdAndUpdate(id, { $inc: { likeCount: 1 } });
    } else if (action === 'unlike') {
      await Article.findByIdAndUpdate(id, { $inc: { likeCount: -1 } });
    }

    res.json({ message: `Article ${action}d successfully` });

  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
