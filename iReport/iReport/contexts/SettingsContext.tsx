import React, { createContext, ReactNode, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

export type Language = 'en' | 'fil';
export type ThemeMode = 'light' | 'dark' | 'system';

interface Settings {
  theme: ThemeMode;
  language: Language;
  customPositions: string[];
  customSpecializations: string[];
  customRanks: string[];
}

const STORAGE_KEY = 'app_settings';
const LAST_SESSION_SETTINGS_KEY = 'app_settings_last_session';

const DEFAULT_SETTINGS: Settings = {
  theme: 'light',
  language: 'en',
  customPositions: [],
  customSpecializations: [],
  customRanks: [],
};

const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    dashboard: 'Dashboard',
    students: 'Students',
    staff: 'Staff',
    reports: 'Reports',
    settings: 'Settings',
    profile: 'Profile',
    logout: 'Logout',
    darkMode: 'Dark Mode',
    language: 'Language',
    english: 'English',
    filipino: 'Tagalog',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    remove: 'Remove',
    specialization: 'Specialization',
    rank: 'Rank',
    teaching: 'Teaching',
    notTeaching: 'Not Teaching',
    isTeaching: 'Is Teaching',
    addSpecialization: 'Add Specialization',
    addRank: 'Add Rank',
    customSpecializations: 'Custom Specializations',
    customRanks: 'Custom Ranks',
    name: 'Name',
    email: 'Email',
    password: 'Password',
    position: 'Position',
    permissions: 'Permissions',
    managePermissions: 'Manage Permissions',
    changePassword: 'Change Password',
    basicInformation: 'Basic Information',
    teachingAssignment: 'Teaching Assignment',
    gradeLevel: 'Grade Level',
    section: 'Section',
    clusterRole: 'Cluster Role',
    staffId: 'Staff ID',
    schoolEmail: 'School Email',
    professionalRank: 'Professional Rank',
    studentInformation: 'Student Information',
    staffInformation: 'Staff Information',
    accountSettings: 'Account Settings',
    preferences: 'Preferences',
    selectLanguage: 'Select Language',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmNewPassword: 'Confirm New Password',
    gradeAndSection: 'Grade & Section',
    lrn: 'LRN',
    signInSubtitle: 'Sign in to your account',
    signInButton: 'Sign In',
    enterEmail: 'Enter your email',
    enterPassword: 'Enter your password',
    demoAdminCredentials: 'iReport Demo Admin Credentials:',
    demoEmail: 'Email: admin@school.edu',
    demoPassword: 'Password: admin123',
  },
  fil: {
    dashboard: 'Dashboard',
    students: 'Mga Estudyante',
    staff: 'Kawani',
    reports: 'Mga Ulat',
    settings: 'Mga Setting',
    profile: 'Profile',
    logout: 'Mag-logout',
    darkMode: 'Dark Mode',
    language: 'Wika',
    english: 'Ingles',
    filipino: 'Tagalog',
    save: 'I-save',
    cancel: 'Kanselahin',
    delete: 'Tanggalin',
    edit: 'I-edit',
    add: 'Idagdag',
    remove: 'Alisin',
    specialization: 'Espesyalisasyon',
    rank: 'Ranggo',
    teaching: 'Nagtuturo',
    notTeaching: 'Hindi Nagtuturo',
    isTeaching: 'Nagtuturo ba',
    addSpecialization: 'Magdagdag ng Espesyalisasyon',
    addRank: 'Magdagdag ng Ranggo',
    customSpecializations: 'Mga Custom na Espesyalisasyon',
    customRanks: 'Mga Custom na Ranggo',
    name: 'Pangalan',
    email: 'Email',
    password: 'Password',
    position: 'Posisyon',
    permissions: 'Mga Pahintulot',
    managePermissions: 'Pamahalaan ang Mga Pahintulot',
    changePassword: 'Palitan ang Password',
    basicInformation: 'Pangunahing Impormasyon',
    teachingAssignment: 'Assignment sa Pagtuturo',
    gradeLevel: 'Antas ng Grado',
    section: 'Seksyon',
    clusterRole: 'Papel sa Cluster',
    staffId: 'Staff ID',
    schoolEmail: 'School Email',
    professionalRank: 'Propesyonal na Ranggo',
    studentInformation: 'Impormasyon ng Estudyante',
    staffInformation: 'Impormasyon ng Kawani',
    accountSettings: 'Mga Setting ng Account',
    preferences: 'Mga Kagustuhan',
    selectLanguage: 'Pumili ng Wika',
    currentPassword: 'Kasalukuyang Password',
    newPassword: 'Bagong Password',
    confirmNewPassword: 'Kumpirmahin ang Bagong Password',
    gradeAndSection: 'Antas ng Grado at Seksyon',
    lrn: 'LRN',
    signInSubtitle: 'Mag-sign in sa iyong account',
    signInButton: 'Mag-sign In',
    enterEmail: 'Ilagay ang iyong email',
    enterPassword: 'Ilagay ang iyong password',
    demoAdminCredentials: 'iReport Demo Admin Credentials:',
    demoEmail: 'Email: admin@school.edu',
    demoPassword: 'Password: admin123',
  },
};

interface SettingsContextType {
  settings: Settings;
  isDark: boolean;
  colors: any;
  theme: ThemeMode;
  language: Language;
  customPositions: string[];
  customSpecializations: string[];
  customRanks: string[];
  setTheme: (theme: ThemeMode) => void;
  setLanguage: (language: Language) => void;
  addCustomPosition: (name: string) => void;
  removeCustomPosition: (name: string) => void;
  addCustomSpecialization: (name: string) => void;
  removeCustomSpecialization: (name: string) => void;
  addCustomRank: (name: string) => void;
  removeCustomRank: (name: string) => void;
  t: (key: string) => string;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [isDark, setIsDark] = useState(false);
  const { currentUser } = useAuth();

