import { Router } from 'express';
import { signUp, signIn, googleAuthSync, getCurrentUser, updateProfile } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.post('/signup', signUp);
router.post('/signin', signIn);
router.post('/google', googleAuthSync);
router.get('/me', requireAuth, getCurrentUser);
router.patch('/profile', requireAuth, updateProfile);

export default router;
