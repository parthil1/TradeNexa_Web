"use client";

import React from "react";
import EditProfileView from "@/components/portal/EditProfileView";

export default function BuyerEditProfilePage() {
  return (
    <EditProfileView
      variant="buyer"
      backHref="/buyer/profile"
      profileHref="/buyer/profile"
    />
  );
}
