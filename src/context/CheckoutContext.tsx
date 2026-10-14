import React, { createContext, useContext, useState, useCallback } from 'react';
import { TransactionRecord, TransactionType } from '@/constants/mockData';
import { TelcoNetworkId } from '@/constants/telco';
import { ApiError, createIdempotencyKey } from '@/lib/api';
import { supabase, extractFunctionError } from '@/lib/supabase';
import { useApp } from './AppContext';
import { authenticateBiometric, getBiometricTransactionPin } from '@/services/biometricService';

export interface CheckoutDraft {
  type: TransactionType;
  title: string;
  serviceName: string;
  network?: TelcoNetworkId;
  recipient: string;
  planName?: string;
  amount: number;
  fee: number;
  billerName?: string;
  units?: string;
  /** Backend-encoded plan token (from /vtu/plans or /vtu/service-plans) */
  planToken?: string;
  /** Meter / smartcard / decoder number for electricity & cable */
  meterNumber?: string;
  /** Electricity meter type (prepaid / postpaid) */
  meterType?: string;
  /** Unique idempotency key pinned to this specific checkout instance */
  idempotencyKey?: string;
  onSuccess?: () => void;
}

interface CheckoutContextType {
  isSheetOpen: boolean;
  isPinModalOpen: boolean;
  isReceiptOpen: boolean;
  isProcessing: boolean;
  paymentSuccessCount: number;
  draft: CheckoutDraft | null;
  activeReceipt: TransactionRecord | null;
  purchaseError: string | null;
  startCheckout: (draft: CheckoutDraft) => void;
  closeSheet: () => void;
  proceedToPin: () => void;
  cancelPin: () => void;
  verifyPinAndExecute: (pin: string) => Promise<{ success: boolean; error?: string }>;
  verifyBiometricAndExecute: () => Promise<{ success: boolean; error?: string }>;
  closeReceipt: () => void;
  quickRepeatLast: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { refreshData, setMainBalance } = useApp();
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [paymentSuccessCount, setPaymentSuccessCount] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const isExecutingRef = React.useRef(false);
  const [activeReceipt, setActiveReceipt] = useState<TransactionRecord | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const startCheckout = (newDraft: CheckoutDraft) => {
    const withIdempotency: CheckoutDraft = {
      ...newDraft,
      idempotencyKey: newDraft.idempotencyKey || createIdempotencyKey(),
    };
    setDraft(withIdempotency);
    setPurchaseError(null);
    setIsProcessing(false);
    isExecutingRef.current = false;
    setIsSheetOpen(true);
    setIsPinModalOpen(false);
    setIsReceiptOpen(false);
  };

  const closeSheet = () => {
    if (isExecutingRef.current) return;
    setIsSheetOpen(false);
  };

  const proceedToPin = () => {
    setIsSheetOpen(false);
    setIsPinModalOpen(true);
  };

  const cancelPin = () => {
    if (isExecutingRef.current) return; // Disallow cancelling while transaction in-flight
    setIsPinModalOpen(false);
  };

