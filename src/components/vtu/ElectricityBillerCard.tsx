import React, { useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { PaletteType, Rounded, Spacing } from '@/constants/theme';
import { FormInput } from '@/components/common/FormInput';
import { Button } from '@/components/common/Button';
import { useCheckout } from '@/context/CheckoutContext';
import { useApp } from '@/context/AppContext';
import { supabase, extractFunctionError } from '@/lib/supabase';

const ELECTRICITY_DISCOS = [
  { id: 'aedc', code: 'AEDC', name: 'Abuja Electricity' },
  { id: 'ikedc', code: 'IKEDC', name: 'Ikeja Electric' },
  { id: 'jed', code: 'JED', name: 'Jos Electricity' },
  { id: 'kedco', code: 'KEDCO', name: 'Kano Electricity' },
  { id: 'phed', code: 'PHED', name: 'Port Harcourt Electric' },
] as const;
type ElectricityDisco = (typeof ELECTRICITY_DISCOS)[number];

export const ElectricityBillerCard: React.FC = () => {
  const { theme: Palette } = useApp();
  const styles = useMemo(() => getStyles(Palette), [Palette]);
  const [selectedDisCo, setSelectedDisCo] = useState<ElectricityDisco>(ELECTRICITY_DISCOS[0]);
  const [meterType, setMeterType] = useState<'PREPAID' | 'POSTPAID'>('PREPAID');
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('5000');
  const [verifiedCustomer, setVerifiedCustomer] = useState<string | null>(null);
  const [planToken, setPlanToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { startCheckout, paymentSuccessCount } = useCheckout();

  const clearInputs = () => {
    setMeterNumber('');
    setVerifiedCustomer(null);
    setPlanToken(null);
    setErrorMessage(null);
    setAmount('5000');
  };

  const prevCountRef = useRef(paymentSuccessCount);
  useEffect(() => {
    if (paymentSuccessCount > prevCountRef.current) {
      prevCountRef.current = paymentSuccessCount;
      clearInputs();
    }
  }, [paymentSuccessCount]);

  useEffect(() => {
    const rawMeter = meterNumber.replace(/\D/g, '');
    if (rawMeter.length < 10) {
      setVerifiedCustomer(null);
      setPlanToken(null);
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setErrorMessage(null);

    void (async () => {
      try {
        const { data, error } = await supabase.functions.invoke<{
          customerName?: string;
          selectionToken?: string;
          message?: string;
        }>('electricity-services', {
          body: {
            action: 'verify-meter',
            provider: selectedDisCo.code,
            meterNumber: rawMeter,
          },
        });

        if (cancelled) return;

        if (error) {
          const readable = await extractFunctionError(error, 'Could not verify electricity meter.');
          setVerifiedCustomer(null);
          setPlanToken(null);
          setErrorMessage(readable);
          return;
        }

        if (data?.customerName) {
          setVerifiedCustomer(data.customerName);
          setPlanToken(data.selectionToken || null);
          setErrorMessage(null);
        } else {
          setVerifiedCustomer(null);
          setPlanToken(null);
          setErrorMessage(data?.message || 'DisCo did not return customer details for this meter.');
        }
      } catch (err: any) {
        if (!cancelled) {
          setVerifiedCustomer(null);
          setPlanToken(null);
          setErrorMessage(err?.message || 'Network error verifying electricity meter.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [meterNumber, selectedDisCo.code]);

  const presetAmounts = ['1000', '2000', '3000', '5000', '10000', '20000'];

  const handlePay = () => {
    const numAmount = parseInt(amount, 10);
    const rawMeter = meterNumber.replace(/\D/g, '');
    if (isNaN(numAmount) || numAmount < 500) return;
    if (rawMeter.length < 10) return;
    if (!verifiedCustomer || !planToken) return;

    startCheckout({
      type: 'ELECTRICITY',
      title: `${selectedDisCo.name} ${meterType}`,
      serviceName: `${selectedDisCo.name} Electricity Token`,
      recipient: rawMeter,
      amount: numAmount,
      fee: 0,
      billerName: selectedDisCo.code,
      network: selectedDisCo.code as any,
      meterNumber: rawMeter,
      meterType: meterType.toLowerCase(),
      planToken,
      units: `${(numAmount / 72.5).toFixed(1)} kWh`,
      onSuccess: clearInputs,
    });
  };

  return (
    <View style={styles.container}>
      {/* DisCo Selector */}
      <Text style={styles.sectionTitle}>SELECT ELECTRICITY DISTRIBUTION COMPANY (DISCO)</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.discoRow}
      >
        {ELECTRICITY_DISCOS.map((disco) => {
          const isSelected = disco.id === selectedDisCo.id;
          return (
            <Pressable
              key={disco.id}
              style={[styles.discoChip, isSelected && styles.discoChipSelected]}
              onPress={() => setSelectedDisCo(disco)}
            >
              <MaterialCommunityIcons
                name="lightning-bolt"
                size={16}
                color={isSelected ? Palette.primary : Palette.onSurfaceMuted}
              />
              <Text style={[styles.discoText, isSelected && styles.discoTextSelected]}>
                {disco.code}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Meter Type Segmented Control */}
      <View style={styles.meterTypeContainer}>
        {(['PREPAID', 'POSTPAID'] as const).map((type) => {
          const isSelected = meterType === type;
          return (
            <Pressable
              key={type}
              style={[styles.meterTypeBtn, isSelected && styles.meterTypeBtnActive]}
              onPress={() => setMeterType(type)}
            >
              <Text
                style={[styles.meterTypeText, isSelected && styles.meterTypeTextActive]}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.75}
              >
                {type === 'PREPAID' ? 'Prepaid (Token Code)' : 'Postpaid (Bill Payment)'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Meter Number Input */}
      <FormInput
        label="Meter / Account Number"
        placeholder="Enter 10 to 14 digit meter number"
        value={meterNumber}
        onChangeText={setMeterNumber}
        keyboardType="numeric"
        maxLength={14}
        leftIcon={<MaterialCommunityIcons name="counter" size={18} color={Palette.onSurfaceMuted} />}
      />

      {/* Loading Verification State */}
      {loading && (
        <View style={styles.verifyingBox}>
          <ActivityIndicator size="small" color={Palette.primary} />
          <Text style={styles.verifyingText}>Verifying meter with {selectedDisCo.name}...</Text>
        </View>
      )}

      {/* Verified Customer Card preview */}
      {verifiedCustomer && !loading && (
        <View style={styles.verifiedBox}>
          <Ionicons name="checkmark-circle" size={18} color={Palette.tertiary} />
          <View style={styles.verifiedInfo}>
            <Text style={styles.verifiedLabel}>Verified Account Name</Text>
            <Text style={styles.verifiedName}>{verifiedCustomer}</Text>
          </View>
        </View>
      )}

      {/* Error Message Card */}
      {errorMessage && !loading && (
        <View style={styles.errorBox}>
          <Ionicons name="alert-circle" size={18} color={Palette.error} />
          <View style={styles.errorInfo}>
            <Text style={styles.errorLabel}>Verification Failed</Text>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        </View>
      )}

      {/* Manual Amount Input */}
      <FormInput
        label="RECHARGE AMOUNT (₦)"
        placeholder="Enter amount (min ₦500)"
        value={amount}
        onChangeText={(text) => {
          setAmount(text.replace(/\D/g, ''));
          if (errorMessage && errorMessage.includes('₦500')) setErrorMessage(null);
        }}
        keyboardType="numeric"
        leftIcon={<MaterialCommunityIcons name="cash" size={18} color={Palette.onSurfaceMuted} />}
        maxLength={7}
      />

      {/* Quick Amount Preset Chips */}
      <Text style={[styles.sectionTitle, { marginTop: -Spacing.one, marginBottom: Spacing.two }]}>
        QUICK PRESET AMOUNTS
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.amountChipsRow}
      >
        {presetAmounts.map((p) => {
          const isSelected = amount === p;
          return (
            <Pressable
              key={p}
              style={[styles.amountChip, isSelected && styles.amountChipSelected]}
              onPress={() => setAmount(p)}
            >
              <Text
                style={[styles.amountChipText, isSelected && styles.amountChipTextSelected]}
              >
                ₦{parseInt(p, 10).toLocaleString()}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Button
        title={
          loading
            ? 'Verifying meter details...'
            : verifiedCustomer
            ? (amount && parseInt(amount, 10) >= 500
                ? `Purchase ₦${parseInt(amount, 10).toLocaleString()} Electricity Token`
                : 'Enter Recharge Amount (Min ₦500)')
            : 'Enter Valid Meter to Continue'
        }
        onPress={handlePay}
        disabled={
          meterNumber.replace(/\D/g, '').length < 10 ||
          !amount ||
          parseInt(amount, 10) < 500 ||
          !verifiedCustomer ||
          !planToken ||
          loading
        }
        variant="primary"
        style={{ marginTop: Spacing.four }}
      />
    </View>
  );
};

const getStyles = (Palette: PaletteType) => StyleSheet.create({
  container: {
    marginBottom: Spacing.four,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Palette.onSurfaceMuted,
    letterSpacing: 0.8,
    marginBottom: Spacing.two,
  },
  discoRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginBottom: Spacing.four,
    paddingBottom: 2,
  },
  discoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Rounded.md,
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  discoChipSelected: {
    borderColor: Palette.primary,
    backgroundColor: 'rgba(77, 142, 255, 0.12)',
  },
  discoText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.onSurfaceVariant,
  },
  discoTextSelected: {
    color: Palette.primaryLight,
    fontWeight: '800',
  },
  meterTypeContainer: {
    flexDirection: 'row',
    backgroundColor: Palette.surfaceLow,
    borderRadius: Rounded.lg,
    padding: 3,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  meterTypeBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Rounded.md,
  },
  meterTypeBtnActive: {
    backgroundColor: Palette.surface,
    borderWidth: 1,
    borderColor: Palette.border,
    elevation: 2,
  },
  meterTypeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.onSurfaceMuted,
  },
  meterTypeTextActive: {
    color: Palette.primary,
    fontWeight: '800',
  },
  verifyingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoAndHalf,
    backgroundColor: 'rgba(77, 142, 255, 0.08)',
    borderRadius: Rounded.md,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(77, 142, 255, 0.2)',
  },
  verifyingText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.primaryLight,
  },
  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoAndHalf,
    backgroundColor: 'rgba(0, 208, 132, 0.1)',
    borderRadius: Rounded.md,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(0, 208, 132, 0.25)',
  },
  verifiedInfo: {
    flex: 1,
  },
  verifiedLabel: {
    fontSize: 10,
    color: Palette.onSurfaceMuted,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  verifiedName: {
    fontSize: 12,
    fontWeight: '700',
    color: Palette.tertiary,
    marginTop: 2,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.twoAndHalf,
    backgroundColor: 'rgba(255, 68, 68, 0.08)',
    borderRadius: Rounded.md,
    padding: Spacing.three,
    marginBottom: Spacing.four,
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.25)',
  },
  errorInfo: {
    flex: 1,
  },
  errorLabel: {
    fontSize: 10,
    color: Palette.error,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    color: Palette.onSurface,
    marginTop: 2,
  },
  amountChipsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingBottom: Spacing.two,
  },
  amountChip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: 8,
    borderRadius: Rounded.md,
    backgroundColor: Palette.surfaceLow,
    borderWidth: 1,
    borderColor: Palette.border,
  },
  amountChipSelected: {
    borderColor: Palette.primary,
    backgroundColor: Palette.surfaceHigh,
  },
  amountChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.onSurface,
  },
  amountChipTextSelected: {
    color: Palette.primaryLight,
    fontWeight: '800',
  },
});
