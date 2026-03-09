import createContextHook from '@/utils/createContextHook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Student, GradeLevel, Section, ViolationRecord } from '@/types';
import { authApi, studentsApi } from '@/utils/api';
import logger from '@/utils/logger';

const STORAGE_KEYS = {
  STUDENTS: 'school_students',
  GRADE_LEVELS: 'school_grade_levels',
  SECTIONS: 'school_sections',
};

const DEFAULT_GRADE_LEVELS: GradeLevel[] = [
  { id: 'g7', name: 'Grade 7', order: 1, isActive: true },
  { id: 'g8', name: 'Grade 8', order: 2, isActive: true },
  { id: 'g9', name: 'Grade 9', order: 3, isActive: true },
  { id: 'g10', name: 'Grade 10', order: 4, isActive: true },
  { id: 'g11', name: 'Grade 11', order: 5, isActive: true },
  { id: 'g12', name: 'Grade 12', order: 6, isActive: true },
];

export const [StudentsProvider, useStudents] = createContextHook(() => {
  const queryClient = useQueryClient();
  const normalizeGradeLevel = (level: any, index = 0): GradeLevel => ({
    id: String(level?.id || level?._id || `grade_${index}`),
    name: String(level?.name || `Grade ${index + 1}`),
    order: typeof level?.order === 'number' ? level.order : index + 1,
    isActive: level?.isActive !== false,
  });
  const normalizeSection = (section: any, index = 0): Section => ({
    id: String(section?.id || section?._id || `section_${index}`),
    name: String(section?.name || `Section ${index + 1}`),
    gradeLevelId: String(
      section?.gradeLevelId?._id ||
        section?.gradeLevelId ||
        section?.gradeLevel ||
        ''
    ),
    advisorId: section?.adviser?._id || section?.advisorId || section?.adviser,
    isActive: section?.isActive !== false,
  });
  const normalizeStudent = (student: any, index = 0): Student => ({
    id: String(student?.id || student?._id || `student_${index}`),
    role: 'student',
    fullName: String(student?.fullName || ''),
    email: String(student?.email || student?.schoolEmail || ''),
    password: String(student?.password || ''),
    profilePhoto: student?.profilePhoto,
    createdAt: String(student?.createdAt || new Date().toISOString()),
    isActive: student?.isActive !== false,
    lrn: String(student?.lrn || student?.studentId || ''),
    gradeLevelId: String(student?.gradeLevelId || student?.gradeLevel || ''),
    sectionId: String(student?.sectionId || student?.section || ''),
    schoolEmail: String(student?.schoolEmail || student?.email || ''),
    violationHistory: Array.isArray(student?.violationHistory) ? student.violationHistory : [],
    assignedTeacherId: student?.assignedTeacherId,
  });

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      try {
        // Try API first
        const result: any = await studentsApi.getStudents();
        const students = Array.isArray(result) ? result : result?.data || [];
        return students.map((student: any, index: number) => normalizeStudent(student, index));
      } catch (apiError) {
        logger.warn('API fetch students failed, using local storage:', apiError);
        
        // Fallback to local storage
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.STUDENTS);
        return stored ? JSON.parse(stored) : [];
      }
    },
  });

  const gradeLevelsQuery = useQuery({
    queryKey: ['gradeLevels'],
    queryFn: async () => {
      try {
        // Try API first
        const result: any = await studentsApi.getGradeLevels();
        const levels = Array.isArray(result) ? result : result?.data || [];
        return levels.map((level: any, index: number) => normalizeGradeLevel(level, index));
      } catch (apiError) {
        logger.warn('API fetch grade levels failed, using defaults:', apiError);
        
        // Fallback to defaults or local storage
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.GRADE_LEVELS);
        if (stored) {
          return JSON.parse(stored);
        }
        await AsyncStorage.setItem(STORAGE_KEYS.GRADE_LEVELS, JSON.stringify(DEFAULT_GRADE_LEVELS));
        return DEFAULT_GRADE_LEVELS;
      }
    },
  });

  const sectionsQuery = useQuery({
    queryKey: ['sections'],
    queryFn: async () => {
      try {
        // Try API first
        const result: any = await studentsApi.getSections();
        const sections = Array.isArray(result) ? result : result?.data || [];
        return sections.map((section: any, index: number) => normalizeSection(section, index));
      } catch (apiError) {
        logger.warn('API fetch sections failed, using local storage:', apiError);
        
        // Fallback to local storage
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.SECTIONS);
        return stored ? JSON.parse(stored) : [];
      }
    },
  });

  const saveStudentsMutation = useMutation({
    mutationFn: async (students: Student[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
      return students;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  const saveGradeLevelsMutation = useMutation({
    mutationFn: async (levels: GradeLevel[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.GRADE_LEVELS, JSON.stringify(levels));
      return levels;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gradeLevels'] });
    },
  });

  const saveSectionsMutation = useMutation({
    mutationFn: async (sections: Section[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.SECTIONS, JSON.stringify(sections));
      return sections;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections'] });
    },
  });

  const createGradeLevelMutation = useMutation({
    mutationFn: async (data: { name: string }) => {
      try {
        const created: any = await studentsApi.createGradeLevel({ name: data.name });
        queryClient.invalidateQueries({ queryKey: ['gradeLevels'] });
        return normalizeGradeLevel(created);
      } catch (apiError) {
        logger.warn('API create grade level failed, using local storage:', apiError);
        const levels: GradeLevel[] = gradeLevelsQuery.data || [];
        const maxOrder = levels.reduce((max, l) => Math.max(max, l.order), 0);

        const newLevel: GradeLevel = {
          id: `grade_${Date.now()}`,
          name: data.name,
          order: maxOrder + 1,
          isActive: true,
        };

        const updated = [...levels, newLevel];
        await saveGradeLevelsMutation.mutateAsync(updated);
        return newLevel;
      }
    },
  });

  const createSectionMutation = useMutation({
    mutationFn: async (data: { name: string; gradeLevelId: string; advisorId?: string }) => {
      try {
        const created: any = await studentsApi.createSection(data);
        queryClient.invalidateQueries({ queryKey: ['sections'] });
        return normalizeSection(created);
      } catch (apiError) {
        logger.warn('API create section failed, using local storage:', apiError);
        const sections: Section[] = sectionsQuery.data || [];

        const exists = sections.some(
          s => s.name.toLowerCase() === data.name.toLowerCase() && s.gradeLevelId === data.gradeLevelId
        );
        if (exists) {
          throw new Error('Section already exists in this grade level');
        }

        const newSection: Section = {
          id: `section_${Date.now()}`,
          name: data.name,
          gradeLevelId: data.gradeLevelId,
          advisorId: data.advisorId,
          isActive: true,
        };

        const updated = [...sections, newSection];
        await saveSectionsMutation.mutateAsync(updated);
        return newSection;
      }
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: Omit<Student, 'id' | 'createdAt' | 'role' | 'isActive' | 'violationHistory'>) => {
      const students: Student[] = studentsQuery.data || [];
      
      const lrnExists = students.some(s => s.lrn === data.lrn);
      if (lrnExists) {
        throw new Error('LRN already exists');
      }
      
      const emailExists = students.some(s => s.email.toLowerCase() === data.email.toLowerCase());
      if (emailExists) {
        throw new Error('Email already exists');
      }
      
      const newStudent: Student = {
        ...data,
        id: `student_${Date.now()}`,
        role: 'student',
        isActive: true,
        violationHistory: [],
        createdAt: new Date().toISOString(),
      };

      // Backend-first creation for reliable cross-device sync.
      await authApi.register({
        fullName: newStudent.fullName,
        email: newStudent.schoolEmail || newStudent.email,
        schoolEmail: newStudent.schoolEmail || newStudent.email,
        password: newStudent.password,
        role: 'student',
        studentId: newStudent.lrn,
        lrn: newStudent.lrn,
        gradeLevel: String((newStudent as any).gradeLevelId || ''),
        section: String((newStudent as any).sectionId || ''),
        profilePhoto: newStudent.profilePhoto,
      });

      queryClient.invalidateQueries({ queryKey: ['students'] });

      try {
        const result: any = await studentsApi.getStudents();
        const latest = (Array.isArray(result) ? result : result?.data || []).map((student: any, index: number) =>
          normalizeStudent(student, index)
        );
        const match =
          latest.find((s: Student) => s.email.toLowerCase() === (newStudent.email || '').toLowerCase()) ||
          latest.find((s: Student) => s.lrn === newStudent.lrn);
        return match || newStudent;
      } catch {
        return newStudent;
      }
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Student> }) => {
      const students: Student[] = studentsQuery.data || [];
      const index = students.findIndex(s => s.id === id);
      
      if (index === -1) {
        throw new Error('Student not found');
      }
      
      const updated = [...students];
      updated[index] = { ...updated[index], ...updates };
      await saveStudentsMutation.mutateAsync(updated);
      return updated[index];
    },
  });

  const promoteStudentMutation = useMutation({
    mutationFn: async ({ 
      studentId, 
      newGradeLevelId, 
      newSectionId,
      newTeacherId 
    }: { 
      studentId: string; 
      newGradeLevelId: string; 
      newSectionId: string;
      newTeacherId?: string;
    }) => {
      const students: Student[] = studentsQuery.data || [];
      const index = students.findIndex(s => s.id === studentId);
      
      if (index === -1) {
        throw new Error('Student not found');
      }
      
      const updated = [...students];
      updated[index] = {
        ...updated[index],
        gradeLevelId: newGradeLevelId,
        sectionId: newSectionId,
        assignedTeacherId: newTeacherId,
      };
      
      await saveStudentsMutation.mutateAsync(updated);
      return updated[index];
    },
  });

  const transferStudentMutation = useMutation({
    mutationFn: async ({ 
      studentId, 
      newSectionId,
      newTeacherId 
    }: { 
      studentId: string; 
      newSectionId: string;
      newTeacherId?: string;
    }) => {
      const students: Student[] = studentsQuery.data || [];
      const index = students.findIndex(s => s.id === studentId);
      
      if (index === -1) {
        throw new Error('Student not found');
      }
      
      const updated = [...students];
      updated[index] = {
        ...updated[index],
        sectionId: newSectionId,
        assignedTeacherId: newTeacherId,
      };
      
      await saveStudentsMutation.mutateAsync(updated);
      return updated[index];
    },
  });

  const addViolationMutation = useMutation({
    mutationFn: async ({ studentId, violation }: { studentId: string; violation: Omit<ViolationRecord, 'id'> }) => {
      const students: Student[] = studentsQuery.data || [];
      const index = students.findIndex(s => s.id === studentId);
      
      if (index === -1) {
        throw new Error('Student not found');
      }
      
      const newViolation: ViolationRecord = {
        ...violation,
        id: `violation_${Date.now()}`,
      };
      
      const updated = [...students];
      updated[index] = {
        ...updated[index],
        violationHistory: [...updated[index].violationHistory, newViolation],
      };
      
      await saveStudentsMutation.mutateAsync(updated);
      return updated[index];
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      const students: Student[] = studentsQuery.data || [];
      const updated = students.filter(s => s.id !== studentId);
      await saveStudentsMutation.mutateAsync(updated);
      return true;
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ studentId, newPassword }: { studentId: string; newPassword: string }) => {
      const students: Student[] = studentsQuery.data || [];
      const index = students.findIndex(s => s.id === studentId);
      
      if (index === -1) {
        throw new Error('Student not found');
      }
      
      const updated = [...students];
      updated[index] = { ...updated[index], password: newPassword };
      await saveStudentsMutation.mutateAsync(updated);
      return true;
    },
  });

  const deleteGradeLevelMutation = useMutation({
    mutationFn: async (gradeLevelId: string) => {
      const levels: GradeLevel[] = gradeLevelsQuery.data || [];
      const sections: Section[] = sectionsQuery.data || [];
      const students: Student[] = studentsQuery.data || [];
      
      const hasStudents = students.some(s => s.gradeLevelId === gradeLevelId);
      if (hasStudents) {
        throw new Error('Cannot delete grade level with existing students. Please remove or transfer students first.');
      }
      
      const hasSections = sections.some(s => s.gradeLevelId === gradeLevelId);
      if (hasSections) {
        throw new Error('Cannot delete grade level with existing sections. Please delete sections first.');
      }
      
      const updated = levels.filter(l => l.id !== gradeLevelId);
      await saveGradeLevelsMutation.mutateAsync(updated);
      return true;
    },
  });

  const deleteSectionMutation = useMutation({
    mutationFn: async (sectionId: string) => {
      const sections: Section[] = sectionsQuery.data || [];
      const students: Student[] = studentsQuery.data || [];
      
      const hasStudents = students.some(s => s.sectionId === sectionId);
      if (hasStudents) {
        throw new Error('Cannot delete section with existing students. Please remove or transfer students first.');
      }
      
      const updated = sections.filter(s => s.id !== sectionId);
      await saveSectionsMutation.mutateAsync(updated);
      return true;
    },
  });

  const getStudentsBySection = (sectionId: string) => {
    const students: Student[] = studentsQuery.data || [];
    return students.filter(s => s.sectionId === sectionId && s.isActive);
  };

  const getStudentsByGradeLevel = (gradeLevelId: string) => {
    const students: Student[] = studentsQuery.data || [];
    return students.filter(s => s.gradeLevelId === gradeLevelId && s.isActive);
  };

  const getStudentsByTeacher = (teacherId: string) => {
    const students: Student[] = studentsQuery.data || [];
    return students.filter(s => s.assignedTeacherId === teacherId && s.isActive);
  };

  const getSectionsByGradeLevel = (gradeLevelId: string) => {
    const sections: Section[] = sectionsQuery.data || [];
    return sections.filter(s => s.gradeLevelId === gradeLevelId && s.isActive);
  };

  return {
    students: (studentsQuery.data || []) as Student[],
    gradeLevels: (gradeLevelsQuery.data || []) as GradeLevel[],
    sections: (sectionsQuery.data || []) as Section[],
    isLoading: studentsQuery.isLoading || gradeLevelsQuery.isLoading || sectionsQuery.isLoading,
    
    createGradeLevel: createGradeLevelMutation.mutateAsync,
    createSection: createSectionMutation.mutateAsync,
    createStudent: createStudentMutation.mutateAsync,
    updateStudent: updateStudentMutation.mutateAsync,
    promoteStudent: promoteStudentMutation.mutateAsync,
    transferStudent: transferStudentMutation.mutateAsync,
    addViolation: addViolationMutation.mutateAsync,
    deleteStudent: deleteStudentMutation.mutateAsync,
    resetStudentPassword: resetPasswordMutation.mutateAsync,
    deleteGradeLevel: deleteGradeLevelMutation.mutateAsync,
    deleteSection: deleteSectionMutation.mutateAsync,
    
    getStudentsBySection,
    getStudentsByGradeLevel,
    getStudentsByTeacher,
    getSectionsByGradeLevel,
    
    isCreatingStudent: createStudentMutation.isPending,
    isUpdating: updateStudentMutation.isPending,
    isDeletingGrade: deleteGradeLevelMutation.isPending,
    isDeletingSection: deleteSectionMutation.isPending,
  };
});
