import { Router } from 'express';
import * as buildingController from '@/controllers/buildingController';
import { authMiddleware } from '@/middleware/auth';

const router = Router();

router.get('/', authMiddleware, buildingController.getBuildings);
router.post('/', authMiddleware, buildingController.createBuilding);
router.put('/:id', authMiddleware, buildingController.updateBuilding);
router.delete('/:id', authMiddleware, buildingController.deleteBuilding);

export default router;
