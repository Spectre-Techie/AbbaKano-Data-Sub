import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { useCheckout } from '@/context/CheckoutContext';
import { Rounded, Spacing, Typography } from '@/constants/theme';
import { supabase, extractFunctionError } from '@/lib/supabase';

interface EducationProduct {
  id: string;
  name: string;
  amount: number;
  selectionToken: string;
}

interface EducationExam {
  slug: string;
  name: string;
  products: EducationProduct[];
}

export interface EducationBillerCardProps {
  initialExamBody?: 'WAEC' | 'NECO';
  onSuccess?: () => void;
}

export const EducationBillerCard: React.FC<EducationBillerCardProps> = ({
  initialExamBody = 'WAEC',
  onSuccess,
}) => {
  const { theme: Palette, user, isDark } = useApp();
  const { startCheckout } = useCheckout();

  const [exams, setExams] = useState<EducationExam[]>([]);
  const [selectedExamSlug, setSelectedExamSlug] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<EducationProduct | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal Picker States
  const [pickerType, setPickerType] = useState<'exam' | 'package' | 'quantity' | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCatalog() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const { data, error } = await supabase.functions.invoke<{
          exams?: EducationExam[];
        }>('education-services', {
          body: { action: 'catalog' },
        });

        if (error) {
          const readable = await extractFunctionError(error, 'Could not load education services.');
          throw new Error(readable);
        }

        if (!cancelled && data?.exams && Array.isArray(data.exams)) {
          // Strictly exclude JAMB, keep only WAEC and NECO
          const filtered = data.exams.filter(
            (exam) =>
              !/jamb/i.test(`${exam.slug} ${exam.name}`) &&
              exam.products &&
              exam.products.length > 0,
          );

          setExams(filtered);

          if (filtered.length > 0) {
            // Find initial or first
            const matched =
              filtered.find((e) =>
                new RegExp(initialExamBody, 'i').test(`${e.slug} ${e.name}`),
              ) || filtered[0];

            setSelectedExamSlug(matched.slug);
            if (matched.products.length > 0) {
              setSelectedProduct(matched.products[0]);
            }
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message || 'Could not load education catalog.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [initialExamBody]);

  const selectedExam = useMemo(
    () => exams.find((e) => e.slug === selectedExamSlug),
    [exams, selectedExamSlug],
  );

  const availableProducts = useMemo(
    () => selectedExam?.products || [],
    [selectedExam],
  );

  const totalAmount = (selectedProduct?.amount || 0) * quantity;

  const handleSelectExam = (slug: string) => {
    setSelectedExamSlug(slug);
    const exam = exams.find((e) => e.slug === slug);
    if (exam && exam.products.length > 0) {
      setSelectedProduct(exam.products[0]);
    } else {
      setSelectedProduct(null);
    }
    setPickerType(null);
  };

  const handleSelectProduct = (product: EducationProduct) => {
    setSelectedProduct(product);
    setPickerType(null);
  };

  const handleSelectQuantity = (qty: number) => {
    setQuantity(qty);
    setPickerType(null);
  };

  const handlePay = () => {
    if (!selectedProduct) return;

    startCheckout({
      type: 'EDUCATION',
      title: selectedProduct.name,
      serviceName: selectedExam?.name || 'Education PIN',
      network: selectedExam?.name || 'WAEC',
      recipient: user?.phone || '',
      planName: selectedProduct.name,
      planId: selectedProduct.id,
      amount: totalAmount,
      fee: 0,
      planToken: selectedProduct.selectionToken,
      metadata: {
        quantity,
      },
      onSuccess,
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingCard, { borderColor: Palette.border }]}>
        <ActivityIndicator size="small" color={Palette.primary} />
      </View>
    );
  }

  if (errorMsg) {
    return (
      <View style={[styles.card, { borderColor: Palette.border }]}>
        <Text style={[styles.errorText, { color: Palette.error }]}>{errorMsg}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: Palette.surface, borderColor: Palette.border }]}>
      {/* 1. Exam Dropdown */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: Palette.onSurfaceMuted }]}>Exam</Text>
        <Pressable
          style={[styles.dropdown, { borderColor: Palette.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
          onPress={() => setPickerType('exam')}
        >
          <Text style={[styles.dropdownText, { color: Palette.onSurface }]}>
            {selectedExam?.name || 'Select Exam'}
          </Text>
          <MaterialIcons name="expand-more" size={20} color={Palette.onSurfaceMuted} />
        </Pressable>
      </View>

      {/* 2. Package Dropdown */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: Palette.onSurfaceMuted }]}>Package</Text>
        <Pressable
          style={[styles.dropdown, { borderColor: Palette.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
          onPress={() => setPickerType('package')}
        >
          <Text style={[styles.dropdownText, { color: Palette.onSurface }]} numberOfLines={1}>
            {selectedProduct ? `${selectedProduct.name} (₦${selectedProduct.amount.toLocaleString()})` : 'Select Package'}
          </Text>
          <MaterialIcons name="expand-more" size={20} color={Palette.onSurfaceMuted} />
        </Pressable>
      </View>

      {/* 3. Quantity Dropdown */}
      <View style={styles.fieldGroup}>
        <Text style={[styles.label, { color: Palette.onSurfaceMuted }]}>Quantity</Text>
        <Pressable
          style={[styles.dropdown, { borderColor: Palette.border, backgroundColor: isDark ? '#0F172A' : '#F8FAFC' }]}
          onPress={() => setPickerType('quantity')}
        >
          <Text style={[styles.dropdownText, { color: Palette.onSurface }]}>
            {quantity}
          </Text>
          <MaterialIcons name="expand-more" size={20} color={Palette.onSurfaceMuted} />
        </Pressable>
      </View>

      {/* Total & Action */}
      <View style={styles.bottomSection}>
        <View style={styles.totalRow}>
          <Text style={[styles.totalLabel, { color: Palette.onSurfaceMuted }]}>Total</Text>
          <Text style={[styles.totalAmount, { color: Palette.onSurface }]}>
            ₦{totalAmount.toLocaleString()}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: Palette.primaryContainer },
            pressed && { opacity: 0.88 },
          ]}
          onPress={handlePay}
          disabled={!selectedProduct}
        >
          <Text style={styles.submitBtnText}>Pay ₦{totalAmount.toLocaleString()}</Text>
        </Pressable>
      </View>

      {/* Selection Modal Sheet */}
      <Modal
        visible={pickerType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerType(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setPickerType(null)}>
          <View
            style={[
              styles.pickerSheet,
              { backgroundColor: Palette.surface, borderColor: Palette.border },
            ]}
          >
            <View style={[styles.pickerHeader, { borderBottomColor: Palette.border }]}>
              <Text style={[styles.pickerTitle, { color: Palette.onSurface }]}>
                {pickerType === 'exam' ? 'Select Exam' : pickerType === 'package' ? 'Select Package' : 'Select Quantity'}
              </Text>
              <Pressable onPress={() => setPickerType(null)} hitSlop={8}>
                <MaterialIcons name="close" size={20} color={Palette.onSurfaceMuted} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.pickerList}>
              {pickerType === 'exam' &&
                exams.map((item) => (
                  <Pressable
                    key={item.slug}
                    style={[
                      styles.pickerItem,
                      selectedExamSlug === item.slug && {
                        backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                      },
                    ]}
                    onPress={() => handleSelectExam(item.slug)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { color: selectedExamSlug === item.slug ? Palette.primary : Palette.onSurface },
                      ]}
                    >
                      {item.name}
                    </Text>
                    {selectedExamSlug === item.slug && (
                      <MaterialIcons name="check" size={18} color={Palette.primary} />
                    )}
                  </Pressable>
                ))}

              {pickerType === 'package' &&
                availableProducts.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[
                      styles.pickerItem,
                      selectedProduct?.id === item.id && {
                        backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                      },
                    ]}
                    onPress={() => handleSelectProduct(item)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.pickerItemText,
                          { color: selectedProduct?.id === item.id ? Palette.primary : Palette.onSurface },
                        ]}
                      >
                        {item.name}
                      </Text>
                      <Text style={[styles.pickerItemSub, { color: Palette.onSurfaceMuted }]}>
                        ₦{item.amount.toLocaleString()}
                      </Text>
                    </View>
                    {selectedProduct?.id === item.id && (
                      <MaterialIcons name="check" size={18} color={Palette.primary} />
                    )}
                  </Pressable>
                ))}

              {pickerType === 'quantity' &&
                [1, 2, 3, 4, 5].map((qty) => (
                  <Pressable
                    key={qty}
                    style={[
                      styles.pickerItem,
                      quantity === qty && {
                        backgroundColor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                      },
                    ]}
                    onPress={() => handleSelectQuantity(qty)}
                  >
                    <Text
                      style={[
                        styles.pickerItemText,
                        { color: quantity === qty ? Palette.primary : Palette.onSurface },
                      ]}
                    >
                      {qty}
                    </Text>
                    {quantity === qty && (
                      <MaterialIcons name="check" size={18} color={Palette.primary} />
                    )}
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Rounded.xl,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  loadingCard: {
    padding: Spacing.six,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.xl,
    borderWidth: 1,
  },
  errorText: {
    fontSize: 13,
    fontFamily: Typography.family,
    textAlign: 'center',
  },
  fieldGroup: {
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: Typography.family,
  },
  dropdown: {
    height: 48,
    borderRadius: Rounded.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.family,
    flex: 1,
    marginRight: 6,
  },
  bottomSection: {
    marginTop: Spacing.two,
    gap: Spacing.three,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: Typography.family,
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
  submitBtn: {
    height: 48,
    borderRadius: Rounded.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.family,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '60%',
    paddingBottom: Spacing.six,
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: Typography.family,
  },
  pickerList: {
    padding: Spacing.two,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.three,
    paddingVertical: 12,
    borderRadius: Rounded.md,
  },
  pickerItemText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: Typography.family,
  },
  pickerItemSub: {
    fontSize: 12,
    fontFamily: Typography.family,
    marginTop: 2,
  },
});
