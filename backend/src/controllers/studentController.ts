import { Request, Response, NextFunction } from 'express';
import { Student, GradeLevel, Section } from '../models';
import logger from '../utils/logger';

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

export const createGradeLevel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, code } = req.body as { name?: string; code?: string };

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Grade level name is required' });
    }

    const existing = await GradeLevel.findOne({
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true,
    });
    if (existing) {
      return res.status(409).json({ error: 'Grade level already exists' });
    }

    const last = await GradeLevel.findOne({}).sort('-order');
    const nextOrder = (last?.order || 0) + 1;
    const generatedCode = (code || name).toString().trim().toLowerCase().replace(/\s+/g, '_');

    const gradeLevel = new GradeLevel({
      name: name.trim(),
      code: generatedCode,
      order: nextOrder,
      isActive: true,
    });

    await gradeLevel.save();

    logger.info(`Grade level created: ${gradeLevel._id}`);
    return res.status(201).json(gradeLevel);
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Grade level code already exists' });
    }
    logger.error('Create grade level error:', error);
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

export const createSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, gradeLevelId, advisorId, adviser, code } = req.body as {
      name?: string;
      gradeLevelId?: string;
      advisorId?: string;
      adviser?: string;
      code?: string;
    };

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Section name is required' });
    }
    if (!gradeLevelId) {
      return res.status(400).json({ error: 'gradeLevelId is required' });
    }

    const gradeLevelExists = await GradeLevel.findById(gradeLevelId);
    if (!gradeLevelExists) {
      return res.status(404).json({ error: 'Grade level not found' });
    }

    const duplicate = await Section.findOne({
      gradeLevelId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true,
    });
    if (duplicate) {
      return res.status(409).json({ error: 'Section already exists in this grade level' });
    }

    const generatedCode = (code || `${gradeLevelExists.code}_${name}`)
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_');

    const section = new Section({
      name: name.trim(),
      code: `${generatedCode}_${Date.now().toString().slice(-6)}`,
      gradeLevelId,
      adviser: adviser || advisorId || undefined,
      isActive: true,
    });

    await section.save();

    const populated = await Section.findById(section._id).populate('adviser', 'fullName');
    logger.info(`Section created: ${section._id}`);
    return res.status(201).json(populated || section);
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ error: 'Section code already exists' });
    }
    logger.error('Create section error:', error);
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
