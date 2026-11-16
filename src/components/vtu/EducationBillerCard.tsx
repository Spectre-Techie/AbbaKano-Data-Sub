import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useCheckout } from '@/context/CheckoutContext';
import { Rounded, Spacing, Typography } from '@/constants/theme';
import { waecLogo, jambLogo, necoLogo } from '@/assets/screenAssets';
import { supabase } from '@/lib/supabase';

type ExamBodyId = 'WAEC' | 'JAMB' | 'NECO';

interface EducationPlan {
  id: string;
  examBody: ExamBodyId;
  planCode: string;
  name: string;
  label: string;
  price: number;
  token?: string;
  portalUrl: string;
  description: string;
  instructions: string;
}

const FALLBACK_PLANS: Record<ExamBodyId, EducationPlan[]> = {
  WAEC: [
    {
      id: 'waec-result-checker',
      examBody: 'WAEC',
      planCode: 'waec-result-checker',
      name: 'WAEC Result Checker e-PIN',
      label: 'WAEC Result Checker e-PIN',
      price: 3800,
      portalUrl: 'https://www.waecdirect.org',
      description: 'Official PIN & Serial number to check WAEC May/June and GCE results.',
      instructions: 'Visit www.waecdirect.org, enter your 10-digit Exam No, select Year & Type, enter PIN and Serial number.',
    },
  ],
  NECO: [
    {
      id: 'neco-result-token',
      examBody: 'NECO',
      planCode: 'neco-result-token',
      name: 'NECO Result Token',
      label: 'NECO Result Token',
      price: 1350,
      portalUrl: 'https://result.neco.gov.ng',
      description: 'Official Token to check NECO SSCE Internal, External, BECE & NCEE results.',
      instructions: 'Visit result.neco.gov.ng, select Exam Year and Exam Type, enter your Token and Registration Number.',
    },
  ],
  JAMB: [
    {
      id: 'jamb-utme',
      examBody: 'JAMB',
      planCode: 'jamb-utme',
      name: 'JAMB UTME Registration e-PIN',
      label: 'JAMB UTME Registration e-PIN',
      price: 6200,
      portalUrl: 'https://www.jamb.gov.ng',
      description: 'Official JAMB UTME Registration profile e-PIN without Mock.',
      instructions: 'Provide your 10-digit Profile Code. Take this generated e-PIN to any accredited JAMB CBT centre.',
    },
    {
      id: 'jamb-mock',
      examBody: 'JAMB',
      planCode: 'jamb-mock',
      name: 'JAMB UTME with Mock e-PIN',
      label: 'JAMB UTME with Mock e-PIN',
      price: 7700,
      portalUrl: 'https://www.jamb.gov.ng',
      description: 'Official JAMB UTME + Mock Examination Registration profile e-PIN.',
      instructions: 'Provide your 10-digit Profile Code. Take this generated e-PIN to any accredited JAMB CBT centre for UTME + Mock registration.',
    },
    {
      id: 'jamb-direct-entry',
      examBody: 'JAMB',
      planCode: 'jamb-direct-entry',
      name: 'JAMB Direct Entry (DE) e-PIN',
      label: 'JAMB Direct Entry (DE) e-PIN',
      price: 6200,
      portalUrl: 'https://www.jamb.gov.ng',
      description: 'Official JAMB Direct Entry (DE) Registration profile e-PIN.',
      instructions: 'Provide your 10-digit Profile Code. Take this generated e-PIN to any accredited JAMB CBT centre to complete Direct Entry registration.',
    },
  ],
};

const EXAM_BODIES: { id: ExamBodyId; title: string; subtitle: string; logo: any }[] = [
  { id: 'WAEC', title: 'WAEC', subtitle: 'Result Checker', logo: waecLogo },
  { id: 'JAMB', title: 'JAMB', subtitle: 'UTME & DE Pin', logo: jambLogo },
  { id: 'NECO', title: 'NECO', subtitle: 'Result Token', logo: necoLogo },
];

export interface EducationBillerCardProps {
  initialExamBody?: ExamBodyId;
  onSuccess?: () => void;
}

