import express from 'express';
import {
  getConversations,
  createConversation,
  createGroupChat,
  getConversationById,
  updateGroupChat,
  addToGroup,
  removeFromGroup,
  deleteConversation,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getConversations);
router.post('/', protect, createConversation);
router.post('/group', protect, createGroupChat);
router.get('/:id', protect, getConversationById);
router.put('/:id', protect, updateGroupChat);
router.put('/:id/add', protect, addToGroup);
router.put('/:id/remove', protect, removeFromGroup);
router.delete('/:id', protect, deleteConversation);

export default router;
