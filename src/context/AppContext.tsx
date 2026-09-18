import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import {
  UserProfile,
  VirtualAccount,
  TransactionRecord,
  KycTierInfo,
  MOCK_USER,
  MOCK_VIRTUAL_ACCOUNTS,
  MOCK_TRANSACTIONS,
  MOCK_KYC_TIERS,
} from '@/constants/mockData';
import { getPalette, DarkPalette, setActiveThemeMode, PaletteType } from '@/constants/theme';

export type ThemePreference = 'system' | 'dark' | 'light';

interface AppContextType {
  user: UserProfile;
  mainBalance: number;
  referralCommissionBalance: number;
  isBalanceMasked: boolean;
  toggleBalanceMask: () => void;
  virtualAccounts: VirtualAccount[];
  transactions: TransactionRecord[];
  kycTiers: KycTierInfo[];
  addTransaction: (tx: Omit<TransactionRecord, 'id' | 'timestamp'>) => TransactionRecord;
  withdrawCommission: () => boolean;
  updateKycTier: (tier: 'Tier 1' | 'Tier 2' | 'Tier 3') => void;
  updateUserProfile: (profile: Partial<UserProfile>) => void;
  unreadNotifications: number;
  clearNotifications: () => void;
  // Theme
  themePreference: ThemePreference;
  effectiveTheme: 'dark' | 'light';
  isDark: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  cycleTheme: () => void;
  /** Live palette that updates on theme change — use this in JSX inline styles */
  theme: PaletteType;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(MOCK_USER);
  const [mainBalance, setMainBalance] = useState<number>(14850.0);
  const [referralCommissionBalance, setReferralCommissionBalance] = useState<number>(1200.0);
  const [isBalanceMasked, setIsBalanceMasked] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<TransactionRecord[]>(MOCK_TRANSACTIONS);
  const [kycTiers, setKycTiers] = useState<KycTierInfo[]>(MOCK_KYC_TIERS);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(3);

  // ── Theme State ──────────────────────────────────────────────────────────────
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<'dark' | 'light'>(
    Appearance.getColorScheme() === 'light' ? 'light' : 'dark'
  );

  // Listen to OS theme changes in real-time
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'light' ? 'light' : 'dark');
    });
    return () => subscription.remove();
  }, []);

  const effectiveTheme: 'dark' | 'light' =
    themePreference === 'system' ? systemScheme : themePreference;

  // Immediately sync active theme mode for Proxy and helper utilities
  setActiveThemeMode(effectiveTheme);

  /** Live palette object — re-computed on every effectiveTheme change */
  const theme = getPalette(effectiveTheme);

  const cycleTheme = () => {
    setThemePreference((curr) => {
      if (curr === 'system') return 'dark';
      if (curr === 'dark') return 'light';
      return 'system';
    });
  };

  // ── Wallet Logic ─────────────────────────────────────────────────────────────
  const toggleBalanceMask = () => setIsBalanceMasked((prev) => !prev);

  const addTransaction = (txData: Omit<TransactionRecord, 'id' | 'timestamp'>): TransactionRecord => {
    const newTx: TransactionRecord = {
      ...txData,
      id: `tx-${Date.now()}`,
      timestamp: Date.now(),
    };
    setTransactions((prev) => [newTx, ...prev]);
    if (newTx.type === 'FUND_WALLET') {
      setMainBalance((prev) => prev + newTx.amount);
    } else {
      setMainBalance((prev) => Math.max(0, prev - newTx.amount));
    }
    return newTx;
  };

  const withdrawCommission = (): boolean => {
    if (referralCommissionBalance <= 0) return false;
    const amount = referralCommissionBalance;
    const newTx: TransactionRecord = {
      id: `tx-${Date.now()}`,
      reference: `ABK-COMM-${Date.now().toString().slice(-6)}`,
      type: 'FUND_WALLET',
      title: 'Referral Commission Cashout',
      description: 'Transferred commission balance into main wallet',
      amount,
      fee: 0,
      status: 'SUCCESSFUL',
      date: 'Just now',
      timestamp: Date.now(),
      recipient: 'Main Wallet',
    };
    setTransactions((prev) => [newTx, ...prev]);
    setMainBalance((prev) => prev + amount);
    setReferralCommissionBalance(0);
    return true;
  };

  const updateKycTier = (tier: 'Tier 1' | 'Tier 2' | 'Tier 3') => {
    setUser((prev) => ({
      ...prev,
      kycTier: tier,
      tierLabel:
        tier === 'Tier 3'
          ? 'VIP Master Distributor'
          : tier === 'Tier 2'
          ? 'Tier 2 Verified Agent'
          : 'Basic Starter',
      agentDiscount: tier === 'Tier 3' ? 3.5 : tier === 'Tier 2' ? 2.5 : 1.0,
    }));
    setKycTiers((prev) => prev.map((t) => (t.tier === tier ? { ...t, status: 'active' } : t)));
  };

  const updateUserProfile = (profile: Partial<UserProfile>) => {
    setUser((prev) => {
      const updated = { ...prev, ...profile };
      if (profile.phone && !profile.referralCode) {
        // Referral code is now user's registered phone number
        const cleanPhone = profile.phone.replace(/[^0-9]/g, '');
        updated.referralCode = cleanPhone.startsWith('234') && cleanPhone.length > 10
          ? '0' + cleanPhone.slice(3)
          : cleanPhone;
      }
      return updated;
    });
  };

  const clearNotifications = () => setUnreadNotifications(0);

  return (
    <AppContext.Provider
      value={{
        user,
        mainBalance,
        referralCommissionBalance,
        isBalanceMasked,
        toggleBalanceMask,
        virtualAccounts: MOCK_VIRTUAL_ACCOUNTS,
        transactions,
        kycTiers,
        addTransaction,
        withdrawCommission,
        updateKycTier,
        updateUserProfile,
        unreadNotifications,
        clearNotifications,
        themePreference,
        effectiveTheme,
        isDark: effectiveTheme === 'dark',
        setThemePreference,
        cycleTheme,
        theme,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}

/**
 * Convenience hook: returns just the live theme palette.
 * Use this inside any component that needs dynamic colors.
 * Example: const T = useTheme();  <View style={{ backgroundColor: T.canvas }} />
 */
export function useTheme() {
  return useApp().theme;
}
