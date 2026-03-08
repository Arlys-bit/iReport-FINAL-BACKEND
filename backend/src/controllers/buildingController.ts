import { Request, Response, NextFunction } from 'express';
import { Building } from '../models';
import logger from '../utils/logger';

export const getBuildings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { isActive } = req.query;

    const filter: any = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const buildings = await Building.find(filter);

    return res.json(buildings);
  } catch (error) {
    logger.error('Get buildings error:', error);
    next(error);
  }
};

export const createBuilding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const building = new Building(req.body);
    await building.save();

    logger.info(`Building created: ${building._id}`);
    return res.status(201).json(building);
  } catch (error) {
    logger.error('Create building error:', error);
    next(error);
  }
};

export const updateBuilding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const building = await Building.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    logger.info(`Building updated: ${building._id}`);
    return res.json(building);
  } catch (error) {
    logger.error('Update building error:', error);
    next(error);
  }
};

export const deleteBuilding = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const building = await Building.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!building) {
      return res.status(404).json({ error: 'Building not found' });
    }

    logger.info(`Building deleted: ${building._id}`);
    return res.json({ message: 'Building deleted successfully' });
  } catch (error) {
    logger.error('Delete building error:', error);
    next(error);
  }
};
