"use client";

import React from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import CompleteProfileForm from "@/components/portal/CompleteProfileForm";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth";
import { ArrowRight } from "lucide-react";

export default function CompleteProfileModal() {
  const {
    isCompleteProfileOpen,
    completeProfileRole,
    completeProfileState,
    skipCompleteProfile,
    completeProfileAction,
  } = useAuth();

  const role: UserRole = completeProfileRole || "buyer";

  const title =
    role === "seller"
      ? "Complete Seller Profile"
      : role === "both"
        ? "Complete Business Profile"
        : "Complete Buyer Profile";

  const handleSubmit = async (data: Parameters<typeof completeProfileAction>[0]["data"]) => {
    await completeProfileAction({ role, data });
  };

  if (!isCompleteProfileOpen) return null;

  const profileFooter = (
    <div className="space-y-3">
      <Button
        type="submit"
        form="complete-profile-form"
        fullWidth
        size="lg"
        loading={completeProfileState.loading}
        loadingText="Saving Profile..."
      >
        Save Profile
        <ArrowRight className="h-4 w-4" aria-hidden />
      </Button>
      <button
        type="button"
        onClick={skipCompleteProfile}
        className="w-full cursor-pointer text-center text-sm font-medium text-muted-fg transition-colors duration-200 hover:text-foreground"
      >
        Skip for now
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isCompleteProfileOpen}
      onClose={skipCompleteProfile}
      title={<span className="font-semibold text-foreground">{title}</span>}
      bodyClassName="px-6 py-6"
      footer={profileFooter}
      maxWidth="md"
    >
      <CompleteProfileForm
        role={role}
        onSubmit={handleSubmit}
        loading={completeProfileState.loading}
        error={completeProfileState.error}
        fieldIdPrefix="cp"
        formId="complete-profile-form"
        showIntro
        hideSubmitButton
      />
    </Modal>
  );
}
