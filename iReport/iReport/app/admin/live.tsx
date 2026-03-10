import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Animated, Vibration, Platform } from 'react-native';
import { Stack, router } from 'expo-router';
import { AlertTriangle, MapPin, Clock, Users, CheckCircle, X, User, ChevronRight, Radio } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveReports } from '@/contexts/LiveReportsContext';
import { useStudents } from '@/contexts/StudentsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { LiveIncident, StaffMember, canRespondToLiveIncidents } from '@/types';
import * as Haptics from 'expo-haptics';

const ALERT_TIMER_SECONDS = 25;

interface IncidentTimerProps {
  createdAt: string;
  onExpire?: () => void;
}

function IncidentTimer({ createdAt }: IncidentTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const { colors } = useSettings();

  useEffect(() => {
    const startTime = new Date(createdAt).getTime();
    
    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - startTime) / 1000);
      setElapsed(diff);
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isUrgent = elapsed < ALERT_TIMER_SECONDS;

  return (
    <View style={[styles.timerContainer, isUrgent && styles.timerUrgent]}>
      <Clock size={14} color={isUrgent ? colors.error : colors.textSecondary} />
      <Text style={[styles.timerText, isUrgent && styles.timerTextUrgent]}>
        {formatTime(elapsed)}
      </Text>
      {isUrgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentBadgeText}>NEW</Text>
        </View>
      )}
    </View>
  );
}

interface NotificationAlertProps {
  incident: LiveIncident;
  onRespond: () => void;
  onDismiss: () => void;
}

function NotificationAlert({ incident, onRespond, onDismiss }: NotificationAlertProps) {
  const [timeLeft, setTimeLeft] = useState(ALERT_TIMER_SECONDS);
  const pulseAnim = useState(new Animated.Value(1))[0];
  const { colors, isDark } = useSettings();

  useEffect(() => {
    const startTime = new Date(incident.createdAt).getTime();
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - startTime) / 1000);
    const remaining = Math.max(0, ALERT_TIMER_SECONDS - elapsedSeconds);
    setTimeLeft(remaining);

    if (remaining <= 0) {
      onDismiss();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [incident.createdAt, onDismiss]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Vibration.vibrate([0, 500, 200, 500]);
    }

    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.alertOverlay}>
      <Animated.View style={[styles.alertCard, { backgroundColor: colors.surface, transform: [{ scale: pulseAnim }] }]}>
        <View style={styles.alertHeader}>
          <View style={[styles.alertIconContainer, { backgroundColor: colors.error }]}>
            <AlertTriangle size={32} color={colors.surface} />
          </View>
          <TouchableOpacity style={styles.alertCloseBtn} onPress={onDismiss}>
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.alertTitle, { color: colors.error }]}>LIVE INCIDENT ALERT</Text>
        
        <View style={styles.alertLocation}>
          <MapPin size={18} color={colors.error} />
          <Text style={[styles.alertLocationText, { color: colors.text }]}>
            {incident.buildingName} • {incident.floor} Floor {incident.room !== 'N/A' ? `• Room ${incident.room}` : ''}
          </Text>
        </View>

        <View style={[styles.alertTypeContainer, { backgroundColor: isDark ? `${colors.error}1A` : '#FEE2E2' }]}>
          <Text style={[styles.alertType, { color: colors.error }]}>{incident.incidentType.replace('_', ' ').toUpperCase()}</Text>
        </View>

        <Text style={[styles.alertDescription, { color: colors.textSecondary }]} numberOfLines={2}>
          {incident.description}
        </Text>

        <View style={[styles.alertTimerBar, { backgroundColor: colors.border }]}>
          <View style={[styles.alertTimerFill, { backgroundColor: colors.error, width: `${(timeLeft / ALERT_TIMER_SECONDS) * 100}%` }]} />
        </View>
        <Text style={[styles.alertTimerText, { color: colors.textSecondary }]}>{timeLeft}s to respond</Text>

        <TouchableOpacity style={[styles.alertRespondBtn, { backgroundColor: colors.error }]} onPress={onRespond}>
          <Text style={[styles.alertRespondBtnText, { color: colors.surface }]}>I AM RESPONDING</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

