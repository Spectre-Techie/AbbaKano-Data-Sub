import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { PaletteType, Rounded, Spacing } from '@/constants/theme';
import { useCheckout } from '@/context/CheckoutContext';
import { useApp } from '@/context/AppContext';
import { Numpad } from '@/components/common/Numpad';

export const PinAuthModal: React.FC = () => {
  const {
    isPinModalOpen,
    cancelPin,
    verifyPinAndExecute,
    verifyBiometricAndExecute,
    draft,
    purchaseError,
    isProcessing,
  } = useCheckout();
  const { theme: Palette } = useApp();
  const styles = useMemo(() => getStyles(Palette), [Palette]);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const isBusy = isVerifying || isProcessing;

  useEffect(() => {
    if (isPinModalOpen) {
      setPin('');
      setErrorMsg(null);
      setIsVerifying(false);
    }
  }, [isPinModalOpen]);

  if (!draft) return null;

  const handleKeyPress = (val: string) => {
    if (isBusy || pin.length >= 4) return;
    const nextPin = pin + val;
    setPin(nextPin);
    setErrorMsg(null);

    // Auto-submit upon 4th digit
    if (nextPin.length === 4) {
      setIsVerifying(true);
      setTimeout(async () => {
        try {
          const res = await verifyPinAndExecute(nextPin);
          if (!res.success) {
            setErrorMsg(res.error || purchaseError || 'Invalid transaction PIN. Please try again.');
            setPin('');
          }
        } catch (err: any) {
          setErrorMsg(err?.message || 'Could not process transaction.');
          setPin('');
        } finally {
          setIsVerifying(false);
        }
      }, 100);
    }
  };

  const handleBackspace = () => {
    if (isBusy) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const handleBiometric = async () => {
    if (isBusy) return;
    setIsVerifying(true);
    setErrorMsg(null);
    try {
      const res = await verifyBiometricAndExecute();
      if (res.success) {
        cancelPin();
      } else {
        setErrorMsg(res.error || 'Biometric authorization was not completed.');
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal
      visible={isPinModalOpen}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!isBusy) cancelPin();
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.shieldIconBox, isBusy && styles.shieldIconBoxBusy]}>
              {isBusy ? (
                <ActivityIndicator size="small" color={Palette.primary} />
              ) : (
                <MaterialCommunityIcons name="shield-lock" size={24} color={Palette.primaryLight} />
              )}
            </View>
            <Text style={styles.title}>
              {isBusy ? 'Processing Payment...' : 'Authorize Payment'}
            </Text>
            <Text style={styles.subtitle}>
              {isBusy
                ? 'Communicating with telecom network securely. Please do not close the app.'
                : `Enter your 4-digit transaction PIN to confirm ₦${draft.amount.toLocaleString()} for ${draft.title}`}
            </Text>
          </View>

          {isBusy && (
            <View style={styles.processingBanner}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.processingText}>Securing & Processing Transaction...</Text>
            </View>
          )}

          {errorMsg && !isBusy && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={16} color={Palette.error} />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Tactile Keypad */}
          <Numpad
            enteredPin={pin}
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onBiometricPress={handleBiometric}
            showPinDots={true}
            disabled={isBusy}
          />

          {/* Cancel button */}
          <Pressable
            style={[styles.cancelBtn, isBusy && { opacity: 0.3 }]}
            onPress={() => {
              if (!isBusy) cancelPin();
            }}
            disabled={isBusy}
            hitSlop={8}
          >
            <Text style={styles.cancelBtnText}>
              {isBusy ? 'Please wait...' : 'Cancel Transaction'}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const getStyles = (Palette: PaletteType) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Palette.surface,
    borderRadius: Rounded.xxl,
    padding: Spacing.five,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Palette.borderHigh,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  shieldIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
    borderWidth: 1,
    borderColor: Palette.borderHigh,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Palette.onSurface,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: Palette.onSurfaceMuted,
    textAlign: 'center',
    paddingHorizontal: Spacing.two,
    lineHeight: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: Spacing.three,
    paddingVertical: 6,
    borderRadius: Rounded.md,
    marginVertical: Spacing.two,
  },
  errorText: {
    fontSize: 11,
    color: Palette.error,
    fontWeight: '600',
  },
  shieldIconBoxBusy: {
    borderColor: Palette.primary,
    backgroundColor: `${Palette.primary}18`,
  },
  processingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Palette.primary,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.two,
    borderRadius: Rounded.lg,
    marginVertical: Spacing.two,
  },
  processingText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBtn: {
    marginTop: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.four,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Palette.onSurfaceMuted,
  },
});
