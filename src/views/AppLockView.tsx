import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Vibration,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, MaterialIcons } from '@expo/vector-icons';
import { PaletteType, Rounded, Spacing, Typography } from '@/constants/theme';
import { useApp } from '@/context/AppContext';
import { useAuth } from '@/context/AuthContext';
import { Numpad } from '@/components/common/Numpad';
import {
  authenticateBiometric,
  isBiometricAvailable,
  isBiometricsEnabled,
  verifyAppLockPin,
} from '@/services/biometricService';

interface AppLockViewProps {
  onUnlock: () => void;
  onSignOut?: () => void;
}

export const AppLockView: React.FC<AppLockViewProps> = ({ onUnlock, onSignOut }) => {
  const { theme: Palette, isDark } = useApp();
  const { user } = useAuth();
  const styles = useMemo(() => getStyles(Palette, isDark), [Palette, isDark]);

  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasBiometrics, setHasBiometrics] = useState(false);

  // Shake animation for incorrect PIN
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  const triggerShake = useCallback(() => {
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 50, 50, 50]);
    }
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  // Check biometric capability
  useEffect(() => {
    let mounted = true;
    void (async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricsEnabled();
      if (mounted) {
        setHasBiometrics(available && enabled);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Handle Biometric Unlock
  const handleBiometricUnlock = useCallback(async () => {
    setErrorMsg(null);
    try {
      await authenticateBiometric('Unlock AbbaKano');
      onUnlock();
    } catch {
      // User cancelled or biometric failed; keep keypad open
    }
  }, [onUnlock]);

  // Auto-prompt biometric upon mount if supported
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    void (async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricsEnabled();
      if (available && enabled) {
        timer = setTimeout(() => {
          void handleBiometricUnlock();
        }, 350);
      }
    })();
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [handleBiometricUnlock]);

  // Handle Keypad Press
  const handleKeyPress = async (val: string) => {
    if (isVerifying || enteredPin.length >= 4) return;
    const nextPin = enteredPin + val;
    setEnteredPin(nextPin);
    setErrorMsg(null);

    if (nextPin.length === 4) {
      setIsVerifying(true);
      setTimeout(async () => {
        try {
          const res = await verifyAppLockPin(nextPin);
          if (res.success) {
            onUnlock();
            return;
          }

          // Incorrect PIN
          triggerShake();
          setErrorMsg(res.message || 'Incorrect PIN. Please try again.');
          setEnteredPin('');
        } catch {
          triggerShake();
          setErrorMsg('Could not verify PIN. Please try again.');
          setEnteredPin('');
        } finally {
          setIsVerifying(false);
        }
      }, 150);
    }
  };

  const handleBackspace = () => {
    if (isVerifying) return;
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const displayName = user?.fullName || user?.name || user?.phone || 'Account Holder';

  return (
    <View style={styles.container}>
      {/* Background Ambience */}
      <View style={styles.content}>
        {/* Lock Shield Icon & Header */}
        <View style={styles.header}>
          <View style={styles.shieldGlow}>
            <View style={styles.shieldBox}>
              <MaterialCommunityIcons
                name="shield-lock-outline"
                size={38}
                color={Palette.primary}
              />
            </View>
          </View>

          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={styles.instructionText}>
            Enter your 4-digit PIN or use fingerprint to unlock
          </Text>
        </View>

        {/* PIN Dots Display with Shake Animation */}
        <Animated.View
          style={[
            styles.pinDotsRow,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {Array.from({ length: 4 }).map((_, i) => {
            const isFilled = i < enteredPin.length;
            return (
              <View
                key={i}
                style={[
                  styles.pinDot,
                  isFilled ? styles.pinDotFilled : styles.pinDotEmpty,
                  errorMsg ? styles.pinDotError : null,
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Error Feedback */}
        {errorMsg ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle-outline" size={15} color={Palette.error} />
            <Text style={styles.errorText} numberOfLines={2}>{errorMsg}</Text>
          </View>
        ) : (
          <View style={styles.errorSpacer} />
        )}

        {/* Tactile Keypad */}
        <View style={styles.numpadWrapper}>
          <Numpad
            enteredPin={enteredPin}
            onKeyPress={handleKeyPress}
            onBackspace={handleBackspace}
            onBiometricPress={handleBiometricUnlock}
            showPinDots={false}
          />
        </View>

        {/* Footer Actions: Switch Account / Sign In with Password */}
        <View style={styles.footer}>
          {hasBiometrics && (
            <Pressable
              style={({ pressed }) => [styles.bioPromptBtn, pressed && styles.btnPressed]}
              onPress={handleBiometricUnlock}
            >
              <MaterialCommunityIcons name="fingerprint" size={20} color={Palette.primary} />
              <Text style={styles.bioPromptText}>Use Biometrics</Text>
            </Pressable>
          )}

          {onSignOut && (
            <Pressable
              style={({ pressed }) => [styles.signOutBtn, pressed && styles.btnPressed]}
              onPress={onSignOut}
            >
              <MaterialIcons name="logout" size={15} color={Palette.onSurfaceMuted} />
              <Text style={styles.signOutText}>Switch Account or Sign Out</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
};

const getStyles = (Palette: PaletteType, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Palette.canvas,
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: Spacing.four,
      paddingTop: Spacing.six,
      paddingBottom: Spacing.four,
    },
    header: {
      alignItems: 'center',
      marginTop: Spacing.two,
    },
    shieldGlow: {
      width: 76,
      height: 76,
      borderRadius: 38,
      backgroundColor: isDark ? 'rgba(238, 152, 0, 0.12)' : 'rgba(238, 152, 0, 0.16)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: Spacing.three,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(238, 152, 0, 0.25)' : 'rgba(238, 152, 0, 0.35)',
    },
    shieldBox: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: Palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: Palette.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
    welcomeText: {
      fontSize: 13,
      fontWeight: '600',
      color: Palette.onSurfaceMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    userName: {
      fontSize: 22,
      fontWeight: '800',
      color: Palette.onSurface,
      fontFamily: Typography.family,
      marginBottom: 6,
      textAlign: 'center',
    },
    instructionText: {
      fontSize: 12.5,
      color: Palette.onSurfaceVariant,
      textAlign: 'center',
      fontFamily: Typography.family,
      maxWidth: 280,
    },
    pinDotsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 18,
      marginVertical: Spacing.two,
      height: 32,
    },
    pinDot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      borderWidth: 1.5,
    },
    pinDotEmpty: {
      borderColor: Palette.borderHigh,
      backgroundColor: 'transparent',
    },
    pinDotFilled: {
      borderColor: Palette.primary,
      backgroundColor: Palette.primary,
      shadowColor: Palette.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.4,
      shadowRadius: 4,
      elevation: 3,
    },
    pinDotError: {
      borderColor: Palette.error,
      backgroundColor: Palette.error,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(239, 68, 68, 0.12)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: Rounded.md,
      minHeight: 28,
      maxWidth: 320,
    },
    errorText: {
      fontSize: 12,
      color: Palette.error,
      fontWeight: '600',
      flex: 1,
      lineHeight: 16,
    },
    errorSpacer: {
      height: 28,
    },
    numpadWrapper: {
      width: '100%',
      maxWidth: 340,
    },
    footer: {
      alignItems: 'center',
      gap: Spacing.two,
      marginBottom: Spacing.two,
    },
    bioPromptBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: Rounded.full,
      backgroundColor: Palette.surfaceHigh,
    },
    bioPromptText: {
      fontSize: 13,
      fontWeight: '700',
      color: Palette.primary,
    },
    signOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 12,
    },
    signOutText: {
      fontSize: 12,
      fontWeight: '600',
      color: Palette.onSurfaceMuted,
    },
    btnPressed: {
      opacity: 0.7,
    },
  });