export default function LiveIncidentsScreen() {
  const { currentUser } = useAuth();
  const { colors, isDark } = useSettings();
  const styles = getStyles(colors, isDark);
  const liveReports = useLiveReports();
  const incidents = liveReports?.incidents ?? [];
  const activeIncidents = liveReports?.activeIncidents ?? [];
  const respondToIncident = liveReports?.respondToIncident;
  const resolveIncident = liveReports?.resolveIncident;
  const isUserResponding = liveReports?.isUserResponding ?? (() => false);
  const isResponding = liveReports?.isResponding ?? false;
  const isResolving = liveReports?.isResolving ?? false;
  const { gradeLevels, sections } = useStudents();

  const getGradeLevelName = (id: string) => {
    const grade = gradeLevels.find(g => g.id === id);
    return grade?.name || 'Unknown Grade';
  };

  const getSectionName = (id: string) => {
    const section = sections.find(s => s.id === id);
    return section?.name || 'Unknown Section';
  };

  const staffUser = currentUser as StaffMember | null;
  const canRespond = canRespondToLiveIncidents(staffUser);

  const [selectedIncident, setSelectedIncident] = useState<LiveIncident | null>(null);
  const [alertIncident, setAlertIncident] = useState<LiveIncident | null>(null);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const newIncidents = useMemo(() => {
    const now = Date.now();
    return activeIncidents.filter(incident => {
      const createdTime = new Date(incident.createdAt).getTime();
      const isNew = (now - createdTime) < ALERT_TIMER_SECONDS * 1000;
      const notDismissed = !dismissedAlerts.has(incident.id);
      const notResponding = !isUserResponding(incident.id, staffUser?.id || '');
      return isNew && notDismissed && notResponding;
    });
  }, [activeIncidents, dismissedAlerts, isUserResponding, staffUser?.id]);

  useEffect(() => {
    if (newIncidents.length > 0 && !alertIncident) {
      setAlertIncident(newIncidents[0]);
    }
  }, [newIncidents, alertIncident]);

  const handleRespond = useCallback(async (incident: LiveIncident) => {
    if (!staffUser || !canRespond) return;

    try {
      await respondToIncident({
        incidentId: incident.id,
        userId: staffUser.id,
        userName: staffUser.fullName,
        userRole: staffUser.role,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setAlertIncident(null);
      setDismissedAlerts(prev => new Set([...prev, incident.id]));
    } catch (error) {
      console.log('Error responding to incident:', error);
    }
  }, [staffUser, canRespond, respondToIncident]);

  const handleResolve = useCallback(async (incident: LiveIncident) => {
    if (!staffUser) return;

    try {
      await resolveIncident({
        incidentId: incident.id,
        resolvedBy: staffUser.id,
        resolvedByName: staffUser.fullName,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      setSelectedIncident(null);
    } catch (error) {
      console.log('Error resolving incident:', error);
    }
  }, [staffUser, resolveIncident]);

  const handleDismissAlert = useCallback(() => {
    if (alertIncident) {
      setDismissedAlerts(prev => new Set([...prev, alertIncident.id]));
      setAlertIncident(null);
    }
  }, [alertIncident]);

  const getStatusColor = (incident: LiveIncident) => {
    if (incident.status === 'resolved') return colors.success;
    if (incident.responders.length > 0) return colors.warning;
    return colors.error;
  };

  const getStatusLabel = (incident: LiveIncident) => {
    if (incident.status === 'resolved') return 'Resolved';
    if (incident.responders.length > 0) return `${incident.responders.length} Responding`;
    return 'No Response';
  };

  const sortedIncidents = useMemo(() => {
    return [...activeIncidents].sort((a, b) => {
      if (a.status === 'resolved' && b.status !== 'resolved') return 1;
      if (a.status !== 'resolved' && b.status === 'resolved') return -1;
      if (a.responders.length === 0 && b.responders.length > 0) return -1;
      if (a.responders.length > 0 && b.responders.length === 0) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [activeIncidents]);

  const resolvedIncidents = useMemo(() => {
    return incidents.filter(i => i.status === 'resolved').slice(0, 10);
  }, [incidents]);

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Live Incidents',
          headerStyle: { backgroundColor: isDark ? colors.background : '#DC2626' },
          headerTintColor: isDark ? colors.text : '#FFFFFF',
          headerTitleStyle: { color: isDark ? colors.text : '#FFFFFF' },
        }} 
      />

      {alertIncident && canRespond && (
        <NotificationAlert
          incident={alertIncident}
          onRespond={() => handleRespond(alertIncident)}
          onDismiss={handleDismissAlert}
        />
      )}

      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <Radio size={16} color="#DC2626" />
          <Text style={styles.statValue}>{activeIncidents.filter(i => i.responders.length === 0).length}</Text>
          <Text style={styles.statLabel}>No Response</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Users size={16} color="#F59E0B" />
          <Text style={styles.statValue}>{activeIncidents.filter(i => i.responders.length > 0).length}</Text>
          <Text style={styles.statLabel}>Responding</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <AlertTriangle size={16} color="#111827" />
          <Text style={styles.statValue}>{activeIncidents.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sortedIncidents.length === 0 ? (
          <View style={styles.emptyState}>
            <CheckCircle size={64} color="#10B981" />
            <Text style={styles.emptyTitle}>All Clear</Text>
            <Text style={styles.emptyText}>No active incidents at this time</Text>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Active Incidents ({sortedIncidents.length})</Text>
            {sortedIncidents.map(incident => {
              const isMyResponse = isUserResponding(incident.id, staffUser?.id || '');
              
              return (
                <TouchableOpacity
                  key={incident.id}
                  style={[
                    styles.incidentCard,
                    isMyResponse && styles.incidentCardResponding,
                  ]}
                  onPress={() => setSelectedIncident(incident)}
                >
                  <View style={styles.incidentHeader}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(incident) }]}>
                      {incident.responders.length === 0 && (
                        <View style={styles.pulseDot} />
                      )}
                    </View>
                    <View style={styles.incidentInfo}>
                      <Text style={styles.incidentLocation}>
                        {incident.buildingName} • {incident.floor} Floor
                      </Text>
                      <Text style={styles.incidentType}>
                        {incident.incidentType.replace('_', ' ')}
                      </Text>
                    </View>
                    <IncidentTimer createdAt={incident.createdAt} />
                  </View>

                  <Text style={styles.incidentDescription} numberOfLines={2}>
                    {incident.description}
                  </Text>

                  <View style={styles.incidentFooter}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(incident) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(incident) }]}>
                        {getStatusLabel(incident)}
                      </Text>
                    </View>

                    {canRespond && !isMyResponse && incident.status !== 'resolved' && (
                      <TouchableOpacity
                        style={styles.respondBtn}
                        onPress={() => handleRespond(incident)}
                        disabled={isResponding}
                      >
                        <Text style={styles.respondBtnText}>Respond</Text>
                      </TouchableOpacity>
                    )}

                    {isMyResponse && (
                      <View style={styles.myResponseBadge}>
                        <CheckCircle size={14} color="#10B981" />
                        <Text style={styles.myResponseText}>You are responding</Text>
                      </View>
                    )}

                    <ChevronRight size={20} color="#9CA3AF" />
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        )}

        {resolvedIncidents.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recently Resolved</Text>
            {resolvedIncidents.map(incident => (
              <TouchableOpacity
                key={incident.id}
                style={[styles.incidentCard, styles.incidentCardResolved]}
                onPress={() => setSelectedIncident(incident)}
              >
                <View style={styles.incidentHeader}>
                  <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                  <View style={styles.incidentInfo}>
                    <Text style={[styles.incidentLocation, { color: '#6B7280' }]}>
                      {incident.buildingName} • {incident.floor} Floor
                    </Text>
                    <Text style={[styles.incidentType, { color: '#9CA3AF' }]}>
                      {incident.incidentType.replace('_', ' ')}
                    </Text>
                  </View>
                  <Text style={styles.resolvedTime}>
                    {new Date(incident.resolvedAt || '').toLocaleTimeString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal
        visible={selectedIncident !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedIncident(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedIncident && (
              <>
                <View style={styles.modalHeader}>
                  <View style={[styles.modalStatusDot, { backgroundColor: getStatusColor(selectedIncident) }]} />
                  <Text style={styles.modalTitle}>Incident Details</Text>
                  <TouchableOpacity onPress={() => setSelectedIncident(null)}>
                    <X size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody}>
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Location</Text>
                    <View style={styles.locationBox}>
                      <MapPin size={20} color="#DC2626" />
                      <View>
                        <Text style={styles.locationPrimary}>{selectedIncident.buildingName}</Text>
                        <Text style={styles.locationSecondary}>
                          {selectedIncident.floor} Floor {selectedIncident.room !== 'N/A' ? `• Room ${selectedIncident.room}` : ''}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Incident Type</Text>
                    <View style={styles.typeBox}>
                      <Text style={styles.typeText}>
                        {selectedIncident.incidentType.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Description</Text>
                    <Text style={styles.descriptionText}>{selectedIncident.description}</Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Reported By</Text>
                    <View style={styles.reporterBox}>
                      <User size={18} color="#6B7280" />
                      <View>
                        <Text style={styles.reporterName}>{selectedIncident.reporterName}</Text>
                        <Text style={styles.reporterGrade}>
                          {getGradeLevelName(selectedIncident.reporterGradeLevelId)} - {getSectionName(selectedIncident.reporterSectionId)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Reported At</Text>
                    <Text style={styles.timeText}>
                      {new Date(selectedIncident.createdAt).toLocaleString()}
                    </Text>
                  </View>

                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>
                      Responders ({selectedIncident.responders.length})
                    </Text>
                    {selectedIncident.responders.length === 0 ? (
                      <Text style={styles.noResponders}>No one has responded yet</Text>
                    ) : (
                      selectedIncident.responders.map(responder => (
                        <View key={responder.id} style={styles.responderItem}>
                          <View style={styles.responderAvatar}>
                            <User size={16} color="#FFFFFF" />
                          </View>
                          <View style={styles.responderInfo}>
                            <Text style={styles.responderName}>{responder.userName}</Text>
                            <Text style={styles.responderRole}>{responder.userRole}</Text>
                          </View>
                          <Text style={styles.responderTime}>
                            {new Date(responder.respondedAt).toLocaleTimeString()}
                          </Text>
                        </View>
                      ))
                    )}
                  </View>

                  {selectedIncident.status === 'resolved' && (
                    <View style={styles.detailSection}>
                      <Text style={styles.detailLabel}>Resolved By</Text>
                      <View style={styles.resolvedBox}>
                        <CheckCircle size={18} color="#10B981" />
                        <View>
                          <Text style={styles.resolvedByName}>{selectedIncident.resolvedByName}</Text>
                          <Text style={styles.resolvedTime}>
                            {new Date(selectedIncident.resolvedAt || '').toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </ScrollView>

                {selectedIncident.status !== 'resolved' && canRespond && (
                  <View style={styles.modalFooter}>
                    {!isUserResponding(selectedIncident.id, staffUser?.id || '') ? (
                      <TouchableOpacity
                        style={styles.respondButton}
                        onPress={() => handleRespond(selectedIncident)}
                        disabled={isResponding}
                      >
                        <Users size={20} color="#FFFFFF" />
                        <Text style={styles.respondButtonText}>
                          {isResponding ? 'Responding...' : "I Am Responding"}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.resolveButton}
                        onPress={() => handleResolve(selectedIncident)}
                        disabled={isResolving}
                      >
                        <CheckCircle size={20} color="#FFFFFF" />
                        <Text style={styles.resolveButtonText}>
                          {isResolving ? 'Resolving...' : 'Mark as Resolved'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500' as const,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: colors.success,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  incidentCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  incidentCardResponding: {
    borderColor: colors.success,
    backgroundColor: isDark ? `${colors.success}1A` : '#F0FDF4',
  },
  incidentCardResolved: {
    opacity: 0.7,
  },
  incidentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  pulseDot: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(220, 38, 38, 0.4)',
  },
  incidentInfo: {
    flex: 1,
  },
  incidentLocation: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  incidentType: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  timerUrgent: {
    backgroundColor: isDark ? `${colors.error}1A` : '#FEE2E2',
  },
  timerText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
  },
  timerTextUrgent: {
    color: colors.error,
  },
  urgentBadge: {
    backgroundColor: colors.error,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    marginLeft: 4,
  },
  urgentBadgeText: {
    fontSize: 8,
    fontWeight: 'bold' as const,
    color: colors.surface,
  },
  incidentDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  incidentFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  respondBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  respondBtnText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600' as const,
  },
  myResponseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  myResponseText: {
    fontSize: 12,
    color: colors.success,
    fontWeight: '500' as const,
  },
  resolvedTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  alertCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
  },
  alertHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  alertIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertCloseBtn: {
    padding: 4,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.error,
    marginBottom: 16,
    letterSpacing: 1,
  },
  alertLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertLocationText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  alertTypeContainer: {
    backgroundColor: isDark ? `${colors.error}1A` : '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertType: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: colors.error,
  },
  alertDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  alertTimerBar: {
    width: '100%',
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  alertTimerFill: {
    height: '100%',
    backgroundColor: colors.error,
    borderRadius: 3,
  },
  alertTimerText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  alertRespondBtn: {
    backgroundColor: colors.error,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
  },
  alertRespondBtnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold' as const,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  modalStatusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: colors.text,
  },
  modalBody: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? `${colors.error}1A` : '#FEF2F2',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  locationPrimary: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  locationSecondary: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  typeBox: {
    backgroundColor: isDark ? `${colors.error}1A` : '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  typeText: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: colors.error,
  },
  descriptionText: {
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  },
  reporterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  reporterName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.text,
  },
  reporterGrade: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  timeText: {
    fontSize: 15,
    color: colors.text,
  },
  noResponders: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  responderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  responderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  responderInfo: {
    flex: 1,
  },
  responderName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  responderRole: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  responderTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  resolvedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: isDark ? `${colors.success}1A` : '#DCFCE7',
    padding: 12,
    borderRadius: 10,
    gap: 12,
  },
  resolvedByName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: colors.success,
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  respondButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  respondButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  resolveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 10,
  },
  resolveButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  mapButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryDark,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 30,
    gap: 8,
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  mapButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
