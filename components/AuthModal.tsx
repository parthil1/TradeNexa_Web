"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/common/Modal";
import { FormField } from "@/components/common/FormField";
import { Select } from "@/components/common/Select";
import { IndianFlag } from "@/components/common/IndianFlag";
import { RoleSelector } from "@/components/common/RoleSelector";
import { fetchBusinessTypesPage } from "@/services/businessTypesService";
import { ensureRolesLoaded, userRoleToRoleId } from "@/utils/authHelpers";
import type { ApiBusinessType } from "@/types/businessType";
import { scrollToFirstFormError } from "@/utils/scrollToFormError";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import {
  ensureNotificationPermission,
  getFcmToken,
} from "@/services/fcmService";
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
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

// List of B2B trading country codes
const countryCodes = [
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+971", country: "UAE", flag: "🇦🇪" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
];

const stepVariants = {
  initial: { opacity: 0, x: 16 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -16 },
};

const stepTransition = { duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] as const };

type AuthStep = "login" | "verify" | "role" | "register";

function StepHeader({
  icon: Icon,
  title,
  description,
  accent = "primary",
}: {
  icon: React.ElementType;
  title: string;
  description: React.ReactNode;
  accent?: "primary" | "emerald";
}) {
  const accentClasses =
    accent === "emerald"
      ? "bg-success-soft text-success ring-success/10"
      : "bg-primary/10 text-primary ring-primary/10";

  return (
    <div className="mb-8 text-center">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ring-1 ${accentClasses}`}
      >
        <Icon className="h-6 w-6" strokeWidth={1.75} />
      </motion.div>
      <h4 className="text-xl font-semibold tracking-tight text-foreground">{title}</h4>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-fg">{description}</p>
    </div>
  );
}

function ErrorBanner({ message, centered }: { message: string; centered?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-start gap-2.5 rounded-xl border border-error/20 bg-error-soft px-4 py-3 ${
        centered ? "justify-center text-center" : ""
      }`}
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-error" />
      <p className="text-sm font-medium text-error">{message}</p>
    </motion.div>
  );
}

