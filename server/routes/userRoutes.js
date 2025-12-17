import express from 'express';
import { 
  getUsers, 
  getUserById, 
  updateUserProfile, 
  uploadAvatar,
  searchUserByIdOrEmail,
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getFriendRequests
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Friend request routes
router.get('/search', protect, searchUserByIdOrEmail);
router.get('/friend-requests', protect, getFriendRequests);
router.post('/friend-request/:userId', protect, sendFriendRequest);
router.post('/friend-request/accept/:userId', protect, acceptFriendRequest);
router.post('/friend-request/reject/:userId', protect, rejectFriendRequest);

// User routes
router.get('/', protect, getUsers);
router.get('/:id', protect, getUserById);
router.put('/profile', protect, updateUserProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);

export default router;
