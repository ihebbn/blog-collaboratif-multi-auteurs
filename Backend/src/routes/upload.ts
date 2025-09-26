import { Router, Request, Response } from 'express';
import { authenticateToken, requireAuthor } from '../middleware/auth';
import { uploadSingle, handleUploadError } from '../middleware/upload';
import path from 'path';

const router = Router();

// Apply authentication to all upload routes
router.use(authenticateToken);
router.use(requireAuthor);

// Upload single image
router.post('/image', uploadSingle, handleUploadError, (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    // Return the file path relative to the public directory
    const filePath = `/uploads/${req.file.filename}`;
    
    res.json({
      message: 'Image uploaded successfully',
      imageUrl: filePath,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Internal server error during upload' });
  }
});

// Get uploaded image
router.get('/image/:filename', (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(process.cwd(), 'uploads', filename);
    
    res.sendFile(imagePath, (err) => {
      if (err) {
        res.status(404).json({ message: 'Image not found' });
      }
    });
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
