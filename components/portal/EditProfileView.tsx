"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalBackLink from "@/components/portal/PortalBackLink";
import CompleteProfileForm, {
  EMPTY_COMPLETE_PROFILE_FORM,
} from "@/components/portal/CompleteProfileForm";
import { fetchProfile } from "@/services/profileService";
import {
  getProfileLocationIds,
  mapProfileToCompleteProfileForm,
} from "@/utils/authHelpers";
import { useAuth } from "@/hooks/useAuth";
import type { CompleteProfileFormData, UserRole } from "@/types/auth";
import { portalMatchedPageContainerClass } from "@/components/portal/portalLayout";

interface EditProfileViewProps {
  variant: "buyer" | "seller";
  backHref: string;
  profileHref?: string;
}

function resolveProfileRole(userRole: UserRole | undefined): UserRole {
  if (!userRole || userRole === "both") return "both";
  return userRole;
}

export default function EditProfileView({ variant, backHref }: EditProfileViewProps) {
  const { user, completeProfileAction, completeProfileState } = useAuth();
  const [initialForm, setInitialForm] = useState<CompleteProfileFormData | null>(null);
  const [initialStateId, setInitialStateId] = useState("");
  const [initialCityId, setInitialCityId] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const role = useMemo(() => resolveProfileRole(user?.role), [user?.role]);

  const loadProfile = useCallback(async () => {
    setLoadingProfile(true);
    try {
      const profile = await fetchProfile();
      const locationIds = getProfileLocationIds(profile);
      setInitialForm(mapProfileToCompleteProfileForm(profile));
      setInitialStateId(locationIds.stateId);
      setInitialCityId(locationIds.cityId);
    } catch {
      setInitialForm({
        ...EMPTY_COMPLETE_PROFILE_FORM,
        companyName: user?.company ?? "",
        address: user?.address ?? "",
        city: user?.city ?? "",
        state: user?.state ?? "",
        pincode: user?.pincode ?? "",
      });
      setInitialStateId("");
      setInitialCityId("");
    } finally {
      setLoadingProfile(false);
    }
  }, [user?.address, user?.city, user?.company, user?.pincode, user?.state]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (data: CompleteProfileFormData) => {
    setSaveSuccess(false);
    const ok = await completeProfileAction({ role, data });
    if (ok) {
      await loadProfile();
      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const title = variant === "seller" ? "Edit Seller Profile" : "Edit Profile";

  return (
    <div className={portalMatchedPageContainerClass}>
      <PortalBackLink href={backHref} />
      <PortalPageHeader title={title} subtitle="Update your business profile details" />

      {saveSuccess ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-4 py-3 text-sm font-medium text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Profile updated successfully. Your changes are saved.
        </div>
      ) : null}

      <div className="mx-auto max-w-xl surface-card p-5 sm:p-6">
        {loadingProfile || !initialForm ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-fg">
            <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden />
            Loading profile...
          </div>
        ) : (
          <CompleteProfileForm
            key={`profile-${initialStateId}-${initialCityId}-${initialForm.city}-${initialForm.state}`}
            role={role}
            initialValues={initialForm}
            initialStateId={initialStateId || null}
            initialCityId={initialCityId || null}
            onSubmit={handleSubmit}
            loading={completeProfileState.loading}
            error={completeProfileState.error}
            fieldIdPrefix="ep"
            formId="edit-profile-form"
            showIntro
          />
        )}
      </div>
    </div>
  );
}
