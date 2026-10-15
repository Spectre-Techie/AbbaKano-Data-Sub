import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Appearance } from 'react-native';
import {
  VirtualAccount,
  TransactionRecord,
  KycTierInfo,
  MOCK_KYC_TIERS,
  MOCK_VIRTUAL_ACCOUNTS,
} from '@/constants/mockData';
import { getPalette, setActiveThemeMode, PaletteType } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth, AuthUser } from './AuthContext';

export type ThemePreference = 'system' | 'dark' | 'light';

interface AppContextType {
  user: AuthUser;
  mainBalance: number;
  setMainBalance: React.Dispatch<React.SetStateAction<number>>;
  referralCommissionBalance: number;
  isBalanceMasked: boolean;
  toggleBalanceMask: () => void;
  virtualAccounts: VirtualAccount[];
  transactions: TransactionRecord[];
  kycTiers: KycTierInfo[];
  refreshData: () => Promise<void>;
  withdrawCommission: () => Promise<boolean>;
  updateKycTier: (tier: KycTierInfo | KycTierInfo['tier']) => void;
  unreadNotifications: number;
  clearNotifications: () => void;
  // Theme
  themePreference: ThemePreference;
  effectiveTheme: 'dark' | 'light';
  isDark: boolean;
  setThemePreference: (pref: ThemePreference) => void;
  cycleTheme: () => void;
  theme: PaletteType;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function mapServerTx(tx: any): TransactionRecord {
  const typeMap: Record<string, string> = {
    deposit: 'FUND_WALLET',
    data: 'DATA',
    airtime: 'AIRTIME',
    electricity: 'ELECTRICITY',
    cable_tv: 'CABLE_TV',
    commission: 'FUND_WALLET',
  };
  const rawStatus = String(tx.status || '').toLowerCase().trim();
  const txType = (typeMap[tx.type] || 'DATA') as any;
  const isDataTx = txType === 'DATA' || String(tx.transaction_type || '').toLowerCase() === 'data';

  let status: 'SUCCESSFUL' | 'PENDING' | 'FAILED' = 'PENDING';
  if (['success', 'successful', 'completed', 'delivered'].includes(rawStatus)) {
    status = 'SUCCESSFUL';
  } else if (['failed', 'rejected', 'reversed', 'cancelled'].includes(rawStatus)) {
    status = 'FAILED';
  } else if (rawStatus === 'processing' || rawStatus === 'pending') {
    const createdAtTime = tx.created_at ? new Date(tx.created_at).getTime() : 0;
    const isPastOneMinute = createdAtTime > 0 && (Date.now() - createdAtTime > 60_000);

    if (
      tx.provider_reference ||
      tx.provider_response?.status === true ||
      tx.provider_response?.status === 'success' ||
      (isDataTx && isPastOneMinute)
    ) {
      status = 'SUCCESSFUL';
    } else {
      status = 'PENDING';
    }
  }

  const rawRef = tx.reference ?? tx.id;
  const refString = rawRef != null ? String(rawRef) : `TX-${Date.now()}`;
  return {
    id: String(tx.id ?? refString),
    reference: refString,
    type: txType,
    title: String(tx.label || tx.type || 'Transaction'),
    description: String(tx.label || ''),
    amount: Number(tx.amount || 0),
    fee: 0,
    status,
    date: tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-NG') : 'Recently',
    timestamp: tx.created_at ? new Date(tx.created_at).getTime() : Date.now(),
    recipient: String(tx.recipient || tx.account_number || ''),
  };
}

function mapServerVirtualAccount(raw: any): VirtualAccount {
  return {
    bankName: raw.bankName || raw.bank_name || 'Bank',
    accountNumber: raw.accountNumber || raw.account_number || '',
    accountName: raw.accountName || raw.account_name || '',
    recommended: true,
  };
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const contextUser: AuthUser = user || { id: 'guest', name: 'Guest', phone: '', email: null, role: 'user' };

  const [mainBalance, setMainBalance] = useState<number>(0);
  const [referralCommissionBalance, setReferralCommissionBalance] = useState<number>(0);
  const [isBalanceMasked, setIsBalanceMasked] = useState<boolean>(false);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [virtualAccounts, setVirtualAccounts] = useState<VirtualAccount[]>(MOCK_VIRTUAL_ACCOUNTS);
  const [kycTiers, setKycTiers] = useState<KycTierInfo[]>(MOCK_KYC_TIERS);
  const [unreadNotifications, setUnreadNotifications] = useState<number>(0);

  // ── Theme State ──────────────────────────────────────────────────────────
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [systemScheme, setSystemScheme] = useState<'dark' | 'light'>(
    Appearance.getColorScheme() === 'light' ? 'light' : 'dark'
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'light' ? 'light' : 'dark');
    });
    return () => subscription.remove();
  }, []);

  const effectiveTheme: 'dark' | 'light' =
    themePreference === 'system' ? systemScheme : themePreference;
  setActiveThemeMode(effectiveTheme);
  const theme = getPalette(effectiveTheme);

  const cycleTheme = () => {
    setThemePreference((curr) => {
      if (curr === 'system') return 'dark';
      if (curr === 'dark') return 'light';
      return 'system';
    });
  };

  // ── Fetch live data from backend ─────────────────────────────────────────
  const refreshData = useCallback(async () => {
    if (!user) return;
    try {
      const [walletRes, txRes, depositRes, referralRes, resvRes] = await Promise.allSettled([
        supabase.from('wallets').select('balance_kobo').eq('user_id', user.id).maybeSingle(),
        supabase.from('vtu_transactions').select('id, transaction_type, amount_kobo, status, created_at, account_number, phone_number, network, provider_reference, provider_response, metadata').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.from('deposits').select('id, amount_kobo, status, created_at, reference').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100),
        supabase.functions.invoke('referral-services', { body: { action: 'summary' } }),
        supabase.from('wallet_reservations').select('amount_kobo').eq('user_id', user.id).eq('status', 'held'),
      ]);

      const ONE_HOUR_MS = 60 * 60 * 1000;
      const now = Date.now();

      const isPendingExpired = (status?: string, createdAt?: string | number) => {
        const s = String(status || '').toLowerCase();
        if (s !== 'pending') return false;
        if (!createdAt) return false;
        const time = typeof createdAt === 'number' ? createdAt : new Date(createdAt).getTime();
        return !isNaN(time) && now - time > ONE_HOUR_MS;
      };

      if (walletRes.status === 'fulfilled' && !walletRes.value.error) {
        const rawBalanceKobo = Number(walletRes.value.data?.balance_kobo || 0);
        let heldKobo = 0;
        if (resvRes.status === 'fulfilled' && !resvRes.value.error && Array.isArray(resvRes.value.data)) {
          heldKobo = resvRes.value.data.reduce((acc, row) => acc + Number(row.amount_kobo || 0), 0);
        }
        const availableKobo = Math.max(0, rawBalanceKobo - heldKobo);
        setMainBalance(availableKobo / 100);
      }
      if (txRes.status === 'fulfilled' && !txRes.value.error) {
        const vtuTransactions = (txRes.value.data || [])
          .filter((tx) => !isPendingExpired(tx.status, tx.created_at))
          .map((tx) => {
            const networkLabel = tx.network ? `${tx.network} ` : '';
            const typeLabel = String(tx.transaction_type || '').toUpperCase();
            return mapServerTx({
              ...tx,
              type: String(tx.transaction_type || '').toLowerCase(),
              amount: Number(tx.amount_kobo || 0) / 100,
              label: `${networkLabel}${typeLabel}`.trim() || tx.account_number || tx.transaction_type,
              recipient: tx.phone_number || tx.account_number || '',
              reference: tx.provider_reference || String(tx.id),
              network: tx.network,
              provider_response: tx.provider_response,
              metadata: tx.metadata,
            });
          });

        const rawDeposits = depositRes.status === 'fulfilled' && !depositRes.value.error
          ? (depositRes.value.data || [])
          : [];

        // Any pending deposit older than 1 hour is considered abandoned/cancelled and disappears from the UI
        const deposits = rawDeposits
          .filter((deposit) => !isPendingExpired(deposit.status, deposit.created_at))
          .map((deposit) => mapServerTx({
            ...deposit,
            type: 'deposit',
            amount: Number(deposit.amount_kobo || 0) / 100,
            label: deposit.reference ? `Deposit (${deposit.reference})` : 'Wallet funding',
            reference: deposit.reference || deposit.id,
          }));

        // Proactively update expired pending deposits to cancelled in Supabase
        const expiredDepositIds = rawDeposits
          .filter((d) => isPendingExpired(d.status, d.created_at))
          .map((d) => d.id);
        if (expiredDepositIds.length > 0) {
          supabase.from('deposits').update({ status: 'cancelled' }).in('id', expiredDepositIds).then(undefined, () => {});
        }

        setTransactions([...vtuTransactions, ...deposits].sort((a, b) => b.timestamp - a.timestamp));
      }
      if (referralRes.status === 'fulfilled' && !referralRes.value.error) {
        const referralData = referralRes.value.data as { referralCommissionBalance?: number } | null;
        setReferralCommissionBalance(Number(referralData?.referralCommissionBalance || 0));
      }
    } catch {
      // Keep previous state on error
    }
  }, [user]);

  // Refresh when user logs in/out
  useEffect(() => {
    if (user) {
      refreshData();
    } else {
      setMainBalance(0);
      setTransactions([]);
      setVirtualAccounts([]);
    }
  }, [user, refreshData]);

  // Realtime balance and transaction sync
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel(`realtime-user-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallets', filter: `user_id=eq.${user.id}` },
        () => {
          void refreshData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vtu_transactions', filter: `user_id=eq.${user.id}` },
        () => {
          void refreshData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'deposits', filter: `user_id=eq.${user.id}` },
        () => {
          void refreshData();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id, refreshData]);

  const toggleBalanceMask = () => setIsBalanceMasked((prev) => !prev);
  const clearNotifications = () => setUnreadNotifications(0);
  const withdrawCommission = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('referral-services', {
      body: { action: 'withdraw' },
    });
    if (error) return false;
    const result = data as { walletBalance?: number };
    setReferralCommissionBalance(0);
    if (typeof result?.walletBalance === 'number') setMainBalance(result.walletBalance);
    return true;
  }, []);
  const updateKycTier = useCallback((tier: KycTierInfo | KycTierInfo['tier']) => {
    setKycTiers((current) => typeof tier === 'string'
      ? current.map((item) => item.tier === tier ? { ...item, status: 'active' } : item)
      : current.map((item) => item.tier === tier.tier ? tier : item));
  }, []);

  return (
    <AppContext.Provider
      value={{
        user: contextUser,
        mainBalance,
        setMainBalance,
        referralCommissionBalance,
        isBalanceMasked,
        toggleBalanceMask,
        virtualAccounts,
        transactions,
        kycTiers,
        refreshData,
        withdrawCommission,
        updateKycTier,
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

export function useTheme() {
  return useApp().theme;
}
