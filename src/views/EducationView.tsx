import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { EducationBillerCard } from '@/components/vtu/EducationBillerCard';
import { Rounded, Spacing, Typography } from '@/constants/theme';

export interface EducationViewProps {
  initialExamBody?: 'WAEC' | 'JAMB' | 'NECO';
  onBackPress: () => void;
}

export const EducationView: React.FC<EducationViewProps> = ({
  initialExamBody = 'WAEC',
  onBackPress,
}) => {
  const { theme: Palette, isDark } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: Palette.canvas }]}>
      {/* Top Header */}
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
        <View style={styles.headerTitleBox}>
          <Text style={[styles.headerTitle, { color: Palette.onSurface }]}>Education Services</Text>
          <Text style={[styles.headerSubtitle, { color: Palette.onSurfaceMuted }]}>
            WAEC, JAMB & NECO Examination e-PINs
          </Text>
        </View>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Official Partners Trust Banner */}
        <View
          style={[
            styles.trustBanner,
            {
              backgroundColor: isDark ? 'rgba(13, 148, 136, 0.12)' : '#F0FDFA',
              borderColor: isDark ? 'rgba(13, 148, 136, 0.25)' : '#CCFBF1',
            },
          ]}
        >
          <View style={styles.trustIconBox}>
            <MaterialIcons name="verified" size={24} color="#0D9488" />
          </View>
          <View style={styles.trustTextBox}>
            <Text style={[styles.trustTitle, { color: '#0F766E' }]}>
              Official Examination Accreditation
            </Text>
            <Text style={[styles.trustDesc, { color: isDark ? '#99F6E4' : '#115E59' }]}>
              Instant e-PIN delivery with printable result-checker vouchers and portal links.
            </Text>
          </View>
        </View>

        {/* Biller Card */}
        <EducationBillerCard
          initialExamBody={initialExamBody}
          onSuccess={() => {
            // Receipt modal handles success view
          }}
        />

        {/* Instructions FAQ card */}
        <View
          style={[
            styles.infoCard,
            { backgroundColor: Palette.surface, borderColor: Palette.border },
          ]}
        >
          <View style={styles.infoTitleRow}>
            <MaterialIcons name="info-outline" size={18} color={Palette.primary} />
            <Text style={[styles.infoCardTitle, { color: Palette.onSurface }]}>
              Important Usage Guide
            </Text>
          </View>
          <Text style={[styles.infoCardText, { color: Palette.onSurfaceMuted }]}>
            • <Text style={{ fontWeight: '700' }}>WAEC:</Text> Use the PIN & Serial on waecdirect.org to check your WASSCE results. Each PIN can be used up to 5 times for a single candidate.
          </Text>
          <Text style={[styles.infoCardText, { color: Palette.onSurfaceMuted }]}>
            • <Text style={{ fontWeight: '700' }}>NECO:</Text> Token is required on result.neco.gov.ng for SSCE, BECE & NCEE result verification.
          </Text>
          <Text style={[styles.infoCardText, { color: Palette.onSurfaceMuted }]}>
            • <Text style={{ fontWeight: '700' }}>JAMB:</Text> Generated e-PIN must be presented at any accredited JAMB CBT registration center with candidate profile code.
          </Text>
        </View>
      </ScrollView>
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
  headerTitleBox: {
    flex: 1,
    marginLeft: Spacing.three,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Typography.family,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: Typography.family,
    marginTop: 1,
  },
  headerRightSpacer: {
    width: 36,
  },
  scrollContent: {
    padding: Spacing.four,
    gap: Spacing.four,
    paddingBottom: Spacing.six + 20,
  },
  trustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Rounded.xl,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  trustIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTextBox: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
  trustDesc: {
    fontSize: 11,
    fontFamily: Typography.family,
    marginTop: 2,
    lineHeight: 15,
  },
  infoCard: {
    borderWidth: 1,
    borderRadius: Rounded.xl,
    padding: Spacing.four,
    gap: 8,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  infoCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
  infoCardText: {
    fontSize: 12,
    fontFamily: Typography.family,
    lineHeight: 18,
  },
});
