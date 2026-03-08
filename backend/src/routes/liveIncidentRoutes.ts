import { Router } from 'express';
import * as liveIncidentController from '../controllers/liveIncidentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/', authMiddleware, liveIncidentController.createLiveIncident);
router.get('/', authMiddleware, liveIncidentController.getLiveIncidents);
router.post('/:incidentId/respond', authMiddleware, liveIncidentController.respondToLiveIncident);
router.post('/:incidentId/resolve', authMiddleware, liveIncidentController.resolveLiveIncident);
router.delete('/:incidentId/responders/:userId', authMiddleware, liveIncidentController.removeResponder);

export default router;
