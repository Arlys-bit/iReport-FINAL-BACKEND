import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { AlertTriangle, MapPin, Shield, Users, MessageSquare, Zap, ChevronDown } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useLiveReports } from '@/contexts/LiveReportsContext';
import { useBuildings } from '@/contexts/BuildingsContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Student } from '@/types';

const INCIDENT_TYPES = [
  { id: 'fighting', label: 'Fighting', icon: Shield },
  { id: 'group_conflict', label: 'Group Conflict', icon: Users },
  { id: 'verbal_threats', label: 'Verbal Threats', icon: MessageSquare },
  { id: 'physical_assault', label: 'Physical Assault', icon: Zap },
  { id: 'emergency', label: 'Emergency', icon: AlertTriangle },
  { id: 'other', label: 'Other', icon: MapPin },
];

export default function StudentLiveReportScreen() {
  const { currentUser } = useAuth();
  const liveReports = useLiveReports();
  const createIncident = liveReports?.createIncident;
  const isCreating = liveReports?.isCreating ?? false;
  const { activeBuildings, getFloorsForBuilding } = useBuildings();
  const { colors, isDark } = useSettings();
  const styles = getStyles(colors, isDark);

  const student = currentUser as Student | null;

  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');

  const [showBuildingPicker, setShowBuildingPicker] = useState(false);
  const [showFloorPicker, setShowFloorPicker] = useState(false);

  const selectedBuildingData = useMemo(() => {
    return activeBuildings.find(b => b.id === selectedBuilding);
  }, [activeBuildings, selectedBuilding]);

  const availableFloors = useMemo(() => {
    if (!selectedBuilding) return [];
    return getFloorsForBuilding(selectedBuilding);
  }, [selectedBuilding, getFloorsForBuilding]);

  const handleBuildingSelect = (buildingId: string) => {
    setSelectedBuilding(buildingId);
    setSelectedFloor('');
    setSelectedRoom('');
    setShowBuildingPicker(false);
  };

  const handleSubmit = async () => {
    if (!student) {
      Alert.alert('Error', 'You must be logged in as a student');
      return;
    }

    if (!selectedBuilding || !selectedFloor) {
      Alert.alert('Required', 'Please select building and floor');
      return;
    }

    if (!selectedRoom.trim()) {
      Alert.alert('Required', 'Please enter the room or area');
      return;
    }

    if (!selectedType) {
      Alert.alert('Required', 'Please select incident type');
      return;
    }

    try {
      await createIncident({
        reporterId: student.id,
        reporterName: student.fullName,
        reporterGradeLevelId: student.gradeLevelId,
        reporterSectionId: student.sectionId,
        buildingId: selectedBuilding,
        buildingName: selectedBuildingData?.name || selectedBuilding,
        floor: selectedFloor,
        room: selectedRoom.trim(),
        incidentType: selectedType,
        description: description.trim(),
      });

      Alert.alert(
        'Alert Sent!',
        'Your live incident report has been sent to all available staff members. Help is on the way.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      console.log('Error creating live incident:', error);
      Alert.alert('Error', 'Failed to send alert. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Live Incident Report',
          headerStyle: { backgroundColor: isDark ? colors.background : colors.error },
          headerTintColor: isDark ? colors.text : colors.surface,
          headerTitleStyle: { color: isDark ? colors.text : colors.surface },
        }} 
      />

      <View style={styles.warningBanner}>
        <AlertTriangle size={24} color={colors.surface} />
        <View style={styles.warningText}>
          <Text style={styles.warningTitle}>Emergency Alert System</Text>
          <Text style={styles.warningSubtitle}>Report incidents happening RIGHT NOW</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Where is it happening?</Text>

          <View style={styles.pickerContainer}>
            <Text style={styles.label}>Building *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => {
                setShowBuildingPicker(!showBuildingPicker);
                setShowFloorPicker(false);
                setShowRoomPicker(false);
              }}
            >
              <Text style={[styles.pickerText, !selectedBuilding && styles.placeholderText]}>
                {selectedBuildingData?.name || 'Select Building'}
              </Text>
              <ChevronDown size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            {showBuildingPicker && (
              <View style={styles.dropdownMenu}>
                {activeBuildings.map(building => (
                  <TouchableOpacity
                    key={building.id}
                    style={[
                      styles.dropdownItem,
                      selectedBuilding === building.id && styles.dropdownItemSelected
                    ]}
                    onPress={() => handleBuildingSelect(building.id)}
                  >
                    <View style={[styles.buildingDot, { backgroundColor: building.color }]} />
                    <Text style={styles.dropdownText}>{building.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.rowContainer}>
            <View style={[styles.pickerContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Floor *</Text>
              <TouchableOpacity
                style={[styles.pickerButton, !selectedBuilding && styles.pickerDisabled]}
                onPress={() => {
                  if (!selectedBuilding) return;
                  setShowFloorPicker(!showFloorPicker);
                  setShowBuildingPicker(false);
                }}
                disabled={!selectedBuilding}
              >
                <Text style={[styles.pickerText, !selectedFloor && styles.placeholderText]}>
                  {selectedFloor || 'Select'}
                </Text>
                <ChevronDown size={20} color={colors.textSecondary} />
              </TouchableOpacity>
              {showFloorPicker && (
                <View style={styles.dropdownMenu}>
                  {availableFloors.map(floor => (
                    <TouchableOpacity
                      key={floor}
                      style={[
                        styles.dropdownItem,
                        selectedFloor === floor && styles.dropdownItemSelected
                      ]}
                      onPress={() => {
                        setSelectedFloor(floor);
                        setSelectedRoom('');
                        setShowFloorPicker(false);
                      }}
                    >
                      <Text style={styles.dropdownText}>{floor} Floor</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.pickerContainer, { flex: 1 }]}>
              <Text style={styles.label}>Room / Area *</Text>
              <TextInput
                style={[styles.roomInput, !selectedFloor && styles.pickerDisabled]}
                value={selectedRoom}
                onChangeText={setSelectedRoom}
                placeholder="e.g., 101 / Hallway"
                placeholderTextColor={colors.textLight}
                editable={!!selectedFloor}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What is happening?</Text>
          <View style={styles.incidentGrid}>
            {INCIDENT_TYPES.map(type => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.incidentChip,
                    isSelected && styles.incidentChipSelected,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                >
                  <Icon size={24} color={isSelected ? colors.surface : colors.textSecondary} />
                  <Text style={[
                    styles.incidentLabel,
                    isSelected && styles.incidentLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Brief Description (Optional)</Text>
          <TextInput
            style={styles.textarea}
            placeholder="Describe what's happening (optional)"
            placeholderTextColor={colors.textLight}
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
            maxLength={200}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/200</Text>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, isCreating && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={isCreating}
        >
          <AlertTriangle size={20} color={colors.surface} />
          <Text style={styles.submitButtonText}>
            {isCreating ? 'Sending Alert...' : 'SEND EMERGENCY ALERT'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          This alert will be immediately sent to all teachers, the principal, and guidance counselors. 
          Only use for real emergencies happening right now.
        </Text>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? colors.background : '#FEF2F2',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  warningText: {
    flex: 1,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: colors.surface,
  },
  warningSubtitle: {
    fontSize: 12,
    color: isDark ? `${colors.surface}CC` : '#FEE2E2',
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: isDark ? colors.border : '#FECACA',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 12,
  },
  pickerContainer: {
    marginBottom: 12,
    zIndex: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerDisabled: {
    opacity: 0.5,
  },
  pickerText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: '500' as const,
  },
  roomInput: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
    color: colors.text,
  },
  placeholderText: {
    color: colors.textLight,
  },
  rowContainer: {
    flexDirection: 'row',
    zIndex: 5,
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
    maxHeight: 200,
    zIndex: 100,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    gap: 10,
  },
  dropdownItemSelected: {
    backgroundColor: isDark ? `${colors.error}1A` : '#FEF2F2',
  },
  dropdownText: {
    fontSize: 15,
    color: colors.textSecondary,
  },
  buildingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  incidentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  incidentChip: {
    width: '48%',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 8,
  },
  incidentChipSelected: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  incidentLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  incidentLabelSelected: {
    color: colors.surface,
  },
  textarea: {
    backgroundColor: colors.surfaceSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
  },
  charCount: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 6,
    textAlign: 'right',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error,
    borderRadius: 12,
    paddingVertical: 18,
    gap: 10,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold' as const,
    letterSpacing: 0.5,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
});
