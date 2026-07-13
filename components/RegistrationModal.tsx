"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { useApp, UserRole } from "@/app/context/AppContext";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { RoleSelector } from "@/components/common/RoleSelector";
import { scrollToFirstFormError } from "@/utils/scrollToFormError";
import { Button } from "@/components/common/Button";

const categoryOptions = [
  { value: "electronics", label: "Electronics & Electricals" },
  { value: "machinery", label: "Industrial Machinery" },
  { value: "agriculture", label: "Agriculture & Food" },
  { value: "fashion", label: "Fashion & Apparel" },
  { value: "construction", label: "Construction & Real Estate" },
  { value: "chemicals", label: "Chemicals & Allied Products" },
];

const roleTitles: Record<UserRole, string> = {
  seller: "Register as a Seller",
  buyer: "Register as a Buyer",
  both: "Register as Buyer & Seller",
};

const roleDescriptions: Record<UserRole, string> = {
  seller: "List your products and receive genuine buyer inquiries from across India.",
  buyer: "Discover verified suppliers and send RFQs to source bulk materials.",
  both: "Buy raw materials and sell your own catalog — one account for both sides of trade.",
};

export default function RegistrationModal() {
  const {
    isRegisterModalOpen,
    registerModalRole,
    closeRegisterModal,
    addRegistration,
  } = useApp();

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    category: "",
    role: "" as UserRole | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const selectedRole = (isRegisterModalOpen && registerModalRole ? registerModalRole : formData.role) as
    | UserRole
    | "";

  const resetForm = () => {
    setFormData({ name: "", company: "", phone: "", email: "", category: "", role: "" });
    setErrors({});
    setIsSuccess(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    closeRegisterModal();
    setTimeout(resetForm, 300);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedRole) newErrors.role = "Please select how you want to use the platform.";
    if (!formData.name.trim()) newErrors.name = "Full name is required.";
    if (!formData.company.trim()) newErrors.company = "Company name is required.";
    if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Enter a valid 10-digit phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Enter a valid email address.";
    if (selectedRole !== "buyer" && !formData.category)
      newErrors.category = "Select your primary industry category.";
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validate();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      scrollToFirstFormError(newErrors, {
        fieldOrder: ["role", "name", "company", "phone", "email", "category"],
        fieldIds: {
          role: "role-seller",
          name: "reg-name",
          company: "reg-company",
          phone: "reg-phone",
          email: "reg-email",
          category: "reg-category",
        },
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      addRegistration({
        name: formData.name,
        company: formData.company,
        phone: formData.phone,
        email: formData.email,
        category: formData.category,
        role: selectedRole as UserRole,
      });
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(handleClose, 2500);
    }, 1200);
  };

  const clearError = (field: string) => {
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const activeRole = selectedRole as UserRole;

  return (
    <AnimatePresence>
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-navy/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            data-form-scroll-container
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl md:p-8"
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 rounded-full p-1.5 text-muted-fg transition hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            {isSuccess ? (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Registration Successful!</h3>
                <p className="mt-2 text-sm text-muted-fg">
                  Our team will review your profile and contact you within 24 hours.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <UserPlus className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {activeRole ? roleTitles[activeRole] : "Join TradeNexa"}
                    </h3>
                    <p className="text-sm text-muted-fg">
                      {activeRole
                        ? roleDescriptions[activeRole]
                        : "Choose your role and start connecting with businesses nationwide."}
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                  <FormField label="I want to" htmlFor="role-seller" fieldKey="role" required error={errors.role}>
                    <RoleSelector
                      value={selectedRole}
                      onChange={(role) => {
                        setFormData({ ...formData, role });
                        clearError("role");
                      }}
                      error={errors.role}
                    />
                  </FormField>

                  <FormField label="Full Name" htmlFor="reg-name" required error={errors.name}>
                    <Input
                      id="reg-name"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value });
                        clearError("name");
                      }}
                      placeholder="Your full name"
                      error={!!errors.name}
                    />
                  </FormField>

                  <FormField label="Company Name" htmlFor="reg-company" required error={errors.company}>
                    <Input
                      id="reg-company"
                      value={formData.company}
                      onChange={(e) => {
                        setFormData({ ...formData, company: e.target.value });
                        clearError("company");
                      }}
                      placeholder="Business or company name"
                      error={!!errors.company}
                    />
                  </FormField>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Phone" htmlFor="reg-phone" required error={errors.phone}>
                      <Input
                        id="reg-phone"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          clearError("phone");
                        }}
                        placeholder="10-digit number"
                        error={!!errors.phone}
                      />
                    </FormField>
                    <FormField label="Email" htmlFor="reg-email" required error={errors.email}>
                      <Input
                        id="reg-email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          clearError("email");
                        }}
                        placeholder="name@company.com"
                        error={!!errors.email}
                      />
                    </FormField>
                  </div>

                  {selectedRole !== "buyer" && (
                    <FormField
                      label="Primary Industry"
                      htmlFor="reg-category"
                      required
                      error={errors.category}
                    >
                      <Select
                        id="reg-category"
                        value={formData.category}
                        onChange={(e) => {
                          setFormData({ ...formData, category: e.target.value });
                          clearError("category");
                        }}
                        options={categoryOptions}
                        placeholder="Select industry category"
                        error={!!errors.category}
                      />
                    </FormField>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    loading={isSubmitting}
                    loadingText="Submitting..."
                    size="lg"
                    fullWidth
                  >
                    Complete Free Registration
                  </Button>
                </form>
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