  const verifyPinAndExecute = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!draft || pin.length !== 4) return { success: false, error: 'Enter a valid 4-digit PIN.' };
    if (isExecutingRef.current) return { success: false, error: 'Transaction is already being processed.' };

    isExecutingRef.current = true;
    setIsProcessing(true);
    setPurchaseError(null);

    try {
      const typeToFunction: Record<TransactionType, string> = {
        DATA: 'data-purchase',
        AIRTIME: 'purchase-airtime',
        ELECTRICITY: 'electricity-purchase',
        CABLE_TV: 'cable-purchase',
        FUND_WALLET: 'data-purchase',
      };

      const functionName = typeToFunction[draft.type];
      if (!functionName || draft.type === 'FUND_WALLET') {
        throw new Error('Unsupported transaction type.');
      }

      const idempotencyKey = draft.idempotencyKey || createIdempotencyKey();

      // Build the body based on transaction type
      const body: Record<string, unknown> = {
        pin,
        phone: draft.recipient,
        amount: draft.amount,
        network: draft.network?.toUpperCase(),
        idempotencyKey,
        selectionToken: draft.planToken,
      };

      if (draft.planToken) body.planToken = draft.planToken;
      if (draft.meterNumber && draft.type === 'ELECTRICITY') body.meterNumber = draft.meterNumber;
      if (draft.meterNumber && draft.type === 'CABLE_TV') body.smartcardNumber = draft.meterNumber;
      if (draft.meterType) body.meterType = draft.meterType;
      if (draft.type === 'CABLE_TV' && draft.billerName) body.provider = draft.billerName;
      if (draft.type === 'ELECTRICITY' && draft.network) body.provider = draft.network;

      const { data: result, error } = await supabase.functions.invoke<{
        reference?: string;
        status?: string;
        token?: string;
        message?: string;
        balance_kobo?: number;
      }>(functionName, { body });

      if (error) {
        const readableMsg = await extractFunctionError(
          error,
          'Transaction could not be completed. Please check your PIN and wallet balance.',
        );
        throw new Error(readableMsg);
      }
      if (!result) {
        throw new Error('We could not confirm your purchase. Please check your transaction history.');
      }

      const txStatusMap: Record<string, 'SUCCESSFUL' | 'PENDING' | 'FAILED'> = {
        success: 'SUCCESSFUL',
        pending: 'PENDING',
        failed: 'FAILED',
      };

      const isSuccess = (result.status || 'success').toLowerCase() === 'success';

      const newTx: TransactionRecord = {
        id: result.reference || `tx-${Date.now()}`,
        reference: result.reference || `ABK-${Date.now()}`,
        type: draft.type,
        title: draft.title,
        description: `${draft.serviceName} to ${draft.recipient}`,
        amount: draft.amount,
        fee: draft.fee,
        status: txStatusMap[result.status || 'success'] || 'SUCCESSFUL',
        date: 'Just now',
        timestamp: Date.now(),
        network: draft.network,
        recipient: draft.recipient,
        billerName: draft.billerName,
        token: result.token,
        units: draft.units,
      };

      setActiveReceipt(newTx);
      setIsPinModalOpen(false);
      setIsReceiptOpen(true);
      setPaymentSuccessCount((prev) => prev + 1);

      // Instant UI balance update
      if (typeof result.balance_kobo === 'number') {
        setMainBalance(result.balance_kobo / 100);
      } else if (isSuccess) {
        setMainBalance((prev) => Math.max(0, prev - draft.amount));
      }

      // Refresh wallet balance & transactions in the background
      void refreshData();

      if (draft.onSuccess) {
        try { draft.onSuccess(); } catch {}
      }
      return { success: true };
    } catch (err: any) {
      let msg = 'Purchase failed. Please try again.';
      if (err instanceof ApiError) {
        msg = err.message;
      } else if (typeof err?.message === 'string' && err.message) {
        msg = err.message;
      } else {
        msg = await extractFunctionError(err, 'Purchase failed. Please verify your PIN and balance.');
      }
      setPurchaseError(msg);
      return { success: false, error: msg };
    } finally {
      isExecutingRef.current = false;
      setIsProcessing(false);
    }
  }, [draft, refreshData, setMainBalance]);

  const verifyBiometricAndExecute = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (isExecutingRef.current) return { success: false, error: 'Transaction is already being processed.' };
    try {
      await authenticateBiometric('Authorize this transaction');
      const pin = await getBiometricTransactionPin();
      if (!pin) {
        const msg = 'Set up your transaction PIN before using biometric authorization.';
        setPurchaseError(msg);
        return { success: false, error: msg };
      }
      return await verifyPinAndExecute(pin);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Biometric authorization was not completed.';
      setPurchaseError(msg);
      return { success: false, error: msg };
    }
  }, [verifyPinAndExecute]);

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    setDraft(null);
    setPurchaseError(null);
  };

  const quickRepeatLast = () => {
    if (activeReceipt) {
      setIsReceiptOpen(false);
      startCheckout({
        type: activeReceipt.type,
        title: activeReceipt.title,
        serviceName: activeReceipt.title,
        network: activeReceipt.network,
        recipient: activeReceipt.recipient,
        amount: activeReceipt.amount,
        fee: activeReceipt.fee,
        billerName: activeReceipt.billerName,
      });
    }
  };

  return (
    <CheckoutContext.Provider
      value={{
        isSheetOpen,
        isPinModalOpen,
        isReceiptOpen,
        isProcessing,
        paymentSuccessCount,
        draft,
        activeReceipt,
        purchaseError,
        startCheckout,
        closeSheet,
        proceedToPin,
        cancelPin,
        verifyPinAndExecute,
        verifyBiometricAndExecute,
        closeReceipt,
        quickRepeatLast,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
};

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (!context) throw new Error('useCheckout must be used within a CheckoutProvider');
  return context;
}
