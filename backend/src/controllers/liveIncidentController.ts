import { Request, Response, NextFunction } from 'express';
import { LiveIncident } from '../models';
import logger from '../utils/logger';

export const createLiveIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const incidentData = {
      ...req.body,
      reporterId: req.userId,
      status: 'active',
    };

    const incident = new LiveIncident(incidentData);
    await incident.save();

    logger.info(`Live incident created: ${incident._id}`);
    return res.status(201).json(incident);
  } catch (error) {
    logger.error('Create live incident error:', error);
    next(error);
  }
};

export const getLiveIncidents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, skip = 0, limit = 20 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;

    const incidents = await LiveIncident.find(filter)
      .skip(Number(skip))
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    const total = await LiveIncident.countDocuments(filter);

    return res.json({
      data: incidents,
      total,
    });
  } catch (error) {
    logger.error('Get live incidents error:', error);
    next(error);
  }
};

export const respondToLiveIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { incidentId } = req.params;
    const { userName } = req.body;

    const incident = await LiveIncident.findById(incidentId);

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const alreadyResponded = incident.responders.some((r) => r.userId.toString() === req.userId);

    if (!alreadyResponded) {
      incident.responders.push({
        userId: req.userId as any,
        userName: userName || 'Staff Member',
        respondedAt: new Date(),
      });

      if (incident.status === 'active') {
        incident.status = 'responding';
      }

      await incident.save();
      logger.info(`User responded to incident: ${incidentId}`);
    }

    return res.json(incident);
  } catch (error) {
    logger.error('Respond to incident error:', error);
    next(error);
  }
};

export const resolveLiveIncident = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { incidentId } = req.params;
    const { resolvedByName } = req.body;

    const incident = await LiveIncident.findById(incidentId);

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    incident.status = 'resolved';
    incident.resolvedBy = req.userId as any;
    incident.resolvedByName = resolvedByName || 'Staff Member';
    incident.resolvedAt = new Date();

    await incident.save();

    logger.info(`Incident resolved: ${incidentId}`);
    return res.json(incident);
  } catch (error) {
    logger.error('Resolve incident error:', error);
    next(error);
  }
};

export const removeResponder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { incidentId } = req.params;
    const { userId } = req.body;

    const incident = await LiveIncident.findById(incidentId);

    if (!incident) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    incident.responders = incident.responders.filter((r) => r.userId.toString() !== userId);

    await incident.save();

    logger.info(`Responder removed from incident: ${incidentId}`);
    return res.json(incident);
  } catch (error) {
    logger.error('Remove responder error:', error);
    next(error);
  }
};
