import { PaletteType, Rounded, Spacing, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export interface FundWalletModalProps {
  visible?: boolean;
  onClose?: () => void;
  onBackPress?: () => void;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  visible = true,
  onClose,
  onBackPress,
}) => {
  const { virtualAccounts, user, refreshData, theme: Palette, generateVirtualAccountsWithNin } = useApp();
  const styles = useMemo(() => getStyles(Palette), [Palette]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // NIN submission state
  const [ninInput, setNinInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [ninError, setNinError] = useState<string | null>(null);
  const [reloading, setReloading] = useState(false);

  const handleClose = onClose || onBackPress || (() => {});

  const cleanNin = ninInput.replace(/\D/g, '').slice(0, 11);
  const isNinValid = cleanNin.length === 11;

  const handleGenerateAccounts = async () => {
    if (!isNinValid) {
      setNinError('Please enter a valid 11-digit NIN.');
      return;
    }
    setGenerating(true);
    setNinError(null);
    try {
      const res = await generateVirtualAccountsWithNin(cleanNin);
      if (res.success) {
        setToastMessage('Virtual Accounts Ready!');
        setTimeout(() => setToastMessage(null), 2500);
      } else {
        setNinError(res.error || 'Account generation failed. Please verify your NIN.');
      }
    } catch (err: any) {
      setNinError(err?.message || 'Network error while generating accounts. Please retry.');
    } finally {
      setGenerating(false);
    }
  };

  const handleReload = async () => {
    setReloading(true);
    setNinError(null);
    try {
      await refreshData(true);
    } finally {
      setReloading(false);
    }
  };

  const handleCopy = async (accountNumber: string, bankName: string) => {
    try {
      await Clipboard.setStringAsync(accountNumber.replace(/\s/g, ''));
      const shortBank = bankName.replace(/bank/i, '').trim();
      const message = shortBank ? `${shortBank} Copied to Clipboard` : 'Copied to Clipboard';
      setToastMessage(message);
      setTimeout(() => {
        setToastMessage(null);
      }, 2000);
    } catch {
      setToastMessage('Copied to Clipboard');
      setTimeout(() => {
        setToastMessage(null);
      }, 2000);
    }
  };

  const userDisplayName = (user?.fullName || user?.name || 'Customer').trim();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoid}
        >
          <View style={styles.modalCard}>
            {/* Toast Notification Pill */}
            {toastMessage && (
              <View style={styles.toast}>
                <MaterialIcons name="check-circle" size={16} color={Palette.tertiary} />
                <Text style={styles.toastText}>{toastMessage}</Text>
              </View>
            )}

            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1, marginRight: Spacing.two }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  Fund Wallet
                </Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>
                  Dedicated Virtual Accounts
                </Text>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && { opacity: 0.75 },
                ]}
                onPress={handleClose}
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
              >
                <MaterialIcons name="close" size={20} color={Palette.onSurface} />
              </Pressable>
            </View>

            {/* Section description */}
            <Text style={styles.sectionNotice}>
              {virtualAccounts.length > 0
                ? 'Transfer to any account below. Your wallet is automatically credited in 15–30 seconds.'
                : 'Central Bank of Nigeria (CBN) regulations mandate identity verification before generating automated virtual accounts.'}
            </Text>

            {/* Accounts List OR NIN Verification View */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {virtualAccounts.length > 0 ? (
                virtualAccounts.map((account, idx) => {
                  const cleanAccountNumber = account.accountNumber.replace(/\s/g, '');
                  const beneficiaryName =
                    account.accountName || `AbbaKano - ${userDisplayName} (${account.bankName})`;

                  return (
                    <View
                      key={`${account.bankName}-${account.accountNumber}-${idx}`}
                      style={styles.accountCard}
                    >
                      {/* Bank Header Row */}
                      <View style={styles.accountCardTop}>
                        <View style={styles.bankInfoLeft}>
                          <View style={styles.bankIconBox}>
                            <MaterialIcons
                              name="account-balance"
                              size={18}
                              color={Palette.primary}
                            />
                          </View>
                          <Text style={styles.bankName} numberOfLines={1}>
                            {account.bankName.toUpperCase()}
                          </Text>
                        </View>

                        <View style={styles.autoCreditBadge}>
                          <View style={styles.autoCreditDot} />
                          <Text style={styles.autoCreditText}>Auto-Credit</Text>
                        </View>
                      </View>

                      {/* Account Number Box */}
                      <View style={styles.accountNumberBox}>
                        <Text style={styles.accountNumberLabel}>Account Number</Text>
                        <View style={styles.accountNumberRow}>
                          <Text
                            style={styles.accountNumber}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                          >
                            {account.accountNumber}
                          </Text>
                          <Pressable
                            style={({ pressed }) => [
                              styles.copyBtn,
                              pressed && { opacity: 0.75 },
                            ]}
                            onPress={() => void handleCopy(cleanAccountNumber, account.bankName)}
                            accessibilityRole="button"
                            accessibilityLabel={`Copy ${account.bankName} account number`}
                          >
                            <MaterialIcons
                              name="content-copy"
                              size={15}
                              color={Palette.primary}
                            />
                            <Text style={styles.copyBtnText}>Copy</Text>
                          </Pressable>
                        </View>
                      </View>

                      {/* Beneficiary Name Row */}
                      <View style={styles.beneficiaryRow}>
                        <Text style={styles.beneficiaryLabel} numberOfLines={1}>
                          Beneficiary Name
                        </Text>
                        <Text style={styles.beneficiaryValue} numberOfLines={2}>
                          {beneficiaryName}
                        </Text>
                      </View>
                    </View>
                  );
                })
              ) : (
                /* NIN Identification Prompt Card */
                <View style={styles.ninCard}>
                  {/* Regulatory Badge */}
                  <View style={styles.cbnBadge}>
                    <MaterialIcons name="verified-user" size={14} color={Palette.primary} />
                    <Text style={styles.cbnBadgeText}>CBN & FG Regulatory Compliance</Text>
                  </View>

                  <Text style={styles.ninHeading}>National Identity Verification</Text>
                  <Text style={styles.ninDescription}>
                    To create your personal dedicated bank accounts (Monnify Live), please provide your 11-digit NIN. Accounts will be generated immediately.
                  </Text>

                  {/* NIN Input Field */}
                  <View style={styles.ninInputWrapper}>
                    <View style={styles.ninInputHeader}>
                      <Text style={styles.ninInputLabel}>11-Digit NIN Number</Text>
                      <Text
                        style={[
                          styles.ninCounter,
                          isNinValid && { color: Palette.tertiary, fontWeight: '700' },
                        ]}
                      >
                        {cleanNin.length} / 11
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.inputContainer,
                        isNinValid && styles.inputContainerValid,
                        ninError ? styles.inputContainerError : null,
                      ]}
                    >
                      <MaterialIcons
                        name="badge"
                        size={20}
                        color={isNinValid ? Palette.tertiary : Palette.onSurfaceMuted}
                      />
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter your 11-digit NIN"
                        placeholderTextColor={Palette.onSurfaceMuted}
                        keyboardType="numeric"
                        maxLength={11}
                        value={cleanNin}
                        onChangeText={(txt) => {
                          setNinInput(txt);
                          if (ninError) setNinError(null);
                        }}
                        editable={!generating}
                      />
                      {isNinValid && (
                        <MaterialIcons name="check-circle" size={18} color={Palette.tertiary} />
                      )}
                    </View>
                  </View>

                  {/* Error Notification */}
                  {ninError && (
                    <View style={styles.errorBox}>
                      <MaterialIcons name="error-outline" size={16} color="#EF4444" />
                      <Text style={styles.errorText}>{ninError}</Text>
                    </View>
                  )}

                  {/* Generate Button */}
                  <Pressable
                    style={({ pressed }) => [
                      styles.generateBtn,
                      !isNinValid && styles.generateBtnDisabled,
                      pressed && isNinValid && { opacity: 0.85 },
                    ]}
                    onPress={handleGenerateAccounts}
                    disabled={!isNinValid || generating}
                  >
                    {generating ? (
                      <View style={styles.btnRow}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.generateBtnText}>Generating Accounts...</Text>
                      </View>
                    ) : (
                      <View style={styles.btnRow}>
                        <MaterialIcons name="bolt" size={18} color="#FFFFFF" />
                        <Text style={styles.generateBtnText}>Generate Virtual Accounts</Text>
                      </View>
                    )}
                  </Pressable>

                  {/* Security Guarantee */}
                  <View style={styles.securityRow}>
                    <MaterialIcons name="lock" size={13} color={Palette.onSurfaceMuted} />
                    <Text style={styles.securityText}>
                      Your NIN is transmitted securely and encrypted under NDPR data compliance standards.
                    </Text>
                  </View>

                  {/* Fallback Check */}
                  <Pressable
                    style={styles.syncAgainBtn}
                    onPress={handleReload}
                    disabled={reloading}
                  >
                    {reloading ? (
                      <ActivityIndicator size="small" color={Palette.primary} />
                    ) : (
                      <Text style={styles.syncAgainText}>Already registered? Check for accounts</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

export const FundWalletView: React.FC<FundWalletModalProps> = (props) => {
  return <FundWalletModal {...props} />;
};

const getStyles = (Palette: PaletteType) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.72)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: Spacing.four,
    },
    keyboardAvoid: {
      width: '100%',
      maxWidth: 420,
      alignItems: 'center',
    },
    backdropPressable: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    modalCard: {
      width: '100%',
      maxWidth: 420,
      maxHeight: '85%',
      backgroundColor: Palette.surface,
      borderRadius: Rounded.xxl,
      borderWidth: 1,
      borderColor: Palette.border,
      padding: Spacing.four,
      overflow: 'hidden',
    },
    toast: {
      position: 'absolute',
      top: Spacing.three,
      alignSelf: 'center',
      zIndex: 99,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: Palette.surfaceHighest,
      borderWidth: 1,
      borderColor: Palette.borderHigh,
      paddingHorizontal: Spacing.three,
      paddingVertical: 7,
      borderRadius: Rounded.full,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
      elevation: 5,
    },
    toastText: {
      fontSize: 12,
      fontWeight: '700',
      color: Palette.onSurface,
      fontFamily: Typography.family,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: Spacing.two,
      borderBottomWidth: 1,
      borderBottomColor: Palette.border,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: Palette.onSurface,
      fontFamily: Typography.family,
      letterSpacing: 0.3,
    },
    modalSubtitle: {
      fontSize: 12,
      color: Palette.onSurfaceMuted,
      fontFamily: Typography.family,
      marginTop: 2,
    },
    closeButton: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: Palette.surfaceHigh,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Palette.border,
    },
    sectionNotice: {
      fontSize: 12,
      color: Palette.onSurfaceVariant,
      fontFamily: Typography.family,
      lineHeight: 18,
      marginTop: Spacing.three,
      marginBottom: Spacing.three,
    },
    scrollContent: {
      gap: Spacing.three,
      paddingBottom: Spacing.two,
    },
    accountCard: {
      backgroundColor: Palette.surfaceLow,
      borderRadius: Rounded.xl,
      padding: Spacing.three,
      borderWidth: 1,
      borderColor: Palette.border,
      gap: Spacing.two,
    },
    accountCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    bankInfoLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      flex: 1,
      marginRight: Spacing.two,
    },
    bankIconBox: {
      width: 32,
      height: 32,
      borderRadius: Rounded.lg,
      backgroundColor: Palette.surfaceHigh,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bankName: {
      fontSize: 14,
      fontWeight: '700',
      color: Palette.onSurface,
      fontFamily: Typography.family,
      letterSpacing: 0.5,
    },
    autoCreditBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(0, 208, 132, 0.12)',
      borderRadius: Rounded.full,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    autoCreditDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Palette.tertiary,
    },
    autoCreditText: {
      fontSize: 10,
      fontWeight: '700',
      color: Palette.tertiary,
      fontFamily: Typography.family,
    },
    accountNumberBox: {
      backgroundColor: Palette.surface,
      borderRadius: Rounded.lg,
      padding: Spacing.three,
      gap: 4,
      borderWidth: 1,
      borderColor: Palette.border,
    },
    accountNumberLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: Palette.onSurfaceMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      fontFamily: Typography.family,
    },
    accountNumberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    accountNumber: {
      fontSize: 22,
      fontWeight: '800',
      color: Palette.onSurface,
      letterSpacing: 2,
      fontFamily: Typography.family,
      flex: 1,
    },
    copyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: Palette.surfaceHigh,
      borderRadius: Rounded.lg,
      paddingHorizontal: Spacing.three,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: Palette.border,
    },
    copyBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: Palette.primary,
      fontFamily: Typography.family,
    },
    beneficiaryRow: {
      paddingHorizontal: 4,
      gap: 2,
    },
    beneficiaryLabel: {
      fontSize: 10,
      color: Palette.onSurfaceMuted,
      fontFamily: Typography.family,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    beneficiaryValue: {
      fontSize: 13,
      fontWeight: '700',
      color: Palette.onSurfaceVariant,
      fontFamily: Typography.family,
    },
    loadingContainer: {
      padding: Spacing.five,
      alignItems: 'center',
      justifyContent: 'center',
      gap: Spacing.two,
    },
    loadingTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: Palette.onSurface,
      fontFamily: Typography.family,
    },
    loadingSubtitle: {
      fontSize: 12,
      color: Palette.onSurfaceMuted,
      fontFamily: Typography.family,
      textAlign: 'center',
    },
    refreshBtn: {
      marginTop: 8,
      backgroundColor: Palette.primary,
      paddingHorizontal: Spacing.four,
      paddingVertical: Spacing.two,
      borderRadius: Rounded.lg,
    },
    refreshBtnText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700',
      fontFamily: Typography.family,
    },
    ninCard: {
      backgroundColor: Palette.surfaceLow,
      borderRadius: Rounded.xl,
      padding: Spacing.four,
      borderWidth: 1,
      borderColor: Palette.border,
      gap: Spacing.three,
    },
    cbnBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(59, 130, 246, 0.12)',
      paddingHorizontal: Spacing.three,
      paddingVertical: 5,
      borderRadius: Rounded.full,
      alignSelf: 'flex-start',
    },
    cbnBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: Palette.primary,
      fontFamily: Typography.family,
    },
    ninHeading: {
      fontSize: 15,
      fontWeight: '800',
      color: Palette.onSurface,
      fontFamily: Typography.family,
    },
    ninDescription: {
      fontSize: 12,
      color: Palette.onSurfaceVariant,
      fontFamily: Typography.family,
      lineHeight: 18,
    },
    ninInputWrapper: {
      gap: 6,
    },
    ninInputHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    ninInputLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: Palette.onSurfaceMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      fontFamily: Typography.family,
    },
    ninCounter: {
      fontSize: 11,
      color: Palette.onSurfaceMuted,
      fontFamily: Typography.family,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.two,
      backgroundColor: Palette.surface,
      borderWidth: 1.5,
      borderColor: Palette.border,
      borderRadius: Rounded.lg,
      paddingHorizontal: Spacing.three,
      height: 48,
    },
    inputContainerValid: {
      borderColor: Palette.tertiary,
    },
    inputContainerError: {
      borderColor: '#EF4444',
    },
    textInput: {
      flex: 1,
      fontSize: 16,
      fontWeight: '700',
      color: Palette.onSurface,
      fontFamily: Typography.family,
      letterSpacing: 1.5,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(239, 68, 68, 0.1)',
      padding: Spacing.two,
      borderRadius: Rounded.md,
      borderWidth: 1,
      borderColor: 'rgba(239, 68, 68, 0.25)',
    },
    errorText: {
      fontSize: 12,
      color: '#EF4444',
      fontFamily: Typography.family,
      flex: 1,
    },
    generateBtn: {
      backgroundColor: Palette.primary,
      borderRadius: Rounded.lg,
      paddingVertical: Spacing.three,
      alignItems: 'center',
      justifyContent: 'center',
    },
    generateBtnDisabled: {
      opacity: 0.45,
    },
    btnRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    generateBtnText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '800',
      fontFamily: Typography.family,
      letterSpacing: 0.3,
    },
    securityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      justifyContent: 'center',
    },
    securityText: {
      fontSize: 10,
      color: Palette.onSurfaceMuted,
      fontFamily: Typography.family,
      textAlign: 'center',
      flex: 1,
    },
    syncAgainBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
    },
    syncAgainText: {
      fontSize: 12,
      fontWeight: '600',
      color: Palette.primary,
      fontFamily: Typography.family,
      textDecorationLine: 'underline',
    },
  });