  // Create per-user storage key based on current user's ID
  const getUserStorageKey = (userId?: string) => {
    if (!userId) {
      return LAST_SESSION_SETTINGS_KEY;
    }
    return `${STORAGE_KEY}_user_${userId}`;
  };

  const storageKey = getUserStorageKey(currentUser?.id);

  const settingsQuery = useQuery({
    queryKey: ['appSettings', currentUser?.id],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.language && !['en', 'fil'].includes(parsed.language)) {
          return { ...parsed, language: 'en' as Language };
        }
        return parsed;
      }

      // If no session snapshot yet, use legacy/global key once, then persist as last session.
      if (!currentUser?.id) {
        const legacy = await AsyncStorage.getItem(STORAGE_KEY);
        if (legacy) {
          const parsed = JSON.parse(legacy);
          const sanitized =
            parsed?.language && !['en', 'fil'].includes(parsed.language)
              ? { ...parsed, language: 'en' as Language }
              : parsed;
          await AsyncStorage.setItem(LAST_SESSION_SETTINGS_KEY, JSON.stringify(sanitized));
          return sanitized;
        }
      }

      return DEFAULT_SETTINGS;
    },
  });

  const settings: Settings = settingsQuery.data || DEFAULT_SETTINGS;

  useEffect(() => {
    if (settings.theme === 'dark') {
      setIsDark(true);
    } else {
      setIsDark(false);
    }
  }, [settings.theme]);

  useEffect(() => {
    // Keep login-screen preferences aligned with the currently active account.
    if (currentUser?.id && settingsQuery.data) {
      AsyncStorage.setItem(LAST_SESSION_SETTINGS_KEY, JSON.stringify(settingsQuery.data)).catch(() => {});
    }
  }, [currentUser?.id, settingsQuery.data]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: Settings) => {
      await AsyncStorage.setItem(storageKey, JSON.stringify(newSettings));
      await AsyncStorage.setItem(LAST_SESSION_SETTINGS_KEY, JSON.stringify(newSettings));
      return newSettings;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appSettings', currentUser?.id] });
    },
  });

  const setTheme = (theme: ThemeMode) => {
    const newSettings = { ...settings, theme };
    saveSettingsMutation.mutate(newSettings);
  };

  const setLanguage = (language: Language) => {
    const newSettings = { ...settings, language };
    saveSettingsMutation.mutate(newSettings);
  };

  const addCustomSpecialization = (name: string) => {
    if (!settings.customSpecializations.includes(name)) {
      const newSettings = {
        ...settings,
        customSpecializations: [...settings.customSpecializations, name],
      };
      saveSettingsMutation.mutate(newSettings);
    }
  };

  const removeCustomSpecialization = (name: string) => {
    const newSettings = {
      ...settings,
      customSpecializations: settings.customSpecializations.filter(s => s !== name),
    };
    saveSettingsMutation.mutate(newSettings);
  };

  const addCustomRank = (name: string) => {
    if (!settings.customRanks.includes(name)) {
      const newSettings = {
        ...settings,
        customRanks: [...settings.customRanks, name],
      };
      saveSettingsMutation.mutate(newSettings);
    }
  };

  const removeCustomRank = (name: string) => {
    const newSettings = {
      ...settings,
      customRanks: settings.customRanks.filter(r => r !== name),
    };
    saveSettingsMutation.mutate(newSettings);
  };

  const addCustomPosition = (name: string) => {
    if (!settings.customPositions.includes(name)) {
      const newSettings = {
        ...settings,
        customPositions: [...settings.customPositions, name],
      };
      saveSettingsMutation.mutate(newSettings);
    }
  };

  const removeCustomPosition = (name: string) => {
    const newSettings = {
      ...settings,
      customPositions: settings.customPositions.filter(p => p !== name),
    };
    saveSettingsMutation.mutate(newSettings);
  };

  const t = (key: string): string => {
    return TRANSLATIONS[settings.language]?.[key] || TRANSLATIONS.en[key] || key;
  };

  const colors = isDark ? {
    primary: '#60A5FA',
    primaryDark: '#3B82F6',
    secondary: '#93C5FD',
    background: '#0F172A',
    surface: '#1E293B',
    surfaceSecondary: '#334155',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textLight: '#64748B',
    border: '#334155',
    borderLight: '#1E293B',
    success: '#34D399',
    warning: '#FBBF24',
    error: '#F87171',
    anonymous: '#A78BFA',
    shadow: 'rgba(0, 0, 0, 0.3)',
  } : {
    primary: '#3B82F6',
    primaryDark: '#2563EB',
    secondary: '#60A5FA',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    surfaceSecondary: '#F1F5F9',
    text: '#1E293B',
    textSecondary: '#64748B',
    textLight: '#94A3B8',
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    anonymous: '#8B5CF6',
    shadow: 'rgba(0, 0, 0, 0.1)',
  };

  const value: SettingsContextType = {
    settings,
    isDark,
    colors,
    theme: settings.theme,
    language: settings.language,
    customPositions: settings.customPositions,
    customSpecializations: settings.customSpecializations,
    customRanks: settings.customRanks,
    setTheme,
    setLanguage,
    addCustomPosition,
    removeCustomPosition,
    addCustomSpecialization,
    removeCustomSpecialization,
    addCustomRank,
    removeCustomRank,
    t,
    isLoading: settingsQuery.isLoading,
  };

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within SettingsProvider');
  }
  return context;}
