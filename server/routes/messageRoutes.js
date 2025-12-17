import express from 'express';
import {
  getMessages,
  sendMessage,
  uploadFile,
  markAsRead,
  markAsDelivered,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.get('/:conversationId', protect, getMessages);
router.post('/', protect, sendMessage);
router.post('/upload', protect, upload.single('file'), uploadFile);
router.put('/:id/read', protect, markAsRead);
router.put('/:id/delivered', protect, markAsDelivered);

export default router;