function FieldError({ message, centered }: { message: string; centered?: boolean }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -2 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-1.5 text-xs font-medium text-error ${
        centered ? "justify-center" : ""
      }`}
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {message}
    </motion.p>
  );
}

function GhostButton({
  children,
  onClick,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-primary transition-colors hover:bg-primary/5 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:text-muted-fg"
    >
      {loading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </button>
  );
}

function TextLinkButton({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-medium text-muted-fg transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
    >
      {children}
    </button>
  );
}

function BusinessTypeSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      <div className="h-3 w-24 animate-pulse rounded bg-muted" />
      <div className="flex h-10 items-center gap-3 rounded-lg border border-border bg-muted px-4">
        <div className="h-4 w-4 animate-pulse rounded bg-muted" />
        <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}

function EmptyBusinessTypes({ message }: { message: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-muted px-4 py-3">
      <Shapes className="h-4 w-4 shrink-0 text-muted-fg" />
      <p className="text-sm text-muted-fg">{message}</p>
    </div>
  );
}

export default function AuthModal() {
  const { isAuthModalOpen, authModalSession } = useAuth();

  return (
    <AuthModalFlow key={authModalSession} isOpen={isAuthModalOpen} />
  );
}

function AuthModalFlow({ isOpen }: { isOpen: boolean }) {
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
  const [businessTypesLoadingMore, setBusinessTypesLoadingMore] = useState(false);
  const [businessTypesPage, setBusinessTypesPage] = useState(1);
  const [businessTypesHasMore, setBusinessTypesHasMore] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);

  useEffect(() => {
    const shouldLoad =
      (authModalStep === "role" || authModalStep === "register") && Boolean(regForm.role);
    if (!shouldLoad) return;

    let cancelled = false;

    const loadBusinessTypesForRole = async () => {
      setBusinessTypesLoading(true);
      setBusinessTypes([]);
      setBusinessTypesPage(1);
      setBusinessTypesHasMore(false);
      try {
        await ensureRolesLoaded();
        const roleId = userRoleToRoleId(regForm.role);
        const { results, pagination } = await fetchBusinessTypesPage(roleId, 1, 10);

        if (cancelled) return;

        setSelectedRoleId(roleId);
        setBusinessTypes(results);
        setBusinessTypesPage(pagination.page || 1);
        setBusinessTypesHasMore(pagination.page < pagination.totalPages);
        setRegForm((prev) => ({ ...prev, businessTypeId: "" }));
      } catch {
        if (!cancelled) {
          setBusinessTypes([]);
          setBusinessTypesHasMore(false);
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

  const loadMoreBusinessTypes = useCallback(async () => {
    if (!selectedRoleId || businessTypesLoadingMore || !businessTypesHasMore) return;

    setBusinessTypesLoadingMore(true);
    try {
      const nextPage = businessTypesPage + 1;
      const { results, pagination } = await fetchBusinessTypesPage(selectedRoleId, nextPage, 10);

      setBusinessTypes((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        return [...prev, ...results.filter((item) => !seen.has(item.id))];
      });
      setBusinessTypesPage(pagination.page || nextPage);
      setBusinessTypesHasMore(pagination.page < pagination.totalPages);
    } catch {
      // Keep current list; user can scroll again to retry
    } finally {
      setBusinessTypesLoadingMore(false);
    }
  }, [selectedRoleId, businessTypesLoadingMore, businessTypesHasMore, businessTypesPage]);

  // Sync Timer for OTP
  useEffect(() => {
    if (!timerActive) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerActive(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive]);

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
      scrollToFirstFormError({ phone: "Phone number is required" }, {
        fieldIds: { phone: "auth-phone" },
      });
      return;
    }
    if (countryCode === "+91" && !/^\d{10}$/.test(phone)) {
      setErrors({ phone: "Please enter a valid 10-digit phone number" });
      scrollToFirstFormError(
        { phone: "Please enter a valid 10-digit phone number" },
        { fieldIds: { phone: "auth-phone" } }
      );
      return;
    }
    setErrors({});

    // Ask for notifications on the Send OTP click (user gesture).
    // OTP auto-submit often has no gesture, so browsers skip the Allow dialog there.
    await ensureNotificationPermission();
    void getFcmToken();

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

    if (nextOtp.every((digit) => digit)) {
      void handleVerifyOtpSubmit(undefined, nextOtp);
    }

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
      void handleVerifyOtpSubmit(undefined, pasteOtp);
    }
  };

  const handleVerifyOtpSubmit = async (e?: React.FormEvent, otpOverride?: string[]) => {
    if (e) e.preventDefault();
    const otpCode = (otpOverride ?? otp).join("");
    if (otpCode.length < 6) {
      setErrors({ otp: "Please enter the complete 6-digit OTP code" });
      scrollToFirstFormError(
        { otp: "Please enter the complete 6-digit OTP code" },
        { fieldIds: { otp: "auth-otp-0" } }
      );
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
      scrollToFirstFormError({ role: "Please select an account type" }, {
        fieldIds: { role: "role-select" },
      });
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
      scrollToFirstFormError(newErrors, {
        fieldOrder: ["name", "email", "businessTypeId", "terms"],
        fieldIds: {
          name: "reg-name",
          email: "reg-email",
          businessTypeId: "reg-business-type",
          terms: "auth-terms",
        },
      });
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

  const phoneDisplay =
    sessionMobileNumber || `${authModalCountryCode} ${authModalPhone}`;

  // Render correct steps
  const renderStep = () => {
    switch (authModalStep) {
      case "login":
        return (
          <motion.form
            key="login"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={stepTransition}
            onSubmit={handleSendOtpSubmit}
            className="space-y-6"
          >
            <StepHeader
              icon={Smartphone}
              title="Verify your identity"
              description="Enter your phone number to receive a one-time verification code."
            />

            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted-fg">
                Phone number <span className="text-error">*</span>
              </label>

              <div className="flex gap-2">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    disabled
                    className="flex h-10 cursor-not-allowed items-center gap-2 rounded-lg border border-border bg-muted px-3 text-sm font-medium text-foreground"
                  >
                    <IndianFlag className="h-4 w-6 shrink-0 rounded-sm ring-1 ring-border" />
                    <span>+91</span>
                    <ChevronDown className="h-4 w-4 text-muted-fg" />
                  </button>
                </div>

                <Input
                  id="auth-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/[^0-9]/g, "").slice(0, 10);
                    setPhone(digits);
                    if (errors.phone) setErrors({});
                  }}
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  error={!!errors.phone}
                  className="min-w-0 flex-1"
                />
              </div>

              {errors.phone && <FieldError message={errors.phone} />}
            </div>

            {sendOtpState.error && <ErrorBanner message={sendOtpState.error} />}

            <Button
              type="submit"
              loading={sendOtpState.loading}
              loadingText="Sending verification code..."
              size="lg"
              fullWidth
            >
              Send OTP code
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.form>
        );

      case "verify":
        return (
          <motion.form
            key="verify"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={stepTransition}
            onSubmit={handleVerifyOtpSubmit}
            className="space-y-6"
          >
            <StepHeader
              icon={ShieldCheck}
              accent="emerald"
              title="Enter verification code"
              description={
                <>
                  We sent a 6-digit code to{" "}
                  <span className="font-semibold text-foreground">{phoneDisplay}</span>
                </>
              }
            />

            <div className="space-y-4">
              <label className="block text-center text-xs font-semibold uppercase tracking-wider text-muted-fg">
                Security code
              </label>

              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, idx) => (
                  <motion.input
                    key={idx}
                    id={idx === 0 ? "auth-otp-0" : undefined}
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
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    className={`h-11 w-10 sm:h-12 sm:w-12 rounded-lg border bg-card text-center text-lg font-semibold text-foreground outline-none transition-all duration-200 ${
                      errors.otp || verifyOtpState.error
                        ? "border-error/40 focus:border-error focus:ring-2 focus:ring-error/20"
                        : digit
                          ? "border-primary/40 bg-primary/[0.03] focus:border-primary focus:ring-2 focus:ring-primary/25"
                          : "border-border focus:border-primary focus:ring-2 focus:ring-primary/25"
                    }`}
                  />
                ))}
              </div>

              {errors.otp && <FieldError message={errors.otp} centered />}
            </div>

            {verifyOtpState.error && (
              <ErrorBanner message={verifyOtpState.error} centered />
            )}

            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-muted px-4 py-4">
              {timerActive ? (
                <p className="text-sm text-muted-fg">
                  Resend code in{" "}
                  <span className="font-mono font-semibold tabular-nums text-primary">
                    {formatTime(timeLeft)}
                  </span>
                </p>
              ) : (
                <GhostButton onClick={handleResendOtp} loading={resendOtpState.loading}>
                  Resend verification code
                </GhostButton>
              )}

              <TextLinkButton onClick={() => setAuthModalStep("login")}>
                <ArrowLeft className="h-3.5 w-3.5" />
                Change phone number
              </TextLinkButton>
            </div>

            <Button
              type="submit"
              loading={verifyOtpState.loading}
              loadingText="Verifying code..."
              size="lg"
              fullWidth
            >
              Verify & continue
            </Button>
          </motion.form>
        );

      case "role":
        return (
          <motion.div
            key="role"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={stepTransition}
            className="space-y-8"
          >
            <StepHeader
              icon={User}
              title="Choose your account type"
              description="Select how you want to use TradeNexa. You can update details later."
            />

            <div className="rounded-xl border border-border bg-muted p-4 sm:p-5">
              <FormField
                label="Account type"
                htmlFor="role-select"
                fieldKey="role-select"
                required
                error={errors.role}
              >
                <RoleSelector
                  value={regForm.role}
                  onChange={(role) => {
                    setRegForm((prev) => ({ ...prev, role, businessTypeId: "" }));
                    if (errors.role) setErrors({ ...errors, role: "" });
                  }}
                />
              </FormField>
            </div>

            <div className="space-y-3">
              <Button type="button" onClick={handleRoleContinue} size="lg" fullWidth>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>

              <div className="flex justify-center">
                <TextLinkButton onClick={() => setAuthModalStep("verify")}>
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to verification
                </TextLinkButton>
              </div>
            </div>
          </motion.div>
        );

      case "register":
        return (
          <motion.form
            key="register"
            id="register-form"
            variants={stepVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={stepTransition}
            onSubmit={handleRegisterSubmit}
            className="space-y-5"
          >
            <div className="mb-2">
              <p className="text-sm text-muted-fg">
                Complete your profile to get started on TradeNexa.
              </p>
            </div>

            <FormField label="Full name" htmlFor="reg-name" required error={errors.name}>
              <Input
                id="reg-name"
                value={regForm.name}
                onChange={(e) => {
                  setRegForm({ ...regForm, name: e.target.value });
                  if (errors.name) setErrors({ ...errors, name: "" });
                }}
                placeholder="Your full name"
                icon={User}
                error={!!errors.name}
              />
            </FormField>

            <FormField label="Mobile number" htmlFor="reg-mobile" required>
              <div className="flex gap-2">
                <div className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-border bg-muted px-3 text-sm font-medium text-foreground">
                  <IndianFlag className="h-4 w-6 shrink-0 rounded-sm ring-1 ring-border" />
                  <span>+91</span>
                </div>
                <Input
                  id="reg-mobile"
                  type="text"
                  readOnly
                  value={
                    sessionMobileNumber
                      ? sessionMobileNumber.replace(/^\+91/, "")
                      : authModalPhone
                  }
                  className="min-w-0 flex-1 cursor-not-allowed bg-muted text-muted-fg"
                />
              </div>
            </FormField>

            <FormField label="Email address" htmlFor="reg-email" required error={errors.email}>
              <Input
                id="reg-email"
                type="email"
                value={regForm.email}
                onChange={(e) => {
                  setRegForm({ ...regForm, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                placeholder="you@company.com"
                icon={Mail}
                error={!!errors.email}
              />
            </FormField>

            <FormField
              label="Business type"
              htmlFor="reg-business-type"
              required
              error={errors.businessTypeId}
            >
              <div className="relative">
                {businessTypesLoading ? (
                  <BusinessTypeSkeleton />
                ) : !businessTypes.length ? (
                  <EmptyBusinessTypes
                    message={
                      selectedRoleId
                        ? "No business types available for this role"
                        : "Select an account type first"
                    }
                  />
                ) : (
                  <>
                    <Shapes className="pointer-events-none absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-fg" />
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
                      placeholder="Select business type"
                      error={!!errors.businessTypeId}
                      disabled={!businessTypes.length && !businessTypesLoading}
                      className="pl-11"
                      hasMore={businessTypesHasMore}
                      loadingMore={businessTypesLoadingMore}
                      onLoadMore={loadMoreBusinessTypes}
                    />
                  </>
                )}
              </div>
            </FormField>

            {registerState.error && <ErrorBanner message={registerState.error} />}
          </motion.form>
        );

      default:
        return null;
    }
  };

  const getModalTitle = () => {
    const subtitles: Record<AuthStep, string> = {
      login: "Sign in securely",
      verify: "Two-factor check",
      role: "Set up account",
      register: "Create profile",
    };

    const step = authModalStep as AuthStep;

    return (
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-fg">
        {subtitles[step] ?? "TradeNexa"}
      </p>
    );
  };

  const isRegisterStep = authModalStep === "register";

  const registerFooter = (
    <div className="space-y-4">
      <label
        data-form-field="auth-terms"
        className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all duration-200 ${
          agreedTerms
            ? "border-primary/20 bg-primary/[0.03]"
            : errors.terms
              ? "border-error/25 bg-error-soft/60"
              : "border-border bg-muted hover:border-border-hover"
        }`}
      >
        <div className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <input
            type="checkbox"
            id="auth-terms"
            checked={agreedTerms}
            onChange={(e) => {
              setAgreedTerms(e.target.checked);
              if (errors.terms) setErrors({ ...errors, terms: "" });
            }}
            className="peer sr-only"
          />
          <div
            className={`flex h-5 w-5 items-center justify-center rounded-md border bg-card transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-primary/25 ${
              agreedTerms ? "border-primary bg-primary" : "border-border"
            }`}
          >
            {agreedTerms && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
          </div>
        </div>
        <span className="text-sm leading-relaxed text-muted-fg">
          I agree to the{" "}
          <span className="font-semibold text-primary">Terms of Service</span> and{" "}
          <span className="font-semibold text-primary">Privacy Policy</span>
        </span>
      </label>

      {errors.terms && <FieldError message={errors.terms} />}

      <Button
        type="submit"
        form="register-form"
        loading={registerState.loading}
        loadingText="Creating account..."
        size="lg"
        fullWidth
      >
        Continue
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={getModalTitle()}
      bodyClassName="px-6 py-8 sm:px-8"
      footer={isRegisterStep ? registerFooter : undefined}
      maxWidth="sm"
    >
      <AnimatePresence mode="wait">{renderStep()}</AnimatePresence>
    </Modal>
  );
}
