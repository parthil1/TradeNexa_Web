"use client";

import React from "react";
import EditProfileView from "@/components/portal/EditProfileView";

export default function SellerEditProfilePage() {
  return (
    <EditProfileView
      variant="seller"
      backHref="/seller/profile"
      profileHref="/seller/profile"
    />
  );
}
