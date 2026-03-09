import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login', authController.login);
router.post('/register', authController.register);
router.get('/profile', authMiddleware, authController.getProfile);
router.get('/staff', authMiddleware, authController.getStaffUsers);
router.put('/staff/:id', authMiddleware, authController.updateStaffUser);
router.put('/staff/:id/password', authMiddleware, authController.changeStaffPassword);
router.delete('/staff/:id', authMiddleware, authController.deleteStaffUser);

export default router;
