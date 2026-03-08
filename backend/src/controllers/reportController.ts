import { Request, Response, NextFunction } from 'express';
import { IncidentReport } from '../models';
import logger from '../utils/logger';

export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reportData = {
      ...req.body,
      reporterId: req.userId,
      incidentDate: new Date(req.body.incidentDate),
    };

    const report = new IncidentReport(reportData);
    await report.save();

    logger.info(`Report created: ${report._id}`);
    return res.status(201).json(report);
  } catch (error) {
    logger.error('Create report error:', error);
    next(error);
  }
};

export const getReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority, skip = 0, limit = 10 } = req.query;

    const filter: any = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const reports = await IncidentReport.find(filter)
      .skip(Number(skip))
      .limit(Number(limit))
      .populate('reporterId', 'fullName email');

    const total = await IncidentReport.countDocuments(filter);

    return res.json({
      data: reports,
      total,
      skip: Number(skip),
      limit: Number(limit),
    });
  } catch (error) {
    logger.error('Get reports error:', error);
    next(error);
  }
};

export const getReportById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await IncidentReport.findById(req.params.id).populate('reporterId');

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    return res.json(report);
  } catch (error) {
    logger.error('Get report error:', error);
    next(error);
  }
};

export const updateReportStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, notes } = req.body;

    const report = await IncidentReport.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    report.status = status;
    report.reviewHistory.push({
      reviewedBy: req.userId as any,
      reviewedByName: req.body.reviewedByName || 'Staff',
      status,
      notes: notes || '',
      timestamp: new Date(),
    });

    await report.save();

    logger.info(`Report updated: ${report._id} - Status: ${status}`);
    return res.json(report);
  } catch (error) {
    logger.error('Update report error:', error);
    next(error);
  }
};

export const getStudentReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { skip = 0, limit = 10 } = req.query;

    const reports = await IncidentReport.find({ reporterId: req.userId })
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await IncidentReport.countDocuments({ reporterId: req.userId });

    return res.json({
      data: reports,
      total,
    });
  } catch (error) {
    logger.error('Get student reports error:', error);
    next(error);
  }
};
