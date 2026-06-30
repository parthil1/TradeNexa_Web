"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Modal } from "@/components/common/Modal";
import { FormField } from "@/components/common/FormField";
import { RoleSelector } from "@/components/common/RoleSelector";
import { motion, AnimatePresence } from "framer-motion";
import Select, { SingleValue, StylesConfig } from "react-select";

type StateOption = { value: string; label: string };
import { indianStateNames } from "@/data/indianStates";
import {
  Smartphone,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  Loader2,
  CheckCircle2,
  Building,
  Mail,
  User,
  MapPin,
  Globe,
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
    company: "",
    email: "",
    address: "",
    city: "",
    state: "",
    role: authModalRole || "buyer",
  });
  // Options for State dropdown (combine states and UTs)
  const stateOptions = indianStateNames.map((name) => ({ value: name, label: name }));

  // Sync parameters when modal starts
  useEffect(() => {
    if (isAuthModalOpen) {
      setPhone(authModalPhone);
      setCountryCode(authModalCountryCode);
      if (authModalRole) {
        setRegForm((prev) => ({ ...prev, role: authModalRole }));
      }
      setErrors({});
      setOtp(Array(6).fill(""));
    }
  }, [isAuthModalOpen, authModalPhone, authModalCountryCode, authModalRole]);

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

    const response = await verifyOtpAction(authModalPhone, authModalCountryCode, otpCode);
    if (response && response.success) {
      if (!response.is_registered) {
        // New user — proceed to registration form
        setAuthModalStep("register");
      } else if (response.token && response.user) {
        // Existing user — log in directly
        loginUser(response.token, response.user);
        closeAuthModal();
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
    const success = await resendOtpAction(authModalPhone, authModalCountryCode);
    if (success) {
      startTimer();
      setOtp(Array(6).fill(""));
      otpRefs.current[0]?.focus();
    }
  };

  // 4. REGISTRATION SUBMIT
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!regForm.name.trim()) newErrors.name = "Full name is required";
    if (!regForm.company.trim()) newErrors.company = "Company name is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regForm.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!regForm.address.trim()) newErrors.address = "Office address is required";
    if (!regForm.city.trim()) newErrors.city = "City is required";
    if (!regForm.state.trim()) newErrors.state = "State is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const success = await registerAction({
      ...regForm,
      phone: authModalPhone,
      country_code: authModalCountryCode,
    });

    if (success && registerState.response) {
      const { token, user } = registerState.response;
      loginUser(token, user);
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
    } else if (success) {
      // In case state update isn't flushed yet, double check or wait
      const stored = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (stored && token) {
        loginUser(token, JSON.parse(stored));
      }
      setTimeout(() => {
        closeAuthModal();
      }, 1000);
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
                    <span>{countryCodes.find((c) => c.code === "+91")?.flag}</span>
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
                We've sent a 6-digit OTP code to <span className="font-semibold text-slate-800">{authModalCountryCode} {authModalPhone}</span>.
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

      case "register":
        return (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            {registerState.success ? (
              <div className="py-6 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-8 w-8 animate-bounce" />
                </div>
                <h4 className="text-lg font-bold text-slate-900">Profile Configured!</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Welcome to TradeNexa. Redirecting you to the platform...
                </p>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <UserPlus className="h-6 w-6" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">Complete Registration</h4>
                  <p className="text-sm text-slate-500 mt-1">
                    Setup your enterprise profile details to finalize your account creation.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <FormField label="Full Name" htmlFor="reg-name" required error={errors.name}>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        id="reg-name"
                        type="text"
                        value={regForm.name}
                        onChange={(e) => {
                          setRegForm({ ...regForm, name: e.target.value });
                          if (errors.name) setErrors({ ...errors, name: "" });
                        }}
                        placeholder="John Doe"
                        className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${errors.name ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-primary"
                          }`}
                      />
                    </div>
                  </FormField>

                  {/* Company Name */}
                  <FormField label="Company Name" htmlFor="reg-company" required error={errors.company}>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        id="reg-company"
                        type="text"
                        value={regForm.company}
                        onChange={(e) => {
                          setRegForm({ ...regForm, company: e.target.value });
                          if (errors.company) setErrors({ ...errors, company: "" });
                        }}
                        placeholder="TradeNexa Enterprise Pvt Ltd"
                        className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${errors.company ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-primary"
                          }`}
                      />
                    </div>
                  </FormField>

                  {/* Email Address */}
                  <FormField label="Email Address" htmlFor="reg-email" required error={errors.email}>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        id="reg-email"
                        type="email"
                        value={regForm.email}
                        onChange={(e) => {
                          setRegForm({ ...regForm, email: e.target.value });
                          if (errors.email) setErrors({ ...errors, email: "" });
                        }}
                        placeholder="name@company.com"
                        className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${errors.email ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-primary"
                          }`}
                      />
                    </div>
                  </FormField>

                  {/* Address */}
                  <FormField label="Office Address" htmlFor="reg-address" required error={errors.address}>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        id="reg-address"
                        type="text"
                        value={regForm.address}
                        onChange={(e) => {
                          setRegForm({ ...regForm, address: e.target.value });
                          if (errors.address) setErrors({ ...errors, address: "" });
                        }}
                        placeholder="G-12, IT Tech Park"
                        className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${errors.address ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-primary"
                          }`}
                      />
                    </div>
                  </FormField>

                  {/* City & State (Grid) */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="City" htmlFor="reg-city" required error={errors.city}>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          id="reg-city"
                          type="text"
                          value={regForm.city}
                          onChange={(e) => {
                            setRegForm({ ...regForm, city: e.target.value });
                            if (errors.city) setErrors({ ...errors, city: "" });
                          }}
                          placeholder="Mumbai"
                          className={`h-11 w-full rounded-xl border bg-white pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all outline-none focus:ring-2 focus:ring-primary/20 ${errors.city ? "border-red-400 focus:border-red-500" : "border-slate-200 focus:border-primary"
                            }`}
                        />
                      </div>
                    </FormField>
                    <FormField label="State" htmlFor="reg-state" required error={errors.state}>
                      {/* State dropdown */}
                      <Select<StateOption>
                        inputId="reg-state"
                        placeholder="Select State"
                        options={stateOptions}
                        value={stateOptions.find((o) => o.value === regForm.state) || null}
                        onChange={(option: SingleValue<StateOption>) =>
                          setRegForm({ ...regForm, state: option?.value ?? "" })
                        }
                        classNamePrefix="react-select"
                        styles={{
                          control: (provided: StylesConfig<StateOption>["control"] extends (base: infer B, ...args: never[]) => unknown ? B : Record<string, unknown>) => ({
                            ...provided,
                            height: "44px",
                            minHeight: "44px",
                            borderColor: errors.state ? "#f87171" : "#e2e8f0",
                            boxShadow: "none",
                          }),
                        } as StylesConfig<StateOption>}
                      />
                    </FormField>
                  </div>
                  {/* Role Selection */}
                  <FormField label="Account Type" htmlFor="reg-role" required>
                    <RoleSelector
                      value={regForm.role}
                      onChange={(role) => setRegForm({ ...regForm, role })}
                      compact
                    />
                  </FormField>
                </div>

                {registerState.error && (
                  <div className="rounded-xl bg-red-50 p-3 text-xs font-semibold text-red-600">
                    {registerState.error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={registerState.loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary h-11 text-sm font-semibold text-white shadow-md shadow-primary/10 transition-all hover:bg-primary-hover disabled:bg-slate-300 mt-2"
                >
                  {registerState.loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </button>
              </>
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
      case "register":
        return <span className="font-bold text-slate-950">Complete profile setup</span>;
      default:
        return "TradeNexa Portal";
    }
  };

  return (
    <Modal
      isOpen={isAuthModalOpen}
      onClose={handleClose}
      title={getModalTitle()}
      maxWidth={authModalStep === "register" ? "md" : "sm"}
    >
      {renderStep()}
    </Modal>
  );
}
