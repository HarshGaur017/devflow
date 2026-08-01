import { Router, type Router as RouterType } from 'express';
import { getHealth } from './health.controller.js';

const router: RouterType = Router();

router.get('/health', getHealth);

export default router;
