import { PaletteType, Rounded, Spacing, Typography } from "@/constants/theme";
import { useApp } from "@/context/AppContext";
import { MaterialIcons } from "@expo/vector-icons";
import * as Clipboard from 'expo-clipboard';
import React, { useMemo, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
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
  const { virtualAccounts, user, refreshData, theme: Palette } = useApp();
  const styles = useMemo(() => getStyles(Palette), [Palette]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleClose = onClose || onBackPress || (() => {});

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

          <Text style={styles.sectionNotice}>
            Transfer to any account below. Your wallet is automatically credited in 15–30 seconds.
          </Text>

          {/* Accounts List */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
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
              <View style={styles.loadingContainer}>
                <MaterialIcons name="sync" size={28} color={Palette.primary} />
                <Text style={styles.loadingTitle}>Synchronizing Accounts</Text>
                <Text style={styles.loadingSubtitle}>
                  Loading your dedicated virtual bank accounts...
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.refreshBtn,
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => void refreshData(true)}
                >
                  <Text style={styles.refreshBtnText}>Reload Accounts</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
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
  });
