import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import { registerUnauthorizedHandler } from '../services/apiClient';
import type { LoginResponse } from '../services/auth.service';

type AuthUser = LoginResponse['data'];

interface AuthContextValue {
  isLoggedIn: boolean;
  user: AuthUser;
  login: (user: AuthUser) => void;
  logout: () => void;
  openLoginModal: (onSuccessCallback?: () => void) => void;
  closeLoginModal: () => void;
  loginModalOpen: boolean;
  pendingCallback: (() => void) | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    if (authService.isTokenExpired()) {
      authService.clearSession();
      return false;
    }
    return true;
  });
  const [user, setUser] = useState<AuthUser>(() => {
    if (authService.isTokenExpired()) return undefined;
    return authService.getStoredUser() ?? undefined;
  });
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const login = useCallback((userData: AuthUser) => {
    authService.saveSession(userData);
    setUser(userData);
    setIsLoggedIn(true);
  }, []);

  const logout = useCallback(() => {
    authService.clearSession();
    setUser(undefined);
    setIsLoggedIn(false);
  }, []);

  useEffect(() => {
    registerUnauthorizedHandler(logout);
  }, [logout]);

  const openLoginModal = useCallback((onSuccessCallback?: () => void) => {
    setPendingCallback(() => onSuccessCallback ?? null);
    setLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setLoginModalOpen(false);
    setPendingCallback(null);
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, openLoginModal, closeLoginModal, loginModalOpen, pendingCallback }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
