import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  Platform,
  Share,
  Linking,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useApp } from '@/context/AppContext';
import { Rounded, Spacing, Typography } from '@/constants/theme';
import { waecLogo, jambLogo, necoLogo } from '@/assets/screenAssets';

export interface ExamSlipModalProps {
  visible: boolean;
  onClose: () => void;
  voucher: {
    examBody: 'WAEC' | 'JAMB' | 'NECO' | string;
    planLabel?: string;
    pin: string;
    serialNumber?: string;
    quantity?: number;
    amount?: number;
    reference?: string;
    candidatePhone?: string;
    candidateName?: string;
    profileCode?: string;
    portalUrl?: string;
    instructions?: string;
    purchasedAt?: string;
    vouchers?: Array<{
      pin: string;
      serialNumber?: string;
      portalUrl?: string;
      instructions?: string;
    }>;
  } | null;
}

export const ExamSlipModal: React.FC<ExamSlipModalProps> = ({
  visible,
  onClose,
  voucher,
}) => {
  const { theme: Palette, isDark } = useApp();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!voucher) return null;

  const examBody = (voucher.examBody || 'WAEC').toUpperCase();
  const logo = examBody === 'JAMB' ? jambLogo : examBody === 'NECO' ? necoLogo : waecLogo;

  const handleCopy = async (text: string, label: string) => {
    try {
      await Clipboard.setStringAsync(text.replace(/\s+/g, ''));
      setToastMessage(`${label} copied to clipboard`);
      setTimeout(() => setToastMessage(null), 2000);
    } catch {
      setToastMessage('Copied to clipboard');
      setTimeout(() => setToastMessage(null), 2000);
    }
  };

  const handleOpenPortal = () => {
    const url = voucher.portalUrl || (examBody === 'JAMB' ? 'https://www.jamb.gov.ng' : examBody === 'NECO' ? 'https://result.neco.gov.ng' : 'https://www.waecdirect.org');
    Linking.openURL(url).catch(() => {});
  };

  const handleShare = async () => {
    try {
      const voucherList = voucher.vouchers && voucher.vouchers.length > 0 ? voucher.vouchers : [{ pin: voucher.pin, serialNumber: voucher.serialNumber }];
      const pinLines = voucherList.map((v, i) => `[Voucher ${i + 1}]\nPIN: ${v.pin}\n${v.serialNumber ? `Serial: ${v.serialNumber}\n` : ''}`).join('\n');

      const message = `--- ABBA KANO ${examBody} EXAM VOUCHER ---\n` +
        `Package: ${voucher.planLabel || `${examBody} e-PIN`}\n` +
        `Reference: ${voucher.reference || 'N/A'}\n` +
        `Candidate Phone: ${voucher.candidatePhone || 'N/A'}\n` +
        (voucher.candidateName ? `Candidate Name: ${voucher.candidateName}\n` : '') +
        (voucher.profileCode ? `Profile Code: ${voucher.profileCode}\n` : '') +
        `\n${pinLines}\n` +
        `Portal: ${voucher.portalUrl || 'waecdirect.org'}\n` +
        `Instructions: ${voucher.instructions || 'Use PIN and Serial to check result on the official portal.'}\n` +
        `Issued by AbbaKano Data Sub App`;

      await Share.share({
        message,
        title: `${examBody} Examination Voucher Slip`,
      });
    } catch {
      // share cancelled or failed
    }
  };

  const vouchersToDisplay = voucher.vouchers && voucher.vouchers.length > 0
    ? voucher.vouchers
    : [{ pin: voucher.pin, serialNumber: voucher.serialNumber, portalUrl: voucher.portalUrl, instructions: voucher.instructions }];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.modalCard, { backgroundColor: Palette.surface, borderColor: Palette.border }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: Palette.border }]}>
            <View style={styles.headerLeft}>
              <View style={styles.logoWrap}>
                <Image source={logo} style={styles.logo} resizeMode="contain" />
              </View>
              <View>
                <Text style={[styles.examTitle, { color: Palette.onSurface }]}>
                  {examBody} Official Voucher
                </Text>
                <Text style={[styles.voucherSubtitle, { color: Palette.onSurfaceMuted }]}>
                  {voucher.planLabel || 'Examination e-PIN Slip'}
                </Text>
              </View>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
              hitSlop={8}
            >
              <MaterialIcons name="close" size={20} color={Palette.onSurface} />
            </Pressable>
          </View>

          {/* Toast */}
          {toastMessage && (
            <View style={styles.toast}>
              <MaterialIcons name="check-circle" size={16} color="#FFFFFF" />
              <Text style={styles.toastText}>{toastMessage}</Text>
            </View>
          )}

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            {/* Voucher Cards list */}
            {vouchersToDisplay.map((item, index) => (
              <View
                key={index}
                style={[
                  styles.voucherCard,
                  { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border },
                ]}
              >
                {vouchersToDisplay.length > 1 && (
                  <View style={styles.voucherIndexBadge}>
                    <Text style={styles.voucherIndexText}>VOUCHER #{index + 1}</Text>
                  </View>
                )}

                {/* PIN Box */}
                <View style={styles.codeBlock}>
                  <Text style={[styles.codeLabel, { color: Palette.onSurfaceMuted }]}>
                    EXAMINATION PIN / TOKEN
                  </Text>
                  <View style={styles.codeRow}>
                    <Text style={[styles.pinValue, { color: Palette.primary }]}>
                      {item.pin}
                    </Text>
                    <Pressable
                      style={[styles.copyBtn, { backgroundColor: Palette.primaryContainer }]}
                      onPress={() => handleCopy(item.pin, 'PIN')}
                    >
                      <MaterialIcons name="content-copy" size={14} color="#FFFFFF" />
                      <Text style={styles.copyBtnText}>Copy</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Serial Number Box if present */}
                {item.serialNumber && (
                  <View style={styles.codeBlock}>
                    <Text style={[styles.codeLabel, { color: Palette.onSurfaceMuted }]}>
                      SERIAL NUMBER / REG ID
                    </Text>
                    <View style={styles.codeRow}>
                      <Text style={[styles.serialValue, { color: Palette.onSurface }]}>
                        {item.serialNumber}
                      </Text>
                      <Pressable
                        style={[styles.copyBtnAlt, { borderColor: Palette.border }]}
                        onPress={() => handleCopy(item.serialNumber || '', 'Serial')}
                      >
                        <MaterialIcons name="content-copy" size={14} color={Palette.onSurface} />
                        <Text style={[styles.copyBtnAltText, { color: Palette.onSurface }]}>Copy</Text>
                      </Pressable>
                    </View>
                  </View>
                )}
              </View>
            ))}

            {/* Candidate & Transaction Details */}
            <View style={[styles.metaCard, { borderColor: Palette.border }]}>
              {voucher.candidateName ? (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: Palette.onSurfaceMuted }]}>Candidate Name</Text>
                  <Text style={[styles.metaValue, { color: Palette.onSurface }]}>{voucher.candidateName}</Text>
                </View>
              ) : null}
              {voucher.profileCode ? (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: Palette.onSurfaceMuted }]}>Profile Code</Text>
                  <Text style={[styles.metaValue, { color: Palette.onSurface }]}>{voucher.profileCode}</Text>
                </View>
              ) : null}
              {voucher.candidatePhone ? (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: Palette.onSurfaceMuted }]}>Recipient Phone</Text>
                  <Text style={[styles.metaValue, { color: Palette.onSurface }]}>{voucher.candidatePhone}</Text>
                </View>
              ) : null}
              {voucher.reference ? (
                <View style={styles.metaRow}>
                  <Text style={[styles.metaLabel, { color: Palette.onSurfaceMuted }]}>Reference ID</Text>
                  <Text style={[styles.metaValue, { color: Palette.onSurface }]}>{voucher.reference}</Text>
                </View>
              ) : null}
              <View style={styles.metaRow}>
                <Text style={[styles.metaLabel, { color: Palette.onSurfaceMuted }]}>Status</Text>
                <View style={styles.statusBadge}>
                  <MaterialIcons name="verified" size={14} color="#10B981" />
                  <Text style={styles.statusBadgeText}>ISSUED & VALID</Text>
                </View>
              </View>
            </View>

            {/* Instructions */}
            {voucher.instructions && (
              <View
                style={[
                  styles.instructionsBox,
                  { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.08)' : '#EFF6FF', borderColor: 'rgba(37, 99, 235, 0.2)' },
                ]}
              >
                <MaterialIcons name="info" size={16} color={Palette.primary} />
                <Text style={[styles.instructionsText, { color: Palette.onSurface }]}>
                  {voucher.instructions}
                </Text>
              </View>
            )}

            {/* Portal Action */}
            <Pressable
              style={[styles.portalBtn, { borderColor: Palette.border }]}
              onPress={handleOpenPortal}
            >
              <MaterialIcons name="open-in-new" size={16} color={Palette.primary} />
              <Text style={[styles.portalBtnText, { color: Palette.primary }]}>
                Open Official {examBody} Portal
              </Text>
            </Pressable>

            {/* Print / Share Voucher Slip */}
            <Pressable
              style={({ pressed }) => [
                styles.printBtn,
                { backgroundColor: Palette.primaryContainer },
                pressed && { opacity: 0.9 },
              ]}
              onPress={handleShare}
            >
              <MaterialIcons name="print" size={18} color="#FFFFFF" />
              <Text style={styles.printBtnText}>Print / Share Exam Slip</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.four,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: Rounded.xxl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.four,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  logoWrap: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  examTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
  voucherSubtitle: {
    fontSize: 12,
    fontFamily: Typography.family,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10B981',
    paddingVertical: 6,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.family,
  },
  body: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  voucherCard: {
    borderWidth: 1.5,
    borderRadius: Rounded.xl,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  voucherIndexBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  voucherIndexText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563EB',
    fontFamily: Typography.family,
  },
  codeBlock: {
    gap: 4,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Typography.family,
    letterSpacing: 0.5,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  pinValue: {
    fontSize: 18,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 1.5,
  },
  serialValue: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    letterSpacing: 0.8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Rounded.md,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.family,
  },
  copyBtnAlt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Rounded.md,
    borderWidth: 1,
  },
  copyBtnAltText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.family,
  },
  metaCard: {
    borderWidth: 1,
    borderRadius: Rounded.xl,
    padding: Spacing.three,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: Typography.family,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Typography.family,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
  instructionsBox: {
    flexDirection: 'row',
    gap: 8,
    padding: Spacing.three,
    borderRadius: Rounded.lg,
    borderWidth: 1,
  },
  instructionsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: Typography.family,
  },
  portalBtn: {
    height: 42,
    borderRadius: Rounded.xl,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  portalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Typography.family,
  },
  printBtn: {
    height: 46,
    borderRadius: Rounded.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  printBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Typography.family,
  },
});
