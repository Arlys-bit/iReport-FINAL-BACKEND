import { Router } from 'express';
import * as reportController from '../controllers/reportController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, reportController.createReport);
router.get('/', authMiddleware, reportController.getReports);
router.get('/student/my-reports', authMiddleware, reportController.getStudentReports);
router.get('/:id', authMiddleware, reportController.getReportById);
router.put('/:id/status', authMiddleware, reportController.updateReportStatus);

export default router;
