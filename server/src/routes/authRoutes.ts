import { Router } from 'express';
import {
  register,
  login,
  googleAuth,
  getMe,
  updateProfile,
  getTourists,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import { verifyKYC } from '../controllers/kycController.js';

const router = Router();

// Register & Login
router.post('/register', register);
router.post('/login', login);
router.post('/google', googleAuth);

// KYC Verification
router.post('/kyc', upload.single('document'), verifyKYC);

// Get All Tourists (Admin only)
router.get('/tourists', getTourists);

// Get Current User
router.get('/me', protect, getMe);
router.put('/me', protect, updateProfile);

export default router;
