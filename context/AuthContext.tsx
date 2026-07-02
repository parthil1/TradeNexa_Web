"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  User,
  UserRole,
  SendOtpResponse,
  VerifyOtpResponse,
  RegisterResponse,
  RegisterRequest,
  CompleteProfileData,
} from "@/types/auth";
import apiClient from "@/services/apiClient";
import { API_ENDPOINTS } from "@/config/endpoints";
import {
  formatMobileNumber,
  getFirebaseVerificationId,
  getMobileNumber,
  mapApiProfileToUser,
  parseAuthSession,
  unwrapApiPayload,
  userRoleToRoleId,
  ensureRolesLoaded,
  type ApiUserProfile,
} from "@/utils/authHelpers";
import { buildProfileFormData } from "@/utils/buildProfileFormData";
import {
  AsyncOperationState,
  initialOpState,
  runApiAction,
} from "@/utils/runApiAction";
import { showErrorToast } from "@/utils/toast";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  authModalStep: "login" | "verify" | "role" | "register";
  authModalRole: UserRole | null;
  authModalPhone: string;
  authModalCountryCode: string;
  sessionMobileNumber: string | null;
  sendOtpState: AsyncOperationState<SendOtpResponse>;
  verifyOtpState: AsyncOperationState<VerifyOtpResponse>;
  resendOtpState: AsyncOperationState<SendOtpResponse>;
  registerState: AsyncOperationState<RegisterResponse>;
  isCompleteProfileOpen: boolean;
  completeProfileRole: UserRole | null;
  completeProfileState: AsyncOperationState<User>;
  loginUser: (token: string, user: User, refreshToken?: string) => void;
  logoutUser: () => Promise<void>;
  updateUser: (user: User) => void;
  openAuthModal: (step?: "login" | "register" | "role", role?: UserRole) => void;
  closeAuthModal: () => void;
  setAuthModalStep: (step: "login" | "verify" | "role" | "register") => void;
  setAuthModalPhone: (phone: string) => void;
  setAuthModalCountryCode: (code: string) => void;
  sendOtpAction: (phone: string, countryCode: string) => Promise<boolean>;
  verifyOtpAction: (otp: string) => Promise<VerifyOtpResponse | null>;
  resendOtpAction: () => Promise<boolean>;
  registerAction: (formData: RegisterRequest) => Promise<RegisterResponse | null>;
  openCompleteProfileModal: (role: UserRole) => void;
  skipCompleteProfile: () => void;
  completeProfileAction: (payload: CompleteProfileData) => Promise<boolean>;
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
  const [authModalStep, setAuthModalStep] = useState<"login" | "verify" | "role" | "register">("login");
  const [authModalRole, setAuthModalRole] = useState<UserRole | null>(null);
  const [authModalPhone, setAuthModalPhone] = useState("");
  const [authModalCountryCode, setAuthModalCountryCode] = useState("+91");
  const [firebaseVerificationId, setFirebaseVerificationId] = useState<string | null>(null);
  const [sessionMobileNumber, setSessionMobileNumber] = useState<string | null>(null);
  const [sendOtpState, setSendOtpState] = useState<AsyncOperationState<SendOtpResponse>>(initialOpState());
  const [verifyOtpState, setVerifyOtpState] = useState<AsyncOperationState<VerifyOtpResponse>>(initialOpState());
  const [resendOtpState, setResendOtpState] = useState<AsyncOperationState<SendOtpResponse>>(initialOpState());
  const [registerState, setRegisterState] = useState<AsyncOperationState<RegisterResponse>>(initialOpState());
  const [isCompleteProfileOpen, setIsCompleteProfileOpen] = useState(false);
  const [completeProfileRole, setCompleteProfileRole] = useState<UserRole | null>(null);
  const [completeProfileState, setCompleteProfileState] = useState<AsyncOperationState<User>>(initialOpState());

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

  const clearSession = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
    }
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const initAuth = async () => {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      const cachedUser = localStorage.getItem("user");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiClient.get(API_ENDPOINTS.PROFILE);
        const profile = unwrapApiPayload<ApiUserProfile>(res.data);
        persistSession(token, mapApiProfileToUser(profile));
      } catch {
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
          setIsAuthenticated(true);
        } else {
          clearSession();
        }
      } finally {
        setLoading(false);
      }
    };

    initAuth();
    void ensureRolesLoaded();

    const handleUnauthorized = () => {
      clearSession();
      // Do not auto-open login modal — only open on user action (Join, etc.)
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
    clearSession();
  };

  const updateUser = (updatedUser: User) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
    setUser(updatedUser);
  };

  const openAuthModal = (step: "login" | "register" | "role" = "login", role?: UserRole) => {
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
  const resetCompleteProfile = () => setCompleteProfileState(initialOpState());

  const openCompleteProfileModal = (role: UserRole) => {
    setCompleteProfileRole(role);
    setIsCompleteProfileOpen(true);
  };

  const skipCompleteProfile = () => {
    setIsCompleteProfileOpen(false);
    setTimeout(() => {
      setCompleteProfileRole(null);
      resetCompleteProfile();
    }, 300);
  };

  const sendOtpRequest = async (phone: string, countryCode: string) => {
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

    return {
      firebase_verification_id: verificationId,
      mobile_number: apiMobileNumber,
      message: String((response.data as { message?: string }).message || "OTP sent successfully"),
    } as SendOtpResponse;
  };

  const sendOtpAction = async (phone: string, countryCode: string): Promise<boolean> => {
    const result = await runApiAction({
      setState: setSendOtpState,
      action: () => sendOtpRequest(phone, countryCode),
      successMessage: "OTP sent successfully",
      fallbackError: "Failed to send OTP code",
    });
    return !!result;
  };

  const verifyOtpAction = async (otp: string): Promise<VerifyOtpResponse | null> => {
    if (!firebaseVerificationId || !sessionMobileNumber) {
      const errorMsg = "Verification session expired. Please request a new OTP.";
      setVerifyOtpState({ loading: false, success: false, error: errorMsg, response: null });
      showErrorToast(errorMsg);
      return null;
    }

    return runApiAction({
      setState: setVerifyOtpState,
      fallbackError: "Failed to verify OTP code",
      successMessage: "OTP verified successfully",
      action: async () => {
        const response = await apiClient.post(API_ENDPOINTS.VERIFY_OTP, {
          firebase_verification_id: firebaseVerificationId,
          mobile_number: sessionMobileNumber,
          otp: Number(otp),
        });

        const data = unwrapApiPayload<Record<string, unknown>>(response.data);
        const session = parseAuthSession(data);

        storeTokens(session.access_token, session.refresh_token);

        if (session.is_registered && session.access_token && session.user) {
          persistSession(session.access_token, session.user, session.refresh_token);
        }

        return {
          is_registered: session.is_registered,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user,
          message: String((response.data as { message?: string }).message || "OTP verified successfully"),
        } as VerifyOtpResponse;
      },
    });
  };

  const resendOtpAction = async (): Promise<boolean> => {
    if (!authModalPhone) return false;
    const result = await runApiAction({
      setState: setResendOtpState,
      action: () => sendOtpRequest(authModalPhone, authModalCountryCode),
      successMessage: "OTP resent successfully",
      fallbackError: "Failed to resend OTP code",
    });
    return !!result;
  };

  const registerAction = async (formData: RegisterRequest): Promise<RegisterResponse | null> => {
    if (!sessionMobileNumber) {
      const errorMsg = "Phone session expired. Please verify OTP again.";
      setRegisterState({ loading: false, success: false, error: errorMsg, response: null });
      showErrorToast(errorMsg);
      return null;
    }

    return runApiAction({
      setState: setRegisterState,
      successMessage: "Registration successful",
      fallbackError: "Registration failed",
      action: async () => {
        await ensureRolesLoaded();

        const body = {
          mobile_number: sessionMobileNumber,
          full_name: formData.name.trim(),
          email: formData.email.trim(),
          role_id: userRoleToRoleId(formData.role),
          business_type_id: formData.businessTypeId,
        };

        const response = await apiClient.post(API_ENDPOINTS.REGISTER, body);
        const data = unwrapApiPayload<Record<string, unknown>>(response.data);
        const session = parseAuthSession(data);

        if (session.access_token && session.user) {
          persistSession(session.access_token, session.user, session.refresh_token);
        }

        return {
          is_registered: session.is_registered,
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          user: session.user,
          message: String((response.data as { message?: string }).message || "Registration successful"),
        } as RegisterResponse;
      },
    });
  };

  const completeProfileAction = async (payload: CompleteProfileData): Promise<boolean> => {
    if (!user) {
      showErrorToast("Please sign in to update your profile.");
      return false;
    }

    const result = await runApiAction({
      setState: setCompleteProfileState,
      successMessage: "Profile updated successfully",
      fallbackError: "Failed to update profile",
      action: async () => {
        const formData = buildProfileFormData(payload);

        const response = await apiClient.put(API_ENDPOINTS.PROFILE, formData);
        const profile = unwrapApiPayload<ApiUserProfile>(response.data);
        const updatedUser = mapApiProfileToUser(profile);

        if (typeof window !== "undefined") {
          localStorage.setItem("user", JSON.stringify(updatedUser));
        }
        setUser(updatedUser);
        return updatedUser;
      },
    });

    if (result) {
      skipCompleteProfile();
      return true;
    }
    return false;
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
        isCompleteProfileOpen,
        completeProfileRole,
        completeProfileState,
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
        openCompleteProfileModal,
        skipCompleteProfile,
        completeProfileAction,
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
