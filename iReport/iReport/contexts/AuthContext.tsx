import createContextHook from '@/utils/createContextHook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { User, StaffMember, Student, UserRole, StaffPermission, hasPermission } from '@/types';
import { authApi } from '@/utils/api';
import logger from '@/utils/logger';

const STORAGE_KEYS = {
  CURRENT_USER: 'school_current_user',
  STAFF: 'school_staff_members',
};
const ALLOW_LOCAL_AUTH_FALLBACK = process.env.EXPO_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK === 'true';

const DEFAULT_ADMIN: StaffMember = {
  id: 'admin_default',
  role: 'admin',
  fullName: 'System Administrator',
  email: 'admin@school.edu',
  password: 'admin123',
  schoolEmail: 'admin@school.edu',
  staffId: 'ADMIN001',
  position: 'principal',
  permissions: [
    'edit_students',
    'assign_grades_sections',
    'promote_transfer_students',
    'edit_staff_profiles',
    'manage_reports',
    'access_sensitive_data',
    'manage_permissions',
    'view_all_reports',
    'create_grades_sections',
    'remove_students',
  ],
  isActive: true,
  createdAt: new Date().toISOString(),
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [currentUser, setCurrentUser] = useState<User | StaffMember | Student | null>(null);
  const queryClient = useQueryClient();

  const currentUserQuery = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    },
  });

  useEffect(() => {
    if (currentUserQuery.data !== undefined) {
      setCurrentUser(currentUserQuery.data);
    }
  }, [currentUserQuery.data]);

  const staffQuery = useQuery({
    queryKey: ['staffMembers'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.STAFF);
      if (stored) {
        const staffList = JSON.parse(stored);
        const hasAdmin = staffList.some((s: StaffMember) => s.id === 'admin_default');
        if (!hasAdmin) {
          const updated = [...staffList, DEFAULT_ADMIN];
          await AsyncStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(updated));
          return updated;
        }
        return staffList;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify([DEFAULT_ADMIN]));
      return [DEFAULT_ADMIN];
    },
  });

  const studentsQuery = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem('school_students');
      return stored ? JSON.parse(stored) : [];
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      try {
        // Try API first
        const response: any = await authApi.login(email, password);
        const token = response.token;
        let user = response.user || {};
        
        // Save token to storage
        await AsyncStorage.setItem('auth_token', token);

        // Hydrate with full profile when available (schoolEmail, staffId, position, etc.)
        try {
          const profile: any = await authApi.getProfile();
          if (profile) {
            user = {
              ...user,
              ...profile,
              id: String(profile.id || profile._id || user.id),
            };
          }
        } catch (profileError) {
          logger.warn('Profile fetch after login failed, using login payload only:', profileError);
        }

        user = {
          ...user,
          id: String(user.id || user._id || ''),
          schoolEmail: user.schoolEmail || user.email,
          staffId: user.staffId || String(user.id || user._id || ''),
          lrn: user.lrn || user.studentId || '',
          studentId: user.studentId || user.lrn || '',
          gradeLevelId: user.gradeLevelId || user.gradeLevel || '',
          sectionId: user.sectionId || user.section || '',
          position:
            user.position ||
            (user.role === 'admin' ? 'principal' : user.role),
        };

        await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        return user;
      } catch (apiError) {
        logger.warn('API login failed:', apiError);
        if (!ALLOW_LOCAL_AUTH_FALLBACK) {
          throw new Error('Cannot reach server. Please check internet/API URL and try again.');
        }
        logger.warn('Falling back to local auth because EXPO_PUBLIC_ALLOW_LOCAL_AUTH_FALLBACK=true');
        
        // Fallback to local auth if API is unavailable
        let staffMembers: StaffMember[] = staffQuery.data || [];
        const students: Student[] = studentsQuery.data || [];
        
        if (staffMembers.length === 0) {
          const stored = await AsyncStorage.getItem(STORAGE_KEYS.STAFF);
          if (stored) {
            staffMembers = JSON.parse(stored);
          } else {
            staffMembers = [DEFAULT_ADMIN];
            await AsyncStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffMembers));
          }
        }
        
        const staffUser = staffMembers.find(s => 
          s.schoolEmail.toLowerCase() === email.toLowerCase() && 
          s.isActive
        );
        
        if (staffUser) {
          await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(staffUser));
          await AsyncStorage.setItem('auth_token', 'offline_token');
          return staffUser;
        }
        
        const studentUser = students.find(s => 
          (s.email.toLowerCase() === email.toLowerCase() || s.schoolEmail?.toLowerCase() === email.toLowerCase()) && 
          s.isActive
        );
        
        if (studentUser) {
          await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(studentUser));
          await AsyncStorage.setItem('auth_token', 'offline_token');
          return studentUser;
        }

        throw new Error('Invalid email or password');
      }
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    },
    onSuccess: () => {
      setCurrentUser(null);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const updateCurrentUserMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      if (!currentUser) throw new Error('No user logged in');
      
      const updated = { ...currentUser, ...updates };
      await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
      
      if (currentUser.role === 'student') {
        const students: Student[] = studentsQuery.data || [];
        const index = students.findIndex(s => s.id === currentUser.id);
        if (index !== -1) {
          students[index] = updated as Student;
          await AsyncStorage.setItem('school_students', JSON.stringify(students));
          queryClient.invalidateQueries({ queryKey: ['students'] });
        }
      } else {
        const staffMembers: StaffMember[] = staffQuery.data || [];
        const index = staffMembers.findIndex(s => s.id === currentUser.id);
        if (index !== -1) {
          staffMembers[index] = updated as StaffMember;
          await AsyncStorage.setItem(STORAGE_KEYS.STAFF, JSON.stringify(staffMembers));
          queryClient.invalidateQueries({ queryKey: ['staffMembers'] });
        }
      }
      
      return updated;
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    },
  });

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'principal';
  const isGuidance = currentUser?.role === 'guidance';
  const isTeacher = currentUser?.role === 'teacher';
  const isStudent = currentUser?.role === 'student';
  
  const canAccessFullDashboard = isAdmin || isGuidance;
  
  const checkPermission = (permission: StaffPermission): boolean => {
    if (!currentUser || currentUser.role === 'student') return false;
    return hasPermission(currentUser as StaffMember, permission);
  };

  const getStaffMember = (): StaffMember | null => {
    if (!currentUser || currentUser.role === 'student') return null;
    return currentUser as StaffMember;
  };

  const getStudent = (): Student | null => {
    if (!currentUser || currentUser.role !== 'student') return null;
    return currentUser as Student;
  };

  return {
    currentUser,
    isLoading: currentUserQuery.isLoading || staffQuery.isLoading || studentsQuery.isLoading,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    updateCurrentUser: updateCurrentUserMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    
    isAdmin,
    isGuidance,
    isTeacher,
    isStudent,
    canAccessFullDashboard,
    checkPermission,
    getStaffMember,
    getStudent,
  };
});
