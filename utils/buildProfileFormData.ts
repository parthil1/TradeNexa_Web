import type { CompleteProfileData } from "@/types/auth";

function appendIfPresent(formData: FormData, key: string, value?: string | null) {
  if (value?.trim()) {
    formData.append(key, value.trim());
  }
}

export function buildProfileFormData(payload: CompleteProfileData): FormData {
  const formData = new FormData();
  const d = payload.data;
  const { role } = payload;

  if (role === "buyer") {
    formData.append("company_name", d.companyName.trim());
    appendIfPresent(formData, "gst_number", d.gstNumber);
    formData.append("industry", d.industry.trim());
    formData.append("address_line_1", d.address.trim());
    formData.append("country", d.country.trim() || "India");
    if (d.profileImageFile) formData.append("profile_image", d.profileImageFile);
    return formData;
  }

  if (role === "seller") {
    formData.append("company_name", d.companyName.trim());
    formData.append("gst_number", d.gstNumber.trim());
    formData.append("pan_number", d.panNumber.trim());
    formData.append("business_description", d.businessDescription.trim());
    appendIfPresent(formData, "cin", d.cinNumber);
    appendIfPresent(formData, "iec", d.iecNumber);
    if (d.companyLogoFile) formData.append("company_logo", d.companyLogoFile);
    if (d.companyBannerFile) formData.append("company_banner", d.companyBannerFile);
    return formData;
  }

  // buyer + seller
  formData.append("company_name", d.companyName.trim());
  formData.append("industry", d.industry.trim());
  formData.append("gst_number", d.gstNumber.trim());
  formData.append("pan_number", d.panNumber.trim());
  formData.append("business_description", d.businessDescription.trim());
  formData.append("address_line_1", d.address.trim());
  formData.append("country", d.country.trim() || "India");
  if (d.profileImageFile) formData.append("profile_image", d.profileImageFile);
  if (d.companyLogoFile) formData.append("company_logo", d.companyLogoFile);
  if (d.companyBannerFile) formData.append("company_banner", d.companyBannerFile);

  return formData;
}
