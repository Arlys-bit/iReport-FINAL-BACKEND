import { Router } from 'express';
import * as studentController from '../controllers/studentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/', authMiddleware, studentController.getStudents);
router.post('/', authMiddleware, studentController.createStudent);
router.put('/:id', authMiddleware, studentController.updateStudent);
router.delete('/:id', authMiddleware, studentController.deleteStudent);

router.get('/grade-levels', authMiddleware, studentController.getGradeLevels);
router.post('/grade-levels', authMiddleware, studentController.createGradeLevel);
router.get('/sections', authMiddleware, studentController.getSections);
router.post('/sections', authMiddleware, studentController.createSection);

export default router;
