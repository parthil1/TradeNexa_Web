"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { showSuccessToast, showErrorToast } from "@/utils/toast";
import {
  User,
  UserRole,
  SendOtpResponse,
  VerifyOtpResponse,
  RegisterResponse,
  RegisterRequest,
} from "@/types/auth";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import { DEFAULT_LANGUAGE_ID, WEB_DEVICE } from "@/config/constants";
import {
  formatMobileNumber,
  getFirebaseVerificationId,
  getMobileNumber,
  mapApiProfileToUser,
  parseAuthSession,
  unwrapApiPayload,
  userRoleToRoleId,
  type ApiUserProfile,
} from "@/utils/authHelpers";

interface AsyncOperationState<T> {
  loading: boolean;
  success: boolean;
  error: string | null;
  response: T | null;
}

const initialOpState = <T,>(): AsyncOperationState<T> => ({
  loading: false,
  success: false,
  error: null,
  response: null,
});

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalStep: "login" | "verify" | "register";
  authModalRole: UserRole | null;
  authModalPhone: string;
  authModalCountryCode: string;
  sessionMobileNumber: string | null;
  sendOtpState: AsyncOperationState<SendOtpResponse>;
  verifyOtpState: AsyncOperationState<VerifyOtpResponse>;
  resendOtpState: AsyncOperationState<SendOtpResponse>;
  registerState: AsyncOperationState<RegisterResponse>;
  loginUser: (token: string, user: User, refreshToken?: string) => void;
  logoutUser: () => Promise<void>;
  updateUser: (user: User) => void;
  openAuthModal: (step?: "login" | "register", role?: UserRole) => void;
  closeAuthModal: () => void;
  setAuthModalStep: (step: "login" | "verify" | "register") => void;
  setAuthModalPhone: (phone: string) => void;
  setAuthModalCountryCode: (code: string) => void;
  sendOtpAction: (phone: string, countryCode: string) => Promise<boolean>;
  verifyOtpAction: (otp: string) => Promise<VerifyOtpResponse | null>;
  resendOtpAction: () => Promise<boolean>;
  registerAction: (formData: RegisterRequest) => Promise<RegisterResponse | null>;
  resetSendOtp: () => void;
  resetVerifyOtp: () => void;
  resetResendOtp: () => void;
  resetRegister: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalStep, setAuthModalStep] = useState<"login" | "verify" | "register">("login");
  const [authModalRole, setAuthModalRole] = useState<UserRole | null>(null);
  const [authModalPhone, setAuthModalPhone] = useState("");
  const [authModalCountryCode, setAuthModalCountryCode] = useState("+91");
  const [firebaseVerificationId, setFirebaseVerificationId] = useState<string | null>(null);
  const [sessionMobileNumber, setSessionMobileNumber] = useState<string | null>(null);
  const [sendOtpState, setSendOtpState] = useState<AsyncOperationState<SendOtpResponse>>(initialOpState());
  const [verifyOtpState, setVerifyOtpState] = useState<AsyncOperationState<VerifyOtpResponse>>(initialOpState());
  const [resendOtpState, setResendOtpState] = useState<AsyncOperationState<SendOtpResponse>>(initialOpState());
  const [registerState, setRegisterState] = useState<AsyncOperationState<RegisterResponse>>(initialOpState());

  const persistSession = (accessToken: string, userData: User, refreshToken?: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
    }
    setUser(userData);
    setIsAuthenticated(true);
  };

  const storeTokens = (accessToken?: string, refreshToken?: string) => {
    if (typeof window === "undefined") return;
    if (accessToken) localStorage.setItem("token", accessToken);
    if (refreshToken) localStorage.setItem("refresh_token", refreshToken);
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        const cachedUser = localStorage.getItem("user");
        if (token) {
          try {
            const res = await apiClient.get(API_ENDPOINTS.PROFILE);
            const profile = unwrapApiPayload<ApiUserProfile>(res.data);
            persistSession(token, mapApiProfileToUser(profile));
          } catch {
            if (cachedUser) {
              setUser(JSON.parse(cachedUser));
              setIsAuthenticated(true);
            } else {
              localStorage.removeItem("token");
              localStorage.removeItem("refresh_token");
              localStorage.removeItem("user");
            }
          }
        }
      }
      setLoading(false);
    };

    initAuth();

    const handleUnauthorized = () => {
      setUser(null);
      setIsAuthenticated(false);
      setIsAuthModalOpen(true);
      setAuthModalStep("login");
    };

    window.addEventListener("auth_unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth_unauthorized", handleUnauthorized);
  }, []);

  const loginUser = (token: string, userData: User, refreshToken?: string) => {
    persistSession(token, userData, refreshToken);
  };

  const logoutUser = async () => {
    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refresh_token") : null;
    try {
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.LOGOUT, { refresh_token: refreshToken });
      }
    } catch {
      // Clear local session even if API logout fails
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = (updatedUser: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    setUser(updatedUser);
  };

  const openAuthModal = (step: "login" | "register" = "login", role?: UserRole) => {
    setAuthModalStep(step);
    setAuthModalRole(role || null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
    setTimeout(() => {
      setAuthModalPhone("");
      setAuthModalRole(null);
      setFirebaseVerificationId(null);
      setSessionMobileNumber(null);
      resetSendOtp();
      resetVerifyOtp();
      resetResendOtp();
      resetRegister();
    }, 300);
  };

  const resetSendOtp = () => setSendOtpState(initialOpState());
  const resetVerifyOtp = () => setVerifyOtpState(initialOpState());
  const resetResendOtp = () => setResendOtpState(initialOpState());
  const resetRegister = () => setRegisterState(initialOpState());

  const sendOtpAction = async (phone: string, countryCode: string): Promise<boolean> => {
    setSendOtpState({ loading: true, success: false, error: null, response: null });
    try {
      const mobile_number = formatMobileNumber(countryCode, phone);
      const response = await apiClient.post(API_ENDPOINTS.SEND_OTP, { mobile_number });
      const data = unwrapApiPayload<Record<string, unknown>>(response.data);

      const verificationId = getFirebaseVerificationId(data);
      const apiMobileNumber = getMobileNumber(data) || mobile_number;

      if (!verificationId) {
        throw new Error("OTP sent but verification ID missing from server response.");
      }

      setFirebaseVerificationId(verificationId);
      setSessionMobileNumber(apiMobileNumber);

      const otpResponse: SendOtpResponse = {
        firebase_verification_id: verificationId,
        mobile_number: apiMobileNumber,
        message: String((response.data as { message?: string }).message || "OTP sent successfully"),
      };

      setSendOtpState({ loading: false, success: true, error: null, response: otpResponse });
      showSuccessToast("OTP sent successfully");
      return true;
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string }).message || "Failed to send OTP code";
      setSendOtpState({ loading: false, success: false, error: errorMsg, response: null });
      showErrorToast(errorMsg);
      return false;
    }
  };

  const verifyOtpAction = async (otp: string): Promise<VerifyOtpResponse | null> => {
    if (!firebaseVerificationId || !sessionMobileNumber) {
      const errorMsg = "Verification session expired. Please request a new OTP.";
      setVerifyOtpState({ loading: false, success: false, error: errorMsg, response: null });
      showErrorToast(errorMsg);
      return null;
    }

    setVerifyOtpState({ loading: true, success: false, error: null, response: null });
    try {
      const response = await apiClient.post(API_ENDPOINTS.VERIFY_OTP, {
        firebase_verification_id: firebaseVerificationId,
        mobile_number: sessionMobileNumber,
        otp: Number(otp),
        device: WEB_DEVICE,
      });

      const data = unwrapApiPayload<Record<string, unknown>>(response.data);
      const session = parseAuthSession(data);

      storeTokens(session.access_token, session.refresh_token);

      const verifyResponse: VerifyOtpResponse = {
        is_registered: session.is_registered,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
        message: String((response.data as { message?: string }).message || "OTP verified successfully"),
      };

      if (session.is_registered && session.access_token && session.user) {
        persistSession(session.access_token, session.user, session.refresh_token);
      }

      setVerifyOtpState({ loading: false, success: true, error: null, response: verifyResponse });
      showSuccessToast("OTP verified successfully");
      return verifyResponse;
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string }).message || "Failed to verify OTP code";
      setVerifyOtpState({ loading: false, success: false, error: errorMsg, response: null });
      showErrorToast(errorMsg);
      return null;
    }
  };

  const resendOtpAction = async (): Promise<boolean> => {
    if (!authModalPhone) return false;

    setResendOtpState({ loading: true, success: false, error: null, response: null });
    try {
      const mobile_number = formatMobileNumber(authModalCountryCode, authModalPhone);
      const response = await apiClient.post(API_ENDPOINTS.SEND_OTP, { mobile_number });
      const data = unwrapApiPayload<Record<string, unknown>>(response.data);

      const verificationId = getFirebaseVerificationId(data);
      const apiMobileNumber = getMobileNumber(data) || mobile_number;

      if (!verificationId) {
        throw new Error("OTP resent but verification ID missing from server response.");
      }

      setFirebaseVerificationId(verificationId);
      setSessionMobileNumber(apiMobileNumber);

      const otpResponse: SendOtpResponse = {
        firebase_verification_id: verificationId,
        mobile_number: apiMobileNumber,
        message: "OTP resent successfully",
      };

      setResendOtpState({ loading: false, success: true, error: null, response: otpResponse });
      showSuccessToast("OTP resent successfully");
      return true;
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string }).message || "Failed to resend OTP code";
      setResendOtpState({ loading: false, success: false, error: errorMsg, response: null });
      showErrorToast(errorMsg);
      return false;
    }
  };

  const registerAction = async (formData: RegisterRequest): Promise<RegisterResponse | null> => {
    if (!sessionMobileNumber) {
      const errorMsg = "Phone session expired. Please verify OTP again.";
      setRegisterState({ loading: false, success: false, error: errorMsg, response: null });
      showErrorToast(errorMsg);
      return null;
    }

    setRegisterState({ loading: true, success: false, error: null, response: null });
    try {
      const body: Record<string, unknown> = {
        mobile_number: sessionMobileNumber,
        full_name: formData.name,
        company_name: formData.company,
        address_line_1: formData.address,
        city: formData.city,
        state: formData.state,
        country: "India",
        pincode: formData.pincode,
        language_id: DEFAULT_LANGUAGE_ID,
        role_id: userRoleToRoleId(formData.role),
        device: WEB_DEVICE,
      };

      if (formData.email?.trim()) {
        body.email = formData.email.trim();
      }

      const response = await apiClient.post(API_ENDPOINTS.REGISTER, body);
      const data = unwrapApiPayload<Record<string, unknown>>(response.data);
      const session = parseAuthSession(data);

      const registerResponse: RegisterResponse = {
        is_registered: session.is_registered,
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
        message: String((response.data as { message?: string }).message || "Registration successful"),
      };

      if (session.access_token && session.user) {
        persistSession(session.access_token, session.user, session.refresh_token);
      }

      setRegisterState({ loading: false, success: true, error: null, response: registerResponse });
      showSuccessToast("Registration successful");
      return registerResponse;
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string }).message || "Registration failed";
      setRegisterState({ loading: false, success: false, error: errorMsg, response: null });
      showErrorToast(errorMsg);
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        loading,
        isAuthModalOpen,
        authModalStep,
        authModalRole,
        authModalPhone,
        authModalCountryCode,
        sessionMobileNumber,
        sendOtpState,
        verifyOtpState,
        resendOtpState,
        registerState,
        loginUser,
        logoutUser,
        updateUser,
        openAuthModal,
        closeAuthModal,
        setAuthModalStep,
        setAuthModalPhone,
        setAuthModalCountryCode,
        sendOtpAction,
        verifyOtpAction,
        resendOtpAction,
        registerAction,
        resetSendOtp,
        resetVerifyOtp,
        resetResendOtp,
        resetRegister,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
