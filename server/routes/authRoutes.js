import express from 'express';
import { registerUser, loginUser, getMe, sendOTP, verifyOTP, changePassword, forgotPassword, verifyResetOTP, resetPassword } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);

// Forgot Password Routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

export default router;
