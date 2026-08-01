import {Router} from 'express';
import {githubLogin, githubCallback, getCurrentUser} from './auth.controller.js';
import { requireAuth } from './auth.middleware.js';

const router = Router();
console.log("✅ Auth router loaded");
router.get('/auth/github', githubLogin);

router.get('/auth/github/callback', githubCallback);
router.get('/auth/me', requireAuth, getCurrentUser);

export default router;