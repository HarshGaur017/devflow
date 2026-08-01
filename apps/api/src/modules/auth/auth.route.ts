import {Router} from 'express';
import {githubLogin, githubCallback} from './auth.controller.js';

const router = Router();

router.get('/auth/github', githubLogin);

router.get('/auth/github/callback', githubCallback);

export default router;