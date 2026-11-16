import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { EducationBillerCard } from '@/components/vtu/EducationBillerCard';
import { Spacing, Typography } from '@/constants/theme';

export interface EducationViewProps {
  initialExamBody?: 'WAEC' | 'NECO';
  onBackPress: () => void;
}

export const EducationView: React.FC<EducationViewProps> = ({
  initialExamBody = 'WAEC',
  onBackPress,
}) => {
  const { theme: Palette, isDark } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: Palette.canvas }]}>
      {/* Minimal Header */}
      <View style={[styles.header, { borderBottomColor: Palette.border, backgroundColor: Palette.surface }]}>
        <Pressable
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' },
            pressed && { opacity: 0.8 },
          ]}
          onPress={onBackPress}
          hitSlop={8}
        >
          <MaterialIcons name="arrow-back" size={20} color={Palette.onSurface} />
        </Pressable>
        <Text style={[styles.title, { color: Palette.onSurface }]}>Education</Text>
        <View style={styles.spacer} />
      </View>

      <View style={styles.content}>
        <EducationBillerCard
          initialExamBody={initialExamBody}
          onSuccess={() => {}}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Platform.OS === 'ios' ? 8 : 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
  spacer: {
    width: 36,
  },
  content: {
    padding: Spacing.four,
  },
});
