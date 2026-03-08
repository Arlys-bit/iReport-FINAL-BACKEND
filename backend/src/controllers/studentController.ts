import { Request, Response, NextFunction } from 'express';
import { Student, GradeLevel, Section } from '@/models';
import logger from '@/utils/logger';

export const getStudents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gradeLevel, section, skip = 0, limit = 20 } = req.query;

    const filter: any = { isActive: true };
    if (gradeLevel) filter.gradeLevel = gradeLevel;
    if (section) filter.section = section;

    const students = await Student.find(filter)
      .skip(Number(skip))
      .limit(Number(limit));

    const total = await Student.countDocuments(filter);

    return res.json({
      data: students,
      total,
    });
  } catch (error) {
    logger.error('Get students error:', error);
    next(error);
  }
};

export const getGradeLevels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const gradeLevels = await GradeLevel.find({ isActive: true }).sort('order');

    return res.json(gradeLevels);
  } catch (error) {
    logger.error('Get grade levels error:', error);
    next(error);
  }
};

export const getSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gradeLevelId } = req.query;

    const filter: any = { isActive: true };
    if (gradeLevelId) filter.gradeLevelId = gradeLevelId;

    const sections = await Section.find(filter).populate('adviser', 'fullName');

    return res.json(sections);
  } catch (error) {
    logger.error('Get sections error:', error);
    next(error);
  }
};

export const createStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = new Student(req.body);
    await student.save();

    logger.info(`Student created: ${student._id}`);
    return res.status(201).json(student);
  } catch (error) {
    logger.error('Create student error:', error);
    next(error);
  }
};

export const updateStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    logger.info(`Student updated: ${student._id}`);
    return res.json(student);
  } catch (error) {
    logger.error('Update student error:', error);
    next(error);
  }
};

export const deleteStudent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    logger.info(`Student deleted: ${student._id}`);
    return res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    logger.error('Delete student error:', error);
    next(error);
  }
};
