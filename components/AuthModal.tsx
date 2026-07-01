"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/common/Modal";
import { FormField } from "@/components/common/FormField";
import { Select } from "@/components/common/Select";
import { IndianFlag } from "@/components/common/IndianFlag";
import { RoleSelector } from "@/components/common/RoleSelector";
import { fetchBusinessTypes } from "@/services/businessTypesService";
import { ensureRolesLoaded, userRoleToRoleId } from "@/utils/authHelpers";
import type { ApiBusinessType } from "@/types/businessType";
import {
  Smartphone,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Loader2,
  Mail,
  User,
  Shapes,
} from "lucide-react";

// List of B2B trading country codes
const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
];

export default function AuthModal() {
  const {
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
    closeAuthModal,
    setAuthModalStep,
    setAuthModalPhone,
    setAuthModalCountryCode,
    sendOtpAction,
    verifyOtpAction,
    resendOtpAction,
    registerAction,
    openCompleteProfileModal,
    resetSendOtp,
    resetVerifyOtp,
    resetResendOtp,
    resetRegister,
  } = useAuth();

  // Local Form state
  const [phone, setPhone] = useState(authModalPhone);
  const [countryCode, setCountryCode] = useState(authModalCountryCode);
  const [showCodeDropdown, setShowCodeDropdown] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // OTP Inputs
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer State
  const [timeLeft, setTimeLeft] = useState(90); // 01:30
  const [timerActive, setTimerActive] = useState(false);

  // Registration Form Fields
  const [regForm, setRegForm] = useState({
    name: "",
    email: "",
    role: authModalRole || "buyer",
    businessTypeId: "",
  });
  const [businessTypes, setBusinessTypes] = useState<ApiBusinessType[]>([]);
  const [businessTypesLoading, setBusinessTypesLoading] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Sync parameters when modal starts
  useEffect(() => {
    if (isAuthModalOpen) {
      setPhone(authModalPhone);
      setCountryCode(authModalCountryCode);
      setRegForm({
        name: "",
        email: "",
        role: authModalRole || "buyer",
        businessTypeId: "",
      });
      setBusinessTypes([]);
      setSelectedRoleId(null);
      setErrors({});
      setOtp(Array(6).fill(""));
      setAgreedTerms(false);
    }
  }, [isAuthModalOpen, authModalPhone, authModalCountryCode, authModalRole]);

  useEffect(() => {
    const shouldLoad =
      (authModalStep === "role" || authModalStep === "register") && Boolean(regForm.role);
    if (!shouldLoad) return;

    let cancelled = false;

    const loadBusinessTypesForRole = async () => {
      setBusinessTypesLoading(true);
      try {
        await ensureRolesLoaded();
        const roleId = userRoleToRoleId(regForm.role);
        const types = await fetchBusinessTypes(roleId);

        if (cancelled) return;

        setSelectedRoleId(roleId);
        setBusinessTypes(types);
        setRegForm((prev) => ({ ...prev, businessTypeId: "" }));
      } catch {
        if (!cancelled) {
          setBusinessTypes([]);
          setSelectedRoleId(null);
        }
      } finally {
        if (!cancelled) setBusinessTypesLoading(false);
      }
    };

    void loadBusinessTypesForRole();

    return () => {
      cancelled = true;
    };
  }, [authModalStep, regForm.role]);

  // Sync Timer for OTP
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setTimerActive(false);
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const startTimer = () => {
    setTimeLeft(90);
    setTimerActive(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // 1. LOGIN SUBMIT
  const handleSendOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      setErrors({ phone: "Phone number is required" });
      return;
    }
    if (countryCode === "+91" && !/^\d{10}$/.test(phone)) {
      setErrors({ phone: "Please enter a valid 10-digit phone number" });
      return;
    }
    setErrors({});

    const success = await sendOtpAction(phone, countryCode);
    if (success) {
      setAuthModalPhone(phone);
      setAuthModalCountryCode(countryCode);
      setAuthModalStep("verify");
      startTimer();
    }
  };

  // 2. VERIFY OTP SUBMIT
  const handleOtpChange = (element: HTMLInputElement, index: number) => {
    const value = element.value.replace(/[^0-9]/g, "");
    if (!value) {
      const nextOtp = [...otp];
      nextOtp[index] = "";
      setOtp(nextOtp);
      return;
    }

    const nextOtp = [...otp];
    nextOtp[index] = value.slice(-1);
    setOtp(nextOtp);

    // Auto-focus next input
    if (index < 5 && otpRefs.current[index + 1]) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && otpRefs.current[index - 1]) {
        const nextOtp = [...otp];
        nextOtp[index - 1] = "";
        setOtp(nextOtp);
        otpRefs.current[index - 1]?.focus();
      } else {
        const nextOtp = [...otp];
        nextOtp[index] = "";
        setOtp(nextOtp);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/[^0-9]/g, "").slice(0, 6);
    if (pasteData.length === 6) {
      const pasteOtp = pasteData.split("");
      setOtp(pasteOtp);
      otpRefs.current[5]?.focus();
    }
  };

  const handleVerifyOtpSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const otpCode = otp.join("");
    if (otpCode.length < 6) {
      setErrors({ otp: "Please enter the complete 6-digit OTP code" });
      return;
    }
    setErrors({});

    const response = await verifyOtpAction(otpCode);
    if (response) {
      if (response.is_registered && response.user) {
        const token = response.access_token;
        if (token) {
          loginUser(token, response.user, response.refresh_token);
        }
        closeAuthModal();
      } else {
        if (authModalRole) {
          setRegForm((prev) => ({ ...prev, role: authModalRole }));
          setAuthModalStep("register");
        } else {
          setAuthModalStep("role");
        }
      }
    }
  };

  // Trigger verify automatically when 6 digits are input
  useEffect(() => {
    if (otp.join("").length === 6) {
      handleVerifyOtpSubmit();
    }
  }, [otp]);

  // 3. RESEND OTP
  const handleResendOtp = async () => {
    const success = await resendOtpAction();
    if (success) {
      startTimer();
      setOtp(Array(6).fill(""));
      otpRefs.current[0]?.focus();
    }
  };

  // 4. ROLE SELECTION (before register when no role pre-selected)
  const handleRoleContinue = () => {
    if (!regForm.role) {
      setErrors({ role: "Please select an account type" });
      return;
    }
    setErrors({});
    setAuthModalStep("register");
  };

  // 5. REGISTRATION SUBMIT
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!regForm.name.trim()) newErrors.name = "Full name is required";
    if (!regForm.email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!regForm.businessTypeId) {
      newErrors.businessTypeId = "Business type is required";
    }
    if (!agreedTerms) newErrors.terms = "You must agree to the terms to continue";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const result = await registerAction({
      ...regForm,
      businessTypeId: Number(regForm.businessTypeId),
    });

    if (result?.user) {
      const role = regForm.role;
      closeAuthModal();
      openCompleteProfileModal(role);
    }
  };

  const handleClose = () => {
    closeAuthModal();
  };

  // Render correct steps
  const renderStep = () => {
    switch (authModalStep) {
      case "login":
        return (
          <form onSubmit={handleSendOtpSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Smartphone className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Verify Your Identity</h4>
              <p className="text-sm text-slate-500 mt-1">
                Enter your phone number to receive a one-time verification password.
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Phone Number <span className="text-red-500">*</span>
              </label>

              <div className="relative flex gap-2">
                {/* Country Code Selector */}
                {/* Country Code Selector - Fixed to India */}
                <div className="relative">
                  <button
                    type="button"
                    disabled
                    className="flex h-11 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm font-semibold text-slate-700 cursor-not-allowed"
                  >
                    <IndianFlag className="h-4 w-6 shrink-0 rounded-sm shadow-sm ring-1 ring-slate-200/60" />
                    <span>+91</span>
                    <ChevronDown className="h-4 w-4 text-slate-400 opacity-30" />
                  </button>
                </div>

                {/* Phone Input Field */}
                <div className="relative flex-1">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                      setPhone(digits);
                      if (errors.phone) setErrors({});
                    }}
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number"
                    className={`h-11 w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${errors.phone
                      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                      : "border-slate-200 focus:border-primary"
                      }`}
                  />
                </div>
              </div>
              {errors.phone && (
                <p className="text-xs font-semibold text-red-500">{errors.phone}</p>
              )}
            </div>

            {sendOtpState.error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
                {sendOtpState.error}
              </div>
            )}

            <button
              type="submit"
              disabled={sendOtpState.loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary h-11 text-sm font-semibold text-white shadow-md shadow-primary/10 transition-all hover:bg-primary-hover disabled:bg-slate-300"
            >
              {sendOtpState.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Verification Code...
                </>
              ) : (
                <>
                  Send OTP Code
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        );

      case "verify":
        return (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Verify Code</h4>
              <p className="text-sm text-slate-500 mt-1">
                We&apos;ve sent a 6-digit OTP code to{" "}
                <span className="font-semibold text-slate-800">
                  {sessionMobileNumber || `${authModalCountryCode} ${authModalPhone}`}
                </span>
                .
              </p>
            </div>

            <div className="space-y-4">
              <label className="block text-center text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                Enter Security Code
              </label>

              <div className="flex justify-center gap-2.5 sm:gap-3.5">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    ref={(el) => {
                      otpRefs.current[idx] = el;
                    }}
                    onChange={(e) => handleOtpChange(e.target, idx)}
                    onKeyDown={(e) => handleKeyDown(e, idx)}
                    onPaste={handlePaste}
                    className={`h-12 w-10 sm:h-13 sm:w-11 text-center text-lg font-bold rounded-xl border bg-white shadow-sm transition-all outline-none focus:ring-2 focus:ring-primary/20 ${errors.otp || verifyOtpState.error
                      ? "border-red-400 focus:border-red-500"
                      : "border-slate-200 focus:border-primary"
                      }`}
                  />
                ))}
              </div>

              {errors.otp && (
                <p className="text-center text-xs font-semibold text-red-500">{errors.otp}</p>
              )}
            </div>

            {verifyOtpState.error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600 text-center">
                {verifyOtpState.error}
              </div>
            )}

            <div className="flex flex-col items-center justify-center gap-3 py-2">
              {timerActive ? (
                <p className="text-sm font-medium text-slate-500">
                  Resend OTP in <span className="font-semibold text-primary">{formatTime(timeLeft)}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendOtpState.loading}
                  className="text-sm font-semibold text-primary hover:text-primary-hover flex items-center gap-1.5 transition-colors disabled:text-slate-400"
                >
                  {resendOtpState.loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Resending...
                    </>
                  ) : (
                    "Resend Verification OTP"
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setAuthModalStep("login")}
                className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 transition-colors mt-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change Phone Number
              </button>
            </div>

            <button
              type="submit"
              disabled={verifyOtpState.loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary h-11 text-sm font-semibold text-white shadow-md shadow-primary/10 transition-all hover:bg-primary-hover disabled:bg-slate-300"
            >
              {verifyOtpState.loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying Code...
                </>
              ) : (
                "Verify & Continue"
              )}
            </button>
          </form>
        );

      case "role":
        return (
          <div className="space-y-6">
            <div className="text-center mb-2">
              <h4 className="text-lg font-bold text-slate-900">Choose your account type</h4>
              <p className="text-sm text-slate-500 mt-1">
                Select how you want to use TradeNexa. You can update details later.
              </p>
            </div>

            <FormField label="Account Type" htmlFor="role-select" required error={errors.role}>
              <RoleSelector
                value={regForm.role}
                onChange={(role) => {
                  setRegForm((prev) => ({ ...prev, role, businessTypeId: "" }));
                  if (errors.role) setErrors({ ...errors, role: "" });
                }}
              />
            </FormField>

            <button
              type="button"
              onClick={handleRoleContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary h-11 text-sm font-semibold text-white shadow-md shadow-primary/10 transition-all hover:bg-primary-hover"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setAuthModalStep("verify")}
              className="flex w-full items-center justify-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to verification
            </button>
          </div>
        );

      case "register":
        return (
          <form id="register-form" onSubmit={handleRegisterSubmit} className="space-y-4">
            <FormField label="Full Name" htmlFor="reg-name" required error={errors.name}>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reg-name"
                    type="text"
                    value={regForm.name}
                    onChange={(e) => {
                      setRegForm({ ...regForm, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                    placeholder="Enter your full name"
                    className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.name ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-primary"}`}
                  />
                </div>
              </FormField>

              <FormField label="Mobile Number" htmlFor="reg-mobile" required>
                <div className="flex gap-2">
                  <div className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700">
                    <IndianFlag className="h-4 w-6 shrink-0 rounded-sm shadow-sm ring-1 ring-slate-200/60" />
                    <span>+91</span>
                  </div>
                  <input
                    id="reg-mobile"
                    type="text"
                    readOnly
                    value={
                      sessionMobileNumber
                        ? sessionMobileNumber.replace(/^\+91/, "")
                        : authModalPhone
                    }
                    className="h-11 min-w-0 flex-1 cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700"
                  />
                </div>
              </FormField>

              <FormField label="Email Address" htmlFor="reg-email" required error={errors.email}>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="reg-email"
                    type="email"
                    value={regForm.email}
                    onChange={(e) => {
                      setRegForm({ ...regForm, email: e.target.value });
                      if (errors.email) setErrors({ ...errors, email: "" });
                    }}
                    placeholder="you@example.com"
                    className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:ring-2 focus:ring-primary/20 ${errors.email ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-primary"}`}
                  />
                </div>
              </FormField>

              <FormField
                label="Business Type"
                htmlFor="reg-business-type"
                required
                error={errors.businessTypeId}
              >
                <div className="relative">
                  <Shapes className="pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  {businessTypesLoading ? (
                    <div className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Loading business types...
                    </div>
                  ) : (
                    <Select
                      id="reg-business-type"
                      value={regForm.businessTypeId}
                      onChange={(e) => {
                        setRegForm({ ...regForm, businessTypeId: e.target.value });
                        if (errors.businessTypeId) setErrors({ ...errors, businessTypeId: "" });
                      }}
                      options={businessTypes.map((type) => ({
                        value: String(type.id),
                        label: type.name,
                      }))}
                      placeholder={
                        businessTypes.length
                          ? "Select business type"
                          : selectedRoleId
                            ? "No business types for this role"
                            : "Select account type first"
                      }
                      error={!!errors.businessTypeId}
                      disabled={!businessTypes.length}
                      className="pl-10"
                    />
                  )}
                </div>
              </FormField>

              {registerState.error && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
                  {registerState.error}
                </div>
              )}
          </form>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    switch (authModalStep) {
      case "login":
        return <span className="font-bold text-slate-950">Authenticate</span>;
      case "verify":
        return <span className="font-bold text-slate-950">Secure verification</span>;
      case "role":
        return <span className="font-bold text-slate-950">Account type</span>;
      case "register":
        return <span className="font-bold text-slate-950">Register</span>;
      default:
        return "TradeNexa Portal";
    }
  };

  const isRegisterStep = authModalStep === "register";

  const registerFooter = (
    <div className="space-y-3">
      <label className="flex items-start gap-2.5 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={agreedTerms}
          onChange={(e) => {
            setAgreedTerms(e.target.checked);
            if (errors.terms) setErrors({ ...errors, terms: "" });
          }}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-primary focus:ring-primary/20"
        />
        <span className="leading-snug">
          I agree to the{" "}
          <span className="font-semibold text-primary">Terms of Service</span> and{" "}
          <span className="font-semibold text-primary">Privacy Policy</span>
        </span>
      </label>
      {errors.terms && <p className="text-xs font-semibold text-red-500">{errors.terms}</p>}
      <button
        type="submit"
        form="register-form"
        disabled={registerState.loading}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary h-11 text-sm font-semibold text-white shadow-md shadow-primary/10 transition-all hover:bg-primary-hover disabled:bg-slate-300"
      >
        {registerState.loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Creating Account...
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={handleClose}
      title={getModalTitle()}
      bodyClassName="px-6 py-6"
      footer={isRegisterStep ? registerFooter : undefined}
      maxWidth="sm"
    >
      {renderStep()}
    </Modal>
  );
}
