import { Router } from 'express';
import * as studentController from '../controllers/studentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, studentController.getStudents);
router.post('/', authMiddleware, studentController.createStudent);
router.put('/:id', authMiddleware, studentController.updateStudent);
router.delete('/:id', authMiddleware, studentController.deleteStudent);

router.get('/grade-levels', authMiddleware, studentController.getGradeLevels);
router.get('/sections', authMiddleware, studentController.getSections);

export default router;
