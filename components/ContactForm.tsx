"use client";

import React, { useState } from "react";
import { useApp, UserRole } from "@/app/context/AppContext";
import { Send, CheckCircle2, Loader2 } from "lucide-react";
import { FormField } from "@/components/common/FormField";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/common/Textarea";
import { RoleSelector } from "@/components/common/RoleSelector";
import { scrollToFirstFormError } from "@/utils/scrollToFormError";

export default function ContactForm() {
  const { addInquiry } = useApp();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    role: "" as UserRole | "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const clearError = (field: string) => {
    if (errors[field]) setErrors({ ...errors, [field]: "" });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!formData.role) newErrors.role = "Please select your role on the platform.";
    if (!formData.name.trim()) newErrors.name = "Full name is required.";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email address is required.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    } else if (!/^\d+$/.test(formData.phone)) {
      newErrors.phone = "Phone number must contain digits only.";
    } else if (formData.phone.length !== 10) {
      newErrors.phone = "Phone number must be exactly 10 digits.";
    }
    if (!formData.company.trim()) newErrors.company = "Company name is required.";
    if (!formData.message.trim()) newErrors.message = "Message details are required.";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      scrollToFirstFormError(newErrors, {
        fieldOrder: ["role", "name", "email", "phone", "company", "message"],
        fieldIds: {
          role: "contact-role",
          name: "contact-name",
          email: "contact-email",
          phone: "contact-phone",
          company: "contact-company",
          message: "contact-message",
        },
      });
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    setTimeout(() => {
      addInquiry({
        ...formData,
        role: formData.role as UserRole,
      });
      setIsSubmitting(false);
      setSubmitted(true);
      setFormData({ name: "", email: "", phone: "", company: "", message: "", role: "" });
      setTimeout(() => setSubmitted(false), 4000);
    }, 1500);
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
      {submitted ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Inquiry Sent Successfully!</h3>
          <p className="mt-2 text-sm text-slate-500">
            Thank you for reaching out. A platform representative will contact you within 24 hours.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
          <h3 className="text-lg font-bold text-[#1a2b4c]">Send a Direct Message</h3>
            <p className="mt-1 text-sm text-slate-500">
              Tell us about your business and how we can help you connect.
            </p>
          </div>

          <FormField label="Your Role" htmlFor="contact-role" fieldKey="role" required error={errors.role}>
            <RoleSelector
              value={formData.role}
              onChange={(role) => {
                setFormData({ ...formData, role });
                clearError("role");
              }}
              error={errors.role}
              compact
            />
          </FormField>

          <FormField label="Full Name" htmlFor="contact-name" required error={errors.name}>
            <Input
              id="contact-name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                clearError("name");
              }}
              placeholder="Your name"
              error={!!errors.name}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Email Address" htmlFor="contact-email" required error={errors.email}>
              <Input
                id="contact-email"
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
            <FormField label="Phone Number" htmlFor="contact-phone" required error={errors.phone}>
              <Input
                id="contact-phone"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  clearError("phone");
                }}
                placeholder="10-digit phone number"
                error={!!errors.phone}
              />
            </FormField>
          </div>

          <FormField label="Company Name" htmlFor="contact-company" required error={errors.company}>
            <Input
              id="contact-company"
              value={formData.company}
              onChange={(e) => {
                setFormData({ ...formData, company: e.target.value });
                clearError("company");
              }}
              placeholder="Business name"
              error={!!errors.company}
            />
          </FormField>

          <FormField label="Message" htmlFor="contact-message" required error={errors.message}>
            <Textarea
              id="contact-message"
              rows={4}
              value={formData.message}
              onChange={(e) => {
                setFormData({ ...formData, message: e.target.value });
                clearError("message");
              }}
              placeholder="How can we assist your business today?"
              error={!!errors.message}
            />
          </FormField>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-white shadow-md shadow-primary/10 transition-all hover:bg-primary-hover disabled:bg-slate-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Message...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Inquiry
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
