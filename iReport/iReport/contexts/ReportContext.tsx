import createContextHook from '@/utils/createContextHook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IncidentReport, ReportStatus, ReportReviewHistory, Notification } from '@/types';
import { reportsApi } from '@/utils/api';
import logger from '@/utils/logger';

const STORAGE_KEYS = {
  REPORTS: 'school_reports',
  NOTIFICATIONS: 'school_notifications',
};

export const [ReportsProvider, useReports] = createContextHook(() => {
  const queryClient = useQueryClient();
  const normalizeReport = (report: any): IncidentReport => ({
    id: String(report?.id || report?._id || `report_${Date.now()}`),
    reporterId: String(
      report?.reporterId?._id ||
        report?.reporterId?.id ||
        report?.reporterId ||
        ''
    ),
    reporterName:
      report?.reporterName ||
      report?.reporterId?.fullName ||
      'Unknown Reporter',
    reporterLRN: String(report?.reporterLRN || report?.reporterId?.studentId || ''),
    reporterGradeLevelId: String(report?.reporterGradeLevelId || report?.reporterGradeLevel || ''),
    reporterSectionId: String(report?.reporterSectionId || report?.reporterSection || ''),
    reporterPhoto: report?.reporterPhoto,
    isAnonymous: !!report?.isAnonymous,
    victimName: String(report?.victimName || ''),
    location:
      typeof report?.location === 'object' && report?.location
        ? report.location
        : {
            building: String(report?.buildingName || 'N/A'),
            floor: String(report?.floor || 'N/A'),
            room: typeof report?.location === 'string' ? report.location : String(report?.room || 'N/A'),
          },
    incidentType: report?.incidentType || 'other',
    description: report?.description,
    dateTime:
      report?.dateTime ||
      (report?.incidentDate
        ? new Date(report.incidentDate).toISOString()
        : undefined),
    cantRememberDateTime: !!report?.cantRememberDateTime,
    photoEvidence: report?.photoEvidence,
    reportingForSelf: report?.reportingForSelf !== false,
    status: report?.status || 'under_review',
    priority: report?.priority || 'medium',
    assignedTeacherId: report?.assignedTeacherId,
    reviewHistory: Array.isArray(report?.reviewHistory)
      ? report.reviewHistory.map((entry: any, index: number) => ({
          id: String(entry?.id || entry?._id || `review_${index}`),
          reviewerId: String(entry?.reviewerId || entry?.reviewedBy || ''),
          reviewerName: String(entry?.reviewerName || entry?.reviewedByName || 'Staff'),
          action:
            entry?.action ||
            (entry?.status === 'accepted'
              ? 'accepted'
              : entry?.status === 'declined'
              ? 'declined'
              : 'reviewed'),
          notes: entry?.notes,
          timestamp: String(
            entry?.timestamp || entry?.createdAt || new Date().toISOString()
          ),
        }))
      : [],
    adminNotes: report?.adminNotes,
    declineReason: report?.declineReason,
    createdAt: String(report?.createdAt || new Date().toISOString()),
    updatedAt: String(report?.updatedAt || report?.createdAt || new Date().toISOString()),
    reviewedAt: report?.reviewedAt,
    reviewedBy: report?.reviewedBy,
  });

  const reportsQuery = useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      try {
        const result: any = await reportsApi.getReports({ limit: 200 });
        const reports = Array.isArray(result) ? result : result?.data || [];
        return reports.map((report: any) => normalizeReport(report));
      } catch (apiError) {
        logger.warn('API fetch reports failed, using local storage:', apiError);
        const stored = await AsyncStorage.getItem(STORAGE_KEYS.REPORTS);
        return stored ? JSON.parse(stored) : [];
      }
    },
  });

  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const saveReportsMutation = useMutation({
    mutationFn: async (reports: IncidentReport[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
      return reports;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const saveNotificationsMutation = useMutation({
    mutationFn: async (notifications: Notification[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
      return notifications;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async (report: Omit<IncidentReport, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'priority' | 'reviewHistory'>) => {
      try {
        // Try API first
        const result: any = await reportsApi.createReport({
          reporterId: report.reporterId,
          reporterRole: 'student',
          reporterName: report.reporterName,
          reporterGradeLevel: report.reporterGradeLevelId,
          reporterSection: report.reporterSectionId,
          isAnonymous: report.isAnonymous,
          victimName: report.victimName,
          location:
            typeof report.location === 'object'
              ? `${report.location.building} ${report.location.floor} ${report.location.room}`.trim()
              : report.location,
          buildingName:
            typeof report.location === 'object' ? report.location.building : undefined,
          floor:
            typeof report.location === 'object' ? report.location.floor : undefined,
          room:
            typeof report.location === 'object' ? report.location.room : undefined,
          incidentType: report.incidentType,
          incidentDate: report.dateTime ? new Date(report.dateTime) : new Date(),
          incidentTime: report.dateTime
            ? new Date(report.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : undefined,
          description: report.description,
          photoEvidence: report.photoEvidence,
        });

        queryClient.invalidateQueries({ queryKey: ['reports'] });
        return normalizeReport(result);
      } catch (apiError) {
        logger.error('API create report failed:', apiError);
        throw new Error('Failed to submit report to server. Please check internet and try again.');
      }
    },
  });

  const updateReportStatusMutation = useMutation({
    mutationFn: async ({ 
      reportId, 
      status, 
      reviewerId,
      reviewerName,
      notes,
      declineReason,
    }: { 
      reportId: string; 
      status: ReportStatus;
      reviewerId: string;
      reviewerName: string;
      notes?: string;
      declineReason?: string;
    }) => {
      try {
        const updated: any = await reportsApi.updateReportStatus(reportId, {
          status,
          notes,
          reviewedByName: reviewerName,
          declineReason,
        });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        return normalizeReport(updated);
      } catch (apiError) {
        logger.warn('API update report status failed, using local storage:', apiError);
      }

      const reports: IncidentReport[] = reportsQuery.data || [];
      const index = reports.findIndex(r => r.id === reportId);
      
      if (index === -1) {
        throw new Error('Report not found');
      }

      const reviewEntry: ReportReviewHistory = {
        id: `review_${Date.now()}`,
        reviewerId,
        reviewerName,
        action: status === 'accepted' ? 'accepted' : status === 'declined' ? 'declined' : 'reviewed',
        notes,
        timestamp: new Date().toISOString(),
      };

      const updatedReports = [...reports];
      updatedReports[index] = {
        ...updatedReports[index],
        status,
        reviewHistory: [...updatedReports[index].reviewHistory, reviewEntry],
        adminNotes: notes || updatedReports[index].adminNotes,
        declineReason: declineReason || updatedReports[index].declineReason,
        reviewedAt: new Date().toISOString(),
        reviewedBy: reviewerId,
        updatedAt: new Date().toISOString(),
      };

      await saveReportsMutation.mutateAsync(updatedReports);

      await createNotification({
        userId: updatedReports[index].reporterId,
        title: `Report ${status === 'accepted' ? 'Accepted' : status === 'declined' ? 'Declined' : 'Updated'}`,
        message: status === 'accepted' 
          ? 'Your report has been accepted and is being processed.'
          : status === 'declined'
          ? `Your report has been declined. ${declineReason || ''}`
          : 'Your report status has been updated.',
        type: 'report',
        relatedId: reportId,
      });

      return updatedReports[index];
    },
  });

  const addReviewNoteMutation = useMutation({
    mutationFn: async ({
      reportId,
      reviewerId,
      reviewerName,
      notes,
    }: {
      reportId: string;
      reviewerId: string;
      reviewerName: string;
      notes: string;
    }) => {
      try {
        const report = (reportsQuery.data || []).find((r: IncidentReport) => r.id === reportId);
        if (!report) throw new Error('Report not found');

        const mergedNotes = report.adminNotes
          ? `${report.adminNotes}\n${notes}`
          : notes;

        const updated: any = await reportsApi.updateReportStatus(reportId, {
          status: report.status,
          notes: mergedNotes,
          reviewedByName: reviewerName,
        });
        queryClient.invalidateQueries({ queryKey: ['reports'] });
        return normalizeReport(updated);
      } catch (apiError) {
        logger.warn('API add review note failed, using local storage:', apiError);
      }

      const reports: IncidentReport[] = reportsQuery.data || [];
      const index = reports.findIndex(r => r.id === reportId);
      
      if (index === -1) {
        throw new Error('Report not found');
      }

      const reviewEntry: ReportReviewHistory = {
        id: `review_${Date.now()}`,
        reviewerId,
        reviewerName,
        action: 'note_added',
        notes,
        timestamp: new Date().toISOString(),
      };

      const updatedReports = [...reports];
      updatedReports[index] = {
        ...updatedReports[index],
        reviewHistory: [...updatedReports[index].reviewHistory, reviewEntry],
        updatedAt: new Date().toISOString(),
      };

      await saveReportsMutation.mutateAsync(updatedReports);
      return updatedReports[index];
    },
  });

  const createNotification = async (data: Omit<Notification, 'id' | 'isRead' | 'createdAt'>) => {
    const notifications: Notification[] = notificationsQuery.data || [];
    
    const newNotification: Notification = {
      ...data,
      id: `notif_${Date.now()}`,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updated = [newNotification, ...notifications];
    await saveNotificationsMutation.mutateAsync(updated);
    return newNotification;
  };

  const markNotificationReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const notifications: Notification[] = notificationsQuery.data || [];
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, isRead: true } : n
      );
      await saveNotificationsMutation.mutateAsync(updated);
      return true;
    },
  });

  const getReportsByTeacher = (teacherId: string) => {
    const reports: IncidentReport[] = reportsQuery.data || [];
    return reports.filter(r => !r.assignedTeacherId || r.assignedTeacherId === teacherId);
  };

  const getReportsByStudent = (studentId: string) => {
    const reports: IncidentReport[] = reportsQuery.data || [];
    return reports.filter(r => r.reporterId === studentId);
  };

  const getPendingReports = () => {
    const reports: IncidentReport[] = reportsQuery.data || [];
    return reports.filter(r => r.status === 'under_review');
  };

  const getOverdueReports = () => {
    const reports: IncidentReport[] = reportsQuery.data || [];
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    
    return reports.filter(r => 
      r.status === 'under_review' && 
      new Date(r.createdAt) < threeDaysAgo
    );
  };

  const getUserNotifications = (userId: string) => {
    const notifications: Notification[] = notificationsQuery.data || [];
    return notifications.filter(n => n.userId === userId);
  };

  const getUnreadNotificationCount = (userId: string) => {
    const notifications: Notification[] = notificationsQuery.data || [];
    return notifications.filter(n => n.userId === userId && !n.isRead).length;
  };

  return {
    reports: (reportsQuery.data || []) as IncidentReport[],
    notifications: (notificationsQuery.data || []) as Notification[],
    isLoading: reportsQuery.isLoading || notificationsQuery.isLoading,
    
    createReport: createReportMutation.mutateAsync,
    updateReportStatus: updateReportStatusMutation.mutateAsync,
    addReviewNote: addReviewNoteMutation.mutateAsync,
    markNotificationRead: markNotificationReadMutation.mutate,
    
    getReportsByTeacher,
    getReportsByStudent,
    getPendingReports,
    getOverdueReports,
    getUserNotifications,
    getUnreadNotificationCount,
    
    isCreatingReport: createReportMutation.isPending,
    isUpdatingStatus: updateReportStatusMutation.isPending,
  };
});