export const EducationBillerCard: React.FC<EducationBillerCardProps> = ({
  initialExamBody = 'WAEC',
  onSuccess,
}) => {
  const { theme: Palette, user, isDark } = useApp();
  const { startCheckout } = useCheckout();

  const [selectedBody, setSelectedBody] = useState<ExamBodyId>(initialExamBody);
  const [plans, setPlans] = useState<EducationPlan[]>(FALLBACK_PLANS[initialExamBody]);
  const [selectedPlan, setSelectedPlan] = useState<EducationPlan>(FALLBACK_PLANS[initialExamBody][0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [candidatePhone, setCandidatePhone] = useState<string>(user?.phone || '');
  const [candidateName, setCandidateName] = useState<string>('');
  const [profileCode, setProfileCode] = useState<string>('');
  const [loadingPlans, setLoadingPlans] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Sync when initialExamBody changes
  useEffect(() => {
    setSelectedBody(initialExamBody);
  }, [initialExamBody]);

  // Fetch plans dynamically from education-services edge function
  useEffect(() => {
    let cancelled = false;
    const fetchServices = async () => {
      setLoadingPlans(true);
      try {
        const { data, error } = await supabase.functions.invoke('education-services', {
          body: { examBody: selectedBody },
        });

        if (!cancelled && !error && data?.services && Array.isArray(data.services) && data.services.length > 0) {
          setPlans(data.services);
          setSelectedPlan(data.services[0]);
        } else {
          // Use verified local plans
          const defaultList = FALLBACK_PLANS[selectedBody] || [];
          setPlans(defaultList);
          if (defaultList.length > 0) setSelectedPlan(defaultList[0]);
        }
      } catch {
        if (!cancelled) {
          const defaultList = FALLBACK_PLANS[selectedBody] || [];
          setPlans(defaultList);
          if (defaultList.length > 0) setSelectedPlan(defaultList[0]);
        }
      } finally {
        if (!cancelled) setLoadingPlans(false);
      }
    };

    void fetchServices();
    return () => {
      cancelled = true;
    };
  }, [selectedBody]);

  const totalAmount = (selectedPlan?.price || 0) * quantity;

  const handleBodyChange = (bodyId: ExamBodyId) => {
    setSelectedBody(bodyId);
    setFormError(null);
    setQuantity(1);
    const available = FALLBACK_PLANS[bodyId] || [];
    setPlans(available);
    if (available.length > 0) setSelectedPlan(available[0]);
  };

  const handleProceed = () => {
    setFormError(null);
    const cleanPhone = candidatePhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setFormError('Please enter a valid recipient phone number for e-PIN delivery.');
      return;
    }

    if (selectedBody === 'JAMB' && profileCode.trim().length < 8) {
      setFormError('Please enter the candidate 10-digit JAMB Profile Code.');
      return;
    }

    if (!selectedPlan) {
      setFormError('Please select an exam package to proceed.');
      return;
    }

    startCheckout({
      type: 'EDUCATION',
      title: `${selectedPlan.name}`,
      serviceName: `${selectedBody} Examination`,
      network: selectedBody,
      recipient: cleanPhone,
      planName: selectedPlan.label,
      planId: selectedPlan.planCode,
      amount: totalAmount,
      fee: 0,
      planToken: selectedPlan.token,
      metadata: {
        examBody: selectedBody,
        planCode: selectedPlan.planCode,
        quantity,
        candidateName: candidateName.trim(),
        profileCode: profileCode.trim(),
        portalUrl: selectedPlan.portalUrl,
        instructions: selectedPlan.instructions,
      },
      onSuccess,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: Palette.surface, borderColor: Palette.border }]}>
      {/* Exam Body Tabs */}
      <View style={styles.tabBar}>
        {EXAM_BODIES.map((item) => {
          const isSelected = selectedBody === item.id;
          return (
            <Pressable
              key={item.id}
              style={[
                styles.tabItem,
                {
                  borderColor: isSelected ? Palette.primary : Palette.border,
                  backgroundColor: isSelected
                    ? (isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF')
                    : (isDark ? '#0F172A' : '#F8FAFC'),
                },
              ]}
              onPress={() => handleBodyChange(item.id)}
            >
              <View style={styles.tabLogoBox}>
                <Image source={item.logo} style={styles.tabLogo} resizeMode="contain" />
              </View>
              <Text
                style={[
                  styles.tabTitle,
                  { color: isSelected ? Palette.primary : Palette.onSurface },
                ]}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.tabSubtitle,
                  { color: isSelected ? Palette.primary : Palette.onSurfaceMuted },
                ]}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Package Selection */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: Palette.onSurface }]}>Select Exam Package</Text>
        {loadingPlans ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={Palette.primary} />
            <Text style={[styles.loadingText, { color: Palette.onSurfaceMuted }]}>
              Loading verified {selectedBody} packages...
            </Text>
          </View>
        ) : (
          <View style={styles.plansList}>
            {plans.map((p) => {
              const isSelected = selectedPlan?.planCode === p.planCode;
              return (
                <Pressable
                  key={p.planCode}
                  style={[
                    styles.planCard,
                    {
                      borderColor: isSelected ? Palette.primary : Palette.border,
                      backgroundColor: isSelected
                        ? (isDark ? 'rgba(37, 99, 235, 0.12)' : '#F0F7FF')
                        : (isDark ? '#0F172A' : '#FFFFFF'),
                    },
                  ]}
                  onPress={() => setSelectedPlan(p)}
                >
                  <View style={styles.planInfo}>
                    <Text style={[styles.planTitle, { color: Palette.onSurface }]}>{p.name}</Text>
                    <Text style={[styles.planDesc, { color: Palette.onSurfaceMuted }]}>
                      {p.description}
                    </Text>
                  </View>
                  <View style={styles.priceColumn}>
                    <Text style={[styles.planPrice, { color: Palette.primary }]}>
                      ₦{p.price.toLocaleString()}
                    </Text>
                    <View
                      style={[
                        styles.radioCircle,
                        {
                          borderColor: isSelected ? Palette.primary : Palette.border,
                          backgroundColor: isSelected ? Palette.primary : 'transparent',
                        },
                      ]}
                    >
                      {isSelected && <View style={styles.radioDot} />}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Quantity Selector */}
      <View style={styles.section}>
        <View style={styles.quantityRow}>
          <View>
            <Text style={[styles.sectionLabel, { color: Palette.onSurface }]}>Number of e-PINs</Text>
            <Text style={[styles.quantitySubtitle, { color: Palette.onSurfaceMuted }]}>
              Buy up to 5 exam vouchers in one checkout
            </Text>
          </View>
          <View style={[styles.counterBox, { borderColor: Palette.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            <Pressable
              style={styles.counterBtn}
              onPress={() => setQuantity((prev) => Math.max(1, prev - 1))}
              disabled={quantity <= 1}
            >
              <MaterialIcons
                name="remove"
                size={18}
                color={quantity <= 1 ? Palette.border : Palette.onSurface}
              />
            </Pressable>
            <Text style={[styles.counterValue, { color: Palette.onSurface }]}>{quantity}</Text>
            <Pressable
              style={styles.counterBtn}
              onPress={() => setQuantity((prev) => Math.min(5, prev + 1))}
              disabled={quantity >= 5}
            >
              <MaterialIcons
                name="add"
                size={18}
                color={quantity >= 5 ? Palette.border : Palette.onSurface}
              />
            </Pressable>
          </View>
        </View>
      </View>

      {/* Candidate Details */}
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: Palette.onSurface }]}>Candidate Details</Text>

        {/* Profile Code for JAMB */}
        {selectedBody === 'JAMB' && (
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: Palette.onSurfaceMuted }]}>
              JAMB Profile Code (10 digits) *
            </Text>
            <View style={[styles.inputBox, { borderColor: Palette.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
              <MaterialIcons name="badge" size={20} color={Palette.onSurfaceMuted} />
              <TextInput
                style={[styles.input, { color: Palette.onSurface }]}
                placeholder="e.g. 5501928391"
                placeholderTextColor={Palette.onSurfaceMuted}
                keyboardType="numeric"
                maxLength={10}
                value={profileCode}
                onChangeText={setProfileCode}
              />
            </View>
          </View>
        )}

        {/* Candidate Phone */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: Palette.onSurfaceMuted }]}>
            Recipient Phone Number (For SMS & Records) *
          </Text>
          <View style={[styles.inputBox, { borderColor: Palette.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            <MaterialIcons name="phone" size={20} color={Palette.onSurfaceMuted} />
            <TextInput
              style={[styles.input, { color: Palette.onSurface }]}
              placeholder="e.g. 08012345678"
              placeholderTextColor={Palette.onSurfaceMuted}
              keyboardType="phone-pad"
              maxLength={11}
              value={candidatePhone}
              onChangeText={setCandidatePhone}
            />
          </View>
        </View>

        {/* Candidate Name (Optional) */}
        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: Palette.onSurfaceMuted }]}>
            Candidate Full Name (Optional)
          </Text>
          <View style={[styles.inputBox, { borderColor: Palette.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}>
            <MaterialIcons name="person" size={20} color={Palette.onSurfaceMuted} />
            <TextInput
              style={[styles.input, { color: Palette.onSurface }]}
              placeholder="e.g. Ibrahim Abubakar Kano"
              placeholderTextColor={Palette.onSurfaceMuted}
              value={candidateName}
              onChangeText={setCandidateName}
            />
          </View>
        </View>
      </View>

      {/* Error display */}
      {formError && (
        <View style={[styles.errorBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
          <MaterialIcons name="error-outline" size={18} color="#EF4444" />
          <Text style={styles.errorText}>{formError}</Text>
        </View>
      )}

      {/* Total & Action Button */}
      <View style={[styles.summaryCard, { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border }]}>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: Palette.onSurfaceMuted }]}>Package</Text>
          <Text style={[styles.summaryValue, { color: Palette.onSurface }]}>
            {selectedPlan?.name || selectedBody}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, { color: Palette.onSurfaceMuted }]}>Quantity</Text>
          <Text style={[styles.summaryValue, { color: Palette.onSurface }]}>
            {quantity} voucher{quantity > 1 ? 's' : ''}
          </Text>
        </View>
        <View style={[styles.summaryRow, styles.totalRow]}>
          <Text style={[styles.totalLabel, { color: Palette.onSurface }]}>Total Amount</Text>
          <Text style={[styles.totalValue, { color: Palette.primary }]}>
            ₦{totalAmount.toLocaleString()}
          </Text>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.actionBtn,
          { backgroundColor: Palette.primaryContainer },
          pressed && { opacity: 0.9 },
        ]}
        onPress={handleProceed}
      >
        <MaterialIcons name="lock" size={18} color="#FFFFFF" />
        <Text style={styles.actionBtnText}>
          Purchase {selectedBody} e-PIN • ₦{totalAmount.toLocaleString()}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: Rounded.xxl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.four,
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8,
  },
  tabItem: {
    flex: 1,
    paddingVertical: Spacing.three,
    paddingHorizontal: 6,
    borderRadius: Rounded.xl,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 4,
  },
  tabLogoBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tabLogo: {
    width: '100%',
    height: '100%',
  },
  tabTitle: {
    fontSize: 13,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
  tabSubtitle: {
    fontSize: 10,
    fontFamily: Typography.family,
  },
  section: {
    gap: Spacing.two,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.family,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: Spacing.three,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: Typography.family,
  },
  plansList: {
    gap: 8,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: Rounded.xl,
    borderWidth: 1.5,
  },
  planInfo: {
    flex: 1,
    paddingRight: 8,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.family,
  },
  planDesc: {
    fontSize: 11,
    fontFamily: Typography.family,
    marginTop: 2,
  },
  priceColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantitySubtitle: {
    fontSize: 11,
    fontFamily: Typography.family,
    marginTop: 2,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Rounded.lg,
    overflow: 'hidden',
  },
  counterBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    width: 32,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: Typography.family,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Rounded.lg,
    paddingHorizontal: Spacing.three,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: Typography.family,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.three,
    borderRadius: Rounded.lg,
  },
  errorText: {
    flex: 1,
    color: '#EF4444',
    fontSize: 12,
    fontFamily: Typography.family,
  },
  summaryCard: {
    borderWidth: 1,
    borderRadius: Rounded.xl,
    padding: Spacing.three,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: Typography.family,
  },
  summaryValue: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.family,
  },
  totalRow: {
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E2E8F0',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '900',
    fontFamily: Typography.family,
  },
  actionBtn: {
    height: 48,
    borderRadius: Rounded.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
});
