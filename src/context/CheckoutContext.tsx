import React, { createContext, useContext, useState } from 'react';
import { TransactionRecord, TransactionType } from '@/constants/mockData';
import { TelcoNetworkId } from '@/constants/telco';
import { useApp } from './AppContext';

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
  onSuccess?: () => void;
}

interface CheckoutContextType {
  isSheetOpen: boolean;
  isPinModalOpen: boolean;
  isReceiptOpen: boolean;
  paymentSuccessCount: number;
  draft: CheckoutDraft | null;
  activeReceipt: TransactionRecord | null;
  startCheckout: (draft: CheckoutDraft) => void;
  closeSheet: () => void;
  proceedToPin: () => void;
  cancelPin: () => void;
  verifyPinAndExecute: (pin: string) => boolean;
  closeReceipt: () => void;
  quickRepeatLast: () => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export const CheckoutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { addTransaction, mainBalance } = useApp();
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);
  const [paymentSuccessCount, setPaymentSuccessCount] = useState(0);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<TransactionRecord | null>(null);

  const startCheckout = (newDraft: CheckoutDraft) => {
    setDraft(newDraft);
    setIsSheetOpen(true);
    setIsPinModalOpen(false);
    setIsReceiptOpen(false);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
  };

  const proceedToPin = () => {
    setIsSheetOpen(false);
    setIsPinModalOpen(true);
  };

  const cancelPin = () => {
    setIsPinModalOpen(false);
  };

  const verifyPinAndExecute = (pin: string): boolean => {
    if (!draft) return false;
    // Validate 4-digit PIN (allows any 4-digit entry in presentation mock)
    if (pin.length !== 4) return false;

    // Generate random mock token for electricity or WAEC if applicable
    let tokenCode: string | undefined = undefined;
    if (draft.type === 'ELECTRICITY') {
      const parts = Array.from({ length: 5 }, () => Math.floor(1000 + Math.random() * 9000));
      tokenCode = parts.join(' - ');
    }

    const ref = `ABK-${draft.type.slice(0, 3)}-${Date.now().toString().slice(-7)}`;
    const newTx = addTransaction({
      reference: ref,
      type: draft.type,
      title: draft.title,
      description: `${draft.serviceName} to ${draft.recipient}`,
      amount: draft.amount,
      fee: draft.fee,
      status: 'SUCCESSFUL',
      date: 'Just now',
      network: draft.network,
      recipient: draft.recipient,
      billerName: draft.billerName,
      token: tokenCode,
      units: draft.units || (draft.type === 'ELECTRICITY' ? `${(draft.amount / 72.5).toFixed(1)} kWh` : undefined),
    });

    if (draft.onSuccess) {
      try {
        draft.onSuccess();
      } catch (err) {
        console.warn('Error in draft onSuccess handler:', err);
      }
    }
    setPaymentSuccessCount((prev) => prev + 1);

    setActiveReceipt(newTx);
    setIsPinModalOpen(false);
    setIsReceiptOpen(true);
    return true;
  };

  const closeReceipt = () => {
    setIsReceiptOpen(false);
    setDraft(null);
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
        paymentSuccessCount,
        draft,
        activeReceipt,
        startCheckout,
        closeSheet,
        proceedToPin,
        cancelPin,
        verifyPinAndExecute,
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
  if (!context) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
