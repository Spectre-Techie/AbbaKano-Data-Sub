import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useApp } from '@/context/AppContext';
import { Rounded, Spacing, Typography } from '@/constants/theme';
import { waecLogo, jambLogo, necoLogo } from '@/assets/screenAssets';

export interface AllServicesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectService: (serviceKey: string, params?: { examBody?: string }) => void;
}

export const AllServicesModal: React.FC<AllServicesModalProps> = ({
  visible,
  onClose,
  onSelectService,
}) => {
  const { theme: Palette, isDark } = useApp();

  const handleSelect = (key: string, params?: { examBody?: string }) => {
    onClose();
    setTimeout(() => {
      onSelectService(key, params);
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: Palette.surface, borderColor: Palette.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: Palette.border }]}>
            <View>
              <Text style={[styles.title, { color: Palette.onSurface }]}>
                All Hub Services
              </Text>
              <Text style={[styles.subtitle, { color: Palette.onSurfaceMuted }]}>
                Select any digital utility or educational service
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1E293B' : '#F1F5F9' }]}
              hitSlop={8}
            >
              <MaterialIcons name="close" size={20} color={Palette.onSurface} />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Category: Telecommunications */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="wifi" size={16} color={Palette.primary} />
                <Text style={[styles.sectionTitle, { color: Palette.primary }]}>
                  Telecommunications
                </Text>
              </View>

              <View style={styles.itemsGrid}>
                <Pressable
                  style={[
                    styles.serviceItem,
                    { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border },
                  ]}
                  onPress={() => handleSelect('data')}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 99, 235, 0.12)' }]}>
                    <MaterialIcons name="cell-tower" size={24} color="#2563EB" />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemTitle, { color: Palette.onSurface }]}>Data Bundles</Text>
                    <Text style={[styles.itemDesc, { color: Palette.onSurfaceMuted }]}>
                      MTN, Airtel, Glo & 9mobile SME/Corp
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={Palette.onSurfaceMuted} />
                </Pressable>

                <Pressable
                  style={[
                    styles.serviceItem,
                    { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border },
                  ]}
                  onPress={() => handleSelect('airtime')}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <MaterialIcons name="phone-in-talk" size={24} color="#10B981" />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemTitle, { color: Palette.onSurface }]}>Airtime Top-Up</Text>
                    <Text style={[styles.itemDesc, { color: Palette.onSurfaceMuted }]}>
                      Instant top-up with up to 3% discount
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={Palette.onSurfaceMuted} />
                </Pressable>
              </View>
            </View>

            {/* Category: Bills & Utilities */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="bolt" size={16} color="#F59E0B" />
                <Text style={[styles.sectionTitle, { color: '#F59E0B' }]}>
                  Bills & Utilities
                </Text>
              </View>

              <View style={styles.itemsGrid}>
                <Pressable
                  style={[
                    styles.serviceItem,
                    { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border },
                  ]}
                  onPress={() => handleSelect('electricity')}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                    <MaterialIcons name="electric-meter" size={24} color="#F59E0B" />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemTitle, { color: Palette.onSurface }]}>Electricity Bills</Text>
                    <Text style={[styles.itemDesc, { color: Palette.onSurfaceMuted }]}>
                      KEDCO, AEDC, IKEDC, PHED & JED tokens
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={Palette.onSurfaceMuted} />
                </Pressable>

                <Pressable
                  style={[
                    styles.serviceItem,
                    { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border },
                  ]}
                  onPress={() => handleSelect('cable')}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                    <MaterialIcons name="live-tv" size={24} color="#A855F7" />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemTitle, { color: Palette.onSurface }]}>Cable TV</Text>
                    <Text style={[styles.itemDesc, { color: Palette.onSurfaceMuted }]}>
                      DSTV, GOTV & StarTimes activation
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={Palette.onSurfaceMuted} />
                </Pressable>
              </View>
            </View>

            {/* Category: Education & Examination */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="school" size={16} color="#0D9488" />
                <Text style={[styles.sectionTitle, { color: '#0D9488' }]}>
                  Education & Examination e-PINs
                </Text>
              </View>

              <View style={styles.itemsGrid}>
                <Pressable
                  style={[
                    styles.serviceItem,
                    { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border },
                  ]}
                  onPress={() => handleSelect('education', { examBody: 'WAEC' })}
                >
                  <View style={[styles.logoBox, { backgroundColor: '#FFFFFF' }]}>
                    <Image source={waecLogo} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemTitle, { color: Palette.onSurface }]}>WAEC Result Checker</Text>
                    <Text style={[styles.itemDesc, { color: Palette.onSurfaceMuted }]}>
                      Official PIN & Serial for WASSCE results
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={Palette.onSurfaceMuted} />
                </Pressable>

                <Pressable
                  style={[
                    styles.serviceItem,
                    { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border },
                  ]}
                  onPress={() => handleSelect('education', { examBody: 'JAMB' })}
                >
                  <View style={[styles.logoBox, { backgroundColor: '#FFFFFF' }]}>
                    <Image source={jambLogo} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemTitle, { color: Palette.onSurface }]}>JAMB e-PIN</Text>
                    <Text style={[styles.itemDesc, { color: Palette.onSurfaceMuted }]}>
                      UTME, Mock & Direct Entry profile codes
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={Palette.onSurfaceMuted} />
                </Pressable>

                <Pressable
                  style={[
                    styles.serviceItem,
                    { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border },
                  ]}
                  onPress={() => handleSelect('education', { examBody: 'NECO' })}
                >
                  <View style={[styles.logoBox, { backgroundColor: '#FFFFFF' }]}>
                    <Image source={necoLogo} style={styles.logoImage} resizeMode="contain" />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemTitle, { color: Palette.onSurface }]}>NECO Result Token</Text>
                    <Text style={[styles.itemDesc, { color: Palette.onSurfaceMuted }]}>
                      Instant token for SSCE, BECE & NCEE
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={Palette.onSurfaceMuted} />
                </Pressable>
              </View>
            </View>

            {/* Category: Wallet & Growth */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <MaterialIcons name="account-balance-wallet" size={16} color={Palette.secondary} />
                <Text style={[styles.sectionTitle, { color: Palette.secondary }]}>
                  Wallet & Growth
                </Text>
              </View>

              <View style={styles.itemsGrid}>
                <Pressable
                  style={[
                    styles.serviceItem,
                    { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border },
                  ]}
                  onPress={() => handleSelect('fund_wallet')}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
                    <MaterialIcons name="add-card" size={24} color="#059669" />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemTitle, { color: Palette.onSurface }]}>Fund Wallet</Text>
                    <Text style={[styles.itemDesc, { color: Palette.onSurfaceMuted }]}>
                      Dynamic accounts with PalmPay, Moniepoint & Wema
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={Palette.onSurfaceMuted} />
                </Pressable>

                <Pressable
                  style={[
                    styles.serviceItem,
                    { backgroundColor: isDark ? '#0F172A' : '#F8FAFC', borderColor: Palette.border },
                  ]}
                  onPress={() => handleSelect('refer_earn')}
                >
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(234, 88, 12, 0.12)' }]}>
                    <MaterialIcons name="card-giftcard" size={24} color="#EA580C" />
                  </View>
                  <View style={styles.itemTextCol}>
                    <Text style={[styles.itemTitle, { color: Palette.onSurface }]}>Refer & Earn</Text>
                    <Text style={[styles.itemDesc, { color: Palette.onSurfaceMuted }]}>
                      Invite friends and earn cashback commissions
                    </Text>
                  </View>
                  <MaterialIcons name="chevron-right" size={20} color={Palette.onSurfaceMuted} />
                </Pressable>
              </View>
            </View>
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
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheetContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: Typography.family,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: Typography.family,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six + (Platform.OS === 'ios' ? 20 : 0),
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: Typography.family,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  itemsGrid: {
    gap: Spacing.two,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.three,
    borderRadius: Rounded.xl,
    borderWidth: 1,
    gap: Spacing.three,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 44,
    height: 44,
    borderRadius: Rounded.lg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  itemTextCol: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: Typography.family,
  },
  itemDesc: {
    fontSize: 12,
    fontFamily: Typography.family,
    marginTop: 2,
  },
});
