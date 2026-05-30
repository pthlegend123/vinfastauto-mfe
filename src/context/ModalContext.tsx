import { createContext, useContext, useState, useCallback } from 'react';
import type { Product } from '../types/product.types';

interface ModalContextValue {
  testDriveOpen: boolean;
  testDriveProductCode: string | undefined;
  testDriveVariantCode: string | undefined;
  orderOpen: boolean;
  orderProduct: Product | null;
  openTestDriveModal: (productCode?: string, variantCode?: string) => void;
  closeTestDriveModal: () => void;
  openOrderModal: (product: Product) => void;
  closeOrderModal: () => void;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [testDriveOpen, setTestDriveOpen] = useState(false);
  const [testDriveProductCode, setTestDriveProductCode] = useState<string | undefined>(undefined);
  const [testDriveVariantCode, setTestDriveVariantCode] = useState<string | undefined>(undefined);
  const [orderOpen, setOrderOpen] = useState(false);
  const [orderProduct, setOrderProduct] = useState<Product | null>(null);

  const openTestDriveModal = useCallback((productCode?: string, variantCode?: string) => {
    setTestDriveProductCode(productCode);
    setTestDriveVariantCode(variantCode);
    setTestDriveOpen(true);
  }, []);

  const closeTestDriveModal = useCallback(() => {
    setTestDriveOpen(false);
  }, []);

  const openOrderModal = useCallback((product: Product) => {
    setOrderProduct(product);
    setOrderOpen(true);
  }, []);

  const closeOrderModal = useCallback(() => {
    setOrderOpen(false);
  }, []);

  return (
    <ModalContext.Provider value={{
      testDriveOpen,
      testDriveProductCode,
      testDriveVariantCode,
      orderOpen,
      orderProduct,
      openTestDriveModal,
      closeTestDriveModal,
      openOrderModal,
      closeOrderModal,
    }}>
      {children}
    </ModalContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useModal(): ModalContextValue {
  const ctx = useContext(ModalContext);
  if (!ctx) throw new Error('useModal must be used within ModalProvider');
  return ctx;
}
