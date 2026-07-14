import type { CompleteProfileData } from "@/types/auth";
import { INDIA_COUNTRY_ID } from "@/types/location";

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

/** Parse city/state field value into a positive numeric location id. */
function parseLocationId(value?: string | number | null): number | null {
  if (value == null) return null;
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.trunc(value) : null;
  }
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) return null;
  return Math.trunc(parsed);
}

function appendLocationIds(formData: FormData, city: string, state: string) {
  const cityId = parseLocationId(city);
  const stateId = parseLocationId(state);
  if (cityId != null) formData.append("city_id", String(cityId));
  if (stateId != null) formData.append("state_id", String(stateId));
  // Backend forbids updating `country` by name — send country_id only.
  formData.append("country_id", String(INDIA_COUNTRY_ID));
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
    appendLocationIds(formData, d.city, d.state);
    appendIfPresent(formData, "pincode", d.pincode);
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
  formData.append("company_name", d.companyName.trim());
  formData.append("industry", d.industry.trim());
  formData.append("gst_number", d.gstNumber.trim());
  formData.append("pan_number", d.panNumber.trim());
  formData.append("business_description", d.businessDescription.trim());
  formData.append("address_line_1", d.address.trim());
  appendLocationIds(formData, d.city, d.state);
  appendIfPresent(formData, "pincode", d.pincode);
  appendFile(formData, "profile_image", d.profileImageFile);
  appendFile(formData, "company_logo", d.companyLogoFile);
  appendFile(formData, "company_banner", d.companyBannerFile);

  return formData;
}
