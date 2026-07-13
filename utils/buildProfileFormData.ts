import type { CompleteProfileData } from "@/types/auth";

function appendIfPresent(formData: FormData, key: string, value?: string | null) {
  if (value?.trim()) {
    formData.append(key, value.trim());
  }
}

function appendFile(formData: FormData, key: string, file: File | null) {
  if (file) {
    formData.append(key, file, file.name);
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
    appendIfPresent(formData, "city", d.city);
    appendIfPresent(formData, "state", d.state);
    appendIfPresent(formData, "pincode", d.pincode);
    formData.append("country", d.country.trim() || "India");
    appendFile(formData, "profile_image", d.profileImageFile);
    return formData;
  }

  if (role === "seller") {
    formData.append("company_name", d.companyName.trim());
    formData.append("gst_number", d.gstNumber.trim());
    formData.append("pan_number", d.panNumber.trim());
    formData.append("business_description", d.businessDescription.trim());
    appendIfPresent(formData, "cin_number", d.cinNumber);
    appendIfPresent(formData, "iec_number", d.iecNumber);
    appendFile(formData, "company_logo", d.companyLogoFile);
    appendFile(formData, "company_banner", d.companyBannerFile);
    return formData;
  }

  // buyer + seller (matches Postman multipart PUT /auth/profile)
  formData.append("country", d.country.trim() || "India");
  formData.append("company_name", d.companyName.trim());
  formData.append("industry", d.industry.trim());
  formData.append("gst_number", d.gstNumber.trim());
  formData.append("pan_number", d.panNumber.trim());
  formData.append("business_description", d.businessDescription.trim());
  formData.append("address_line_1", d.address.trim());
  appendIfPresent(formData, "city", d.city);
  appendIfPresent(formData, "state", d.state);
  appendIfPresent(formData, "pincode", d.pincode);
  appendFile(formData, "profile_image", d.profileImageFile);
  appendFile(formData, "company_logo", d.companyLogoFile);
  appendFile(formData, "company_banner", d.companyBannerFile);

  return formData;
}
