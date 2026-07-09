"use client";

import React from "react";
import { Modal } from "@/components/common/Modal";
import CompleteProfileForm from "@/components/portal/CompleteProfileForm";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/types/auth";
import { ArrowRight, Loader2 } from "lucide-react";

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
      <button
        type="submit"
        form="complete-profile-form"
        disabled={completeProfileState.loading}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-blue-500 text-sm font-medium text-white transition hover:bg-blue-600 disabled:bg-slate-300"
      >
        {completeProfileState.loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving Profile...
          </>
        ) : (
          <>
            Save Profile
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
      <button
        type="button"
        onClick={skipCompleteProfile}
        className="w-full text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-700"
      >
        Skip for now
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isCompleteProfileOpen}
      onClose={skipCompleteProfile}
      title={<span className="font-semibold text-slate-900">{title}</span>}
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
