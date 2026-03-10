import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import * as botController from '../controllers/botController';

const router = Router();

router.post('/', authMiddleware, botController.sendBotMessage);

export default router;
