"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { FormField, inputClassName } from "@/components/common/FormField";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import MediaUploadSection from "@/components/seller/media/MediaUploadSection";
import ProductWizardStepper from "@/components/seller/ProductWizardStepper";
import DeleteProductButton from "@/components/seller/DeleteProductButton";
import { fetchCategories, fetchSubcategories, fetchProductById } from "@/services/catalogService";
import { fetchBrandsPage } from "@/services/brandsService";
import { createProduct, deleteProductMedia, updateProduct } from "@/services/productService";
import { fetchSellerId } from "@/services/profileService";
import { useAuth } from "@/hooks/useAuth";
import { showErrorToast, showSuccessToast } from "@/utils/toast";
import type { ApiCategory, ApiSubcategory } from "@/types/catalog";
import type { ApiBrand } from "@/types/brand";
import type {
  CreateProductFormData,
  ExistingProductMedia,
  ProductApprovalStatus,
  ProductCondition,
  ProductSpecificationRow,
  RemovedProductMediaIds,
  StockStatus,
} from "@/types/product";
import {
  EMPTY_EXISTING_PRODUCT_MEDIA,
  EMPTY_REMOVED_PRODUCT_MEDIA_IDS,
} from "@/types/product";
import {
  existingGalleryUrls,
  existingThumbnailUrl,
  existingVideoUrls,
  extractExistingProductMedia,
  mapProductDetailToFormData,
} from "@/utils/mapProductToFormData";
import { toFormString } from "@/utils/buildProductFormData";
import {
  approvalStatusHint,
  canSellerEditProduct,
} from "@/utils/productApprovalHelpers";
import ProductApprovalBadge from "@/components/seller/ProductApprovalBadge";
import Link from "next/link";

const PRODUCT_CONDITIONS: { value: ProductCondition; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "USED", label: "Used" },
  { value: "REFURBISHED", label: "Refurbished" },
];

const STOCK_STATUSES: { value: StockStatus; label: string }[] = [
  { value: "IN_STOCK", label: "In Stock" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
  { value: "LIMITED", label: "Limited" },
  { value: "MADE_TO_ORDER", label: "Made to Order" },
];

const UNITS = [
  { value: "pcs", label: "Pieces (pcs)" },
  { value: "kg", label: "Kilograms (kg)" },
  { value: "tons", label: "Tons" },
  { value: "liters", label: "Liters" },
  { value: "meters", label: "Meters" },
  { value: "boxes", label: "Boxes" },
];

const CURRENCIES = [{ value: "INR", label: "INR (₹)" }];

const MAX_GALLERY_MEDIA = 10;

function galleryMediaCount(images: File[], videos: File[]) {
  return images.length + videos.length;
}

function galleryMediaRoom(images: File[], videos: File[]) {
  return MAX_GALLERY_MEDIA - galleryMediaCount(images, videos);
}

function totalGalleryCount(
  images: File[],
  videos: File[],
  existing: ExistingProductMedia
) {
  return galleryMediaCount(images, videos) + existing.galleryImages.length + existing.videos.length;
}

function galleryMediaRoomWithExisting(
  images: File[],
  videos: File[],
  existing: ExistingProductMedia
) {
  return MAX_GALLERY_MEDIA - totalGalleryCount(images, videos, existing);
}

function appendGalleryMedia(
  prev: CreateProductFormData,
  incoming: File[],
  kind: "images" | "videos",
  existing: ExistingProductMedia
): { next: CreateProductFormData; message?: string } {
  const room = galleryMediaRoomWithExisting(prev.images, prev.videos, existing);
  if (room <= 0) {
    return {
      next: prev,
      message: `Maximum ${MAX_GALLERY_MEDIA} items allowed. Remove some to add more.`,
    };
  }

  const toAdd = incoming.slice(0, room);
  const kindLabel = kind === "images" ? "photo(s)" : "video(s)";
  const message =
    incoming.length > room
      ? `Only ${room} ${kindLabel} added — ${MAX_GALLERY_MEDIA} photos + videos max combined.`
      : undefined;

  if (kind === "images") {
    return { next: { ...prev, images: [...prev.images, ...toAdd] }, message };
  }
  return { next: { ...prev, videos: [...prev.videos, ...toAdd] }, message };
}

const INITIAL_SPEC: ProductSpecificationRow = { key: "", value: "" };

function emptyForm(sellerId?: number): CreateProductFormData {
  return {
    thumbnail: null,
    images: [],
    videos: [],
    name: "",
    categoryId: 0,
    subcategoryId: 0,
    brandId: 0,
    shortDescription: "",
    description: "",
    price: "",
    currency: "INR",
    moq: "",
    unit: "pcs",
    material: "",
    countryOfOrigin: "India",
    productCondition: "NEW",
    stockStatus: "IN_STOCK",
    showPrice: true,
    acceptInquiry: true,
    isActive: true,
    sellerId: sellerId ?? 0,
    warranty: "",
    stockQuantity: "",
    hsnCode: "",
    gstPercentage: "",
    searchTags: "",
    specifications: [{ ...INITIAL_SPEC }],
    isTrending: false,
    rating: "",
  };
}

function Section({
  title,
  optional,
  children,
}: {
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card space-y-4 p-5">
      <h2 className="border-b border-border pb-2 text-sm font-semibold text-foreground">
        {title}
        {optional ? <span className="ml-2 text-xs font-normal text-muted-fg">(Optional)</span> : null}
      </h2>
      {children}
    </section>
  );
}

function ToggleField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
      />
      {label}
    </label>
  );
}

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
}

function useObjectUrls(files: File[]) {
  const [urls, setUrls] = useState<string[]>([]);

  useEffect(() => {
    const objectUrls = files.map((file) => URL.createObjectURL(file));
    setUrls(objectUrls);
    return () => objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [files]);

  return urls;
}

type ProductFormErrorKey =
  | "thumbnail"
  | "gallery"
  | "name"
  | "category"
  | "subcategory"
  | "brand"
  | "shortDescription"
  | "price"
  | "currency"
  | "moq"
  | "unit"
  | "material"
  | "countryOfOrigin"
  | "seller";

function getFormErrors(
  form: CreateProductFormData,
  sellerId: number | null,
  existingMedia: ExistingProductMedia,
  isUpdate: boolean
): Partial<Record<ProductFormErrorKey, string>> {
  const errors: Partial<Record<ProductFormErrorKey, string>> = {};

  const hasThumbnail = Boolean(
    form.thumbnail || (isUpdate && existingMedia.thumbnail)
  );
  if (!hasThumbnail) errors.thumbnail = "Thumbnail image is required.";
  if (!toFormString(form.name).trim()) errors.name = "Product name is required.";
  if (!form.categoryId) errors.category = "Please select a category.";
  if (!form.subcategoryId) errors.subcategory = "Please select a subcategory.";
  if (!form.brandId) errors.brand = "Please select a brand.";

  const shortLen = toFormString(form.shortDescription).trim().length;
  if (shortLen < 10 || shortLen > 500) {
    errors.shortDescription = "Short description must be between 10 and 500 characters.";
  }

  if (!toFormString(form.price).trim()) errors.price = "Price is required.";
  if (!toFormString(form.currency).trim()) errors.currency = "Currency is required.";
  if (!toFormString(form.moq).trim()) errors.moq = "MOQ is required.";
  if (!toFormString(form.unit).trim()) errors.unit = "Unit is required.";
  if (!toFormString(form.material).trim()) errors.material = "Material is required.";
  if (!toFormString(form.countryOfOrigin).trim()) {
    errors.countryOfOrigin = "Country of origin is required.";
  }

  if (totalGalleryCount(form.images, form.videos, existingMedia) > MAX_GALLERY_MEDIA) {
    errors.gallery = `Maximum ${MAX_GALLERY_MEDIA} gallery items allowed (photos + videos).`;
  }

  if (!sellerId) {
    errors.seller =
      "No seller account is linked to your profile. Complete your seller profile (company details, GST, PAN, logo) before listing products.";
  }

  return errors;
}

const FIELD_ERROR_ORDER: ProductFormErrorKey[] = [
  "seller",
  "thumbnail",
  "gallery",
  "name",
  "category",
  "subcategory",
  "brand",
  "shortDescription",
  "price",
  "currency",
  "moq",
  "unit",
  "material",
  "countryOfOrigin",
];

type WizardStepKey = "media" | "details" | "pricing" | "settings" | "additional";

const WIZARD_STEPS: { key: WizardStepKey; label: string; shortLabel: string }[] = [
  { key: "media", label: "Media", shortLabel: "Media" },
  { key: "details", label: "Product Details", shortLabel: "Details" },
  { key: "pricing", label: "Pricing & Stock", shortLabel: "Pricing" },
  { key: "settings", label: "Listing Settings", shortLabel: "Settings" },
  { key: "additional", label: "Additional Details", shortLabel: "Extra" },
];

const ERROR_KEYS_BY_STEP: Record<WizardStepKey, ProductFormErrorKey[]> = {
  media: ["seller", "thumbnail", "gallery"],
  details: ["seller", "name", "category", "subcategory", "brand", "shortDescription"],
  pricing: ["seller", "price", "currency", "moq", "unit", "material", "countryOfOrigin"],
  settings: ["seller"],
  additional: ["seller"],
};

function getFurthestValidStepIndex(
  form: CreateProductFormData,
  sellerId: number | null,
  existingMedia: ExistingProductMedia,
  isEditMode: boolean
): number {
  const fieldErrors = getFormErrors(form, sellerId, existingMedia, isEditMode);
  let furthest = 0;

  for (let stepIndex = 0; stepIndex < WIZARD_STEPS.length; stepIndex++) {
    const stepKey = WIZARD_STEPS[stepIndex].key;
    const relevantKeys = ERROR_KEYS_BY_STEP[stepKey];
    const hasError = relevantKeys.some((key) => fieldErrors[key]);
    if (hasError) break;
    furthest = stepIndex;
  }

  return furthest;
}

const STEP_INDEX_BY_ERROR: Partial<Record<ProductFormErrorKey, number>> = {
  seller: 0,
  thumbnail: 0,
  gallery: 0,
  name: 1,
  category: 1,
  subcategory: 1,
  brand: 1,
  shortDescription: 1,
  price: 2,
  currency: 2,
  moq: 2,
  unit: 2,
  material: 2,
  countryOfOrigin: 2,
};

const ERROR_KEY_BY_FORM_FIELD: Partial<Record<keyof CreateProductFormData, ProductFormErrorKey>> = {
  thumbnail: "thumbnail",
  images: "gallery",
  videos: "gallery",
  name: "name",
  categoryId: "category",
  subcategoryId: "subcategory",
  brandId: "brand",
  shortDescription: "shortDescription",
  price: "price",
  currency: "currency",
  moq: "moq",
  unit: "unit",
  material: "material",
  countryOfOrigin: "countryOfOrigin",
};

export default function AddProductForm({ productId }: { productId?: number } = {}) {
  const isEditMode = Boolean(productId && productId > 0);
  const router = useRouter();
  const { user, openCompleteProfileModal, isCompleteProfileOpen } = useAuth();
  const [sellerId, setSellerId] = useState<number | null>(null);
  const [sellerLoading, setSellerLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productLoading, setProductLoading] = useState(isEditMode);
  const [approvalStatus, setApprovalStatus] = useState<ProductApprovalStatus | null>(null);
  const [latestReviewRemarks, setLatestReviewRemarks] = useState<string | null>(null);
  const [form, setForm] = useState<CreateProductFormData>(() => emptyForm());
  const [existingMedia, setExistingMedia] = useState<ExistingProductMedia>(
    EMPTY_EXISTING_PRODUCT_MEDIA
  );
  const [removedMediaIds, setRemovedMediaIds] = useState<RemovedProductMediaIds>(
    EMPTY_REMOVED_PRODUCT_MEDIA_IDS
  );
  const [errors, setErrors] = useState<Partial<Record<ProductFormErrorKey, string>>>({});
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [maxReachedStepIndex, setMaxReachedStepIndex] = useState(0);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesPage, setCategoriesPage] = useState(1);
  const [categoriesHasMore, setCategoriesHasMore] = useState(false);
  const [categoriesLoadingMore, setCategoriesLoadingMore] = useState(false);

  const [subcategories, setSubcategories] = useState<ApiSubcategory[]>([]);
  const [subcategoriesLoading, setSubcategoriesLoading] = useState(false);
  const [subcategoriesPage, setSubcategoriesPage] = useState(1);
  const [subcategoriesHasMore, setSubcategoriesHasMore] = useState(false);
  const [subcategoriesLoadingMore, setSubcategoriesLoadingMore] = useState(false);

  const [brands, setBrands] = useState<ApiBrand[]>([]);
  const [brandsLoading, setBrandsLoading] = useState(true);
  const [brandsPage, setBrandsPage] = useState(1);
  const [brandsHasMore, setBrandsHasMore] = useState(false);
  const [brandsLoadingMore, setBrandsLoadingMore] = useState(false);

  const thumbnailPreview =
    useObjectUrl(form.thumbnail) ??
    (form.thumbnail ? null : existingThumbnailUrl(existingMedia));
  const galleryPreviews = useObjectUrls(form.images);
  const videoPreviews = useObjectUrls(form.videos);

  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const wasCompleteProfileOpen = useRef(false);

  const loadSeller = useCallback(async () => {
    setSellerLoading(true);
    try {
      const id = await fetchSellerId();
      setSellerId(id);
      if (id) {
        setForm((prev) => ({ ...prev, sellerId: id }));
        setErrors((prev) => {
          if (!prev.seller) return prev;
          const next = { ...prev };
          delete next.seller;
          return next;
        });
      }
    } catch {
      setSellerId(null);
    } finally {
      setSellerLoading(false);
    }
  }, []);

  function openSellerProfileSetup() {
    const role = user?.role === "buyer" ? "seller" : user?.role ?? "seller";
    openCompleteProfileModal(role);
  }

  function clearFieldError(key: ProductFormErrorKey) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function removeThumbnail() {
    updateForm("thumbnail", null);
    if (thumbnailInputRef.current) thumbnailInputRef.current.value = "";
  }

  function queueRemovedImageId(id: number) {
    if (id <= 0) return;
    setRemovedMediaIds((prev) =>
      prev.imageIds.includes(id) ? prev : { ...prev, imageIds: [...prev.imageIds, id] }
    );
  }

  function queueRemovedVideoId(id: number) {
    if (id <= 0) return;
    setRemovedMediaIds((prev) =>
      prev.videoIds.includes(id) ? prev : { ...prev, videoIds: [...prev.videoIds, id] }
    );
  }

  function handleThumbnailRemove() {
    if (form.thumbnail) {
      removeThumbnail();
    } else if (existingMedia.thumbnail) {
      removeExistingThumbnail();
    }
  }

  function removeExistingThumbnail() {
    if (existingMedia.thumbnail?.id) {
      queueRemovedImageId(existingMedia.thumbnail.id);
    }
    setExistingMedia((prev) => ({ ...prev, thumbnail: null }));
    clearFieldError("thumbnail");
  }

  function removeExistingGalleryImage(index: number) {
    const item = existingMedia.galleryImages[index];
    if (item?.id) queueRemovedImageId(item.id);
    setExistingMedia((prev) => ({
      ...prev,
      galleryImages: prev.galleryImages.filter((_, i) => i !== index),
    }));
    clearFieldError("gallery");
  }

  function removeExistingGalleryVideo(index: number) {
    const item = existingMedia.videos[index];
    if (item?.id) queueRemovedVideoId(item.id);
    setExistingMedia((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
    clearFieldError("gallery");
  }

  function removeGalleryImage(index: number) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    clearFieldError("gallery");
    if (galleryInputRef.current) galleryInputRef.current.value = "";
  }

  function removeGalleryVideo(index: number) {
    setForm((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
    clearFieldError("gallery");
    if (videoInputRef.current) videoInputRef.current.value = "";
  }

  function addGalleryImages(files: FileList | null) {
    if (!files?.length) return;
    const incoming = Array.from(files);
    setForm((prev) => {
      const { next, message } = appendGalleryMedia(prev, incoming, "images", existingMedia);
      if (message) queueMicrotask(() => showErrorToast(message));
      return next;
    });
    clearFieldError("gallery");
  }

  function addGalleryVideos(files: FileList | null) {
    if (!files?.length) return;
    const incoming = Array.from(files);
    setForm((prev) => {
      const { next, message } = appendGalleryMedia(prev, incoming, "videos", existingMedia);
      if (message) queueMicrotask(() => showErrorToast(message));
      return next;
    });
    clearFieldError("gallery");
  }

  function reorderGalleryImages(images: File[]) {
    setForm((prev) => ({ ...prev, images }));
  }

  function replaceGalleryImage(index: number, file: File) {
    setForm((prev) => ({
      ...prev,
      images: prev.images.map((img, i) => (i === index ? file : img)),
    }));
    clearFieldError("gallery");
  }

  useEffect(() => {
    void loadSeller();
  }, [loadSeller]);

  useEffect(() => {
    if (wasCompleteProfileOpen.current && !isCompleteProfileOpen) {
      void loadSeller();
    }
    wasCompleteProfileOpen.current = isCompleteProfileOpen;
  }, [isCompleteProfileOpen, loadSeller]);

  useEffect(() => {
    if (!isEditMode || !productId || sellerLoading) return;

    const editProductId = productId;
    let cancelled = false;

    async function loadProduct() {
      setProductLoading(true);
      try {
        const product = await fetchProductById(editProductId);
        if (cancelled || !product) return;

        const resolvedSellerId = sellerId ?? product.seller?.id ?? 0;
        const mappedForm = mapProductDetailToFormData(product, resolvedSellerId);
        const media = extractExistingProductMedia(product);
        const furthestStep = getFurthestValidStepIndex(
          mappedForm,
          resolvedSellerId || sellerId,
          media,
          true
        );

        setForm(mappedForm);
        setExistingMedia(media);
        setApprovalStatus(product.approval_status ?? null);
        setLatestReviewRemarks(product.latest_review_remarks ?? null);
        setActiveStepIndex(0);
        setMaxReachedStepIndex(furthestStep);
      } catch {
        if (!cancelled) showErrorToast("Failed to load product for editing");
      } finally {
        if (!cancelled) setProductLoading(false);
      }
    }

    void loadProduct();
    return () => {
      cancelled = true;
    };
  }, [isEditMode, productId, sellerId, sellerLoading]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      setCategoriesLoading(true);
      try {
        const { results, pagination } = await fetchCategories({ page: 1, limit: 20, is_active: true });
        if (cancelled) return;
        setCategories(results);
        setCategoriesPage(pagination.page || 1);
        setCategoriesHasMore(pagination.page < pagination.totalPages);
      } catch {
        if (!cancelled) setCategories([]);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!form.categoryId) {
      setSubcategories([]);
      setSubcategoriesHasMore(false);
      return;
    }

    let cancelled = false;

    async function loadSubcategories() {
      setSubcategoriesLoading(true);
      try {
        const { results, pagination } = await fetchSubcategories(form.categoryId, {
          page: 1,
          limit: 20,
          is_active: true,
        });
        if (cancelled) return;
        setSubcategories(results);
        setSubcategoriesPage(pagination.page || 1);
        setSubcategoriesHasMore(pagination.page < pagination.totalPages);
      } catch {
        if (!cancelled) setSubcategories([]);
      } finally {
        if (!cancelled) setSubcategoriesLoading(false);
      }
    }

    void loadSubcategories();
    return () => {
      cancelled = true;
    };
  }, [form.categoryId]);

  useEffect(() => {
    let cancelled = false;

    async function loadBrands() {
      setBrandsLoading(true);
      try {
        const { results, pagination } = await fetchBrandsPage(1, 20);
        if (cancelled) return;
        setBrands(results);
        setBrandsPage(pagination.page || 1);
        setBrandsHasMore(pagination.page < pagination.totalPages);
      } catch {
        if (!cancelled) setBrands([]);
      } finally {
        if (!cancelled) setBrandsLoading(false);
      }
    }

    void loadBrands();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMoreCategories = useCallback(async () => {
    if (categoriesLoadingMore || !categoriesHasMore) return;
    setCategoriesLoadingMore(true);
    try {
      const nextPage = categoriesPage + 1;
      const { results, pagination } = await fetchCategories({
        page: nextPage,
        limit: 20,
        is_active: true,
      });
      setCategories((prev) => {
        const seen = new Set(prev.map((c) => c.id));
        return [...prev, ...results.filter((c) => !seen.has(c.id))];
      });
      setCategoriesPage(pagination.page || nextPage);
      setCategoriesHasMore(pagination.page < pagination.totalPages);
    } finally {
      setCategoriesLoadingMore(false);
    }
  }, [categoriesLoadingMore, categoriesHasMore, categoriesPage]);

  const loadMoreSubcategories = useCallback(async () => {
    if (!form.categoryId || subcategoriesLoadingMore || !subcategoriesHasMore) return;
    setSubcategoriesLoadingMore(true);
    try {
      const nextPage = subcategoriesPage + 1;
      const { results, pagination } = await fetchSubcategories(form.categoryId, {
        page: nextPage,
        limit: 20,
        is_active: true,
      });
      setSubcategories((prev) => {
        const seen = new Set(prev.map((s) => s.id));
        return [...prev, ...results.filter((s) => !seen.has(s.id))];
      });
      setSubcategoriesPage(pagination.page || nextPage);
      setSubcategoriesHasMore(pagination.page < pagination.totalPages);
    } finally {
      setSubcategoriesLoadingMore(false);
    }
  }, [form.categoryId, subcategoriesLoadingMore, subcategoriesHasMore, subcategoriesPage]);

  const loadMoreBrands = useCallback(async () => {
    if (brandsLoadingMore || !brandsHasMore) return;
    setBrandsLoadingMore(true);
    try {
      const nextPage = brandsPage + 1;
      const { results, pagination } = await fetchBrandsPage(nextPage, 20);
      setBrands((prev) => {
        const seen = new Set(prev.map((b) => b.id));
        return [...prev, ...results.filter((b) => !seen.has(b.id))];
      });
      setBrandsPage(pagination.page || nextPage);
      setBrandsHasMore(pagination.page < pagination.totalPages);
    } finally {
      setBrandsLoadingMore(false);
    }
  }, [brandsLoadingMore, brandsHasMore, brandsPage]);

  function updateForm<K extends keyof CreateProductFormData>(key: K, value: CreateProductFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    const errorKey = ERROR_KEY_BY_FORM_FIELD[key];
    if (errorKey) clearFieldError(errorKey);
  }

  function updateSpec(index: number, field: keyof ProductSpecificationRow, value: string) {
    setForm((prev) => ({
      ...prev,
      specifications: prev.specifications.map((row, i) =>
        i === index ? { ...row, [field]: value } : row
      ),
    }));
  }

  function addSpecRow() {
    setForm((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { ...INITIAL_SPEC }],
    }));
  }

  function removeSpecRow(index: number) {
    setForm((prev) => ({
      ...prev,
      specifications:
        prev.specifications.length <= 1
          ? [{ ...INITIAL_SPEC }]
          : prev.specifications.filter((_, i) => i !== index),
    }));
  }

  const lastStepIndex = WIZARD_STEPS.length - 1;

  useEffect(() => {
    setActiveStepIndex((idx) => Math.min(idx, lastStepIndex));
    setMaxReachedStepIndex((idx) => Math.min(idx, lastStepIndex));
  }, [lastStepIndex]);

  function validateStep(stepIndex: number) {
    const stepKey = WIZARD_STEPS[stepIndex]?.key;
    if (!stepKey) return true;

    const fieldErrors = getFormErrors(form, sellerId, existingMedia, isEditMode);
    const relevantKeys = ERROR_KEYS_BY_STEP[stepKey];
    const errorKeys = FIELD_ERROR_ORDER.filter(
      (key) => relevantKeys.includes(key) && fieldErrors[key]
    );

    if (errorKeys.length > 0) {
      setErrors(fieldErrors);
      requestAnimationFrame(() => {
        document
          .querySelector(`[data-form-field="${errorKeys[0]}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      });
      return false;
    }

    return true;
  }

  function goToNextStep() {
    if (submitting) return;
    if (activeStepIndex >= lastStepIndex) return;
    const ok = validateStep(activeStepIndex);
    if (!ok) return;

    const nextIndex = activeStepIndex + 1;
    setErrors({});
    setActiveStepIndex(nextIndex);
    setMaxReachedStepIndex((prev) => Math.max(prev, nextIndex));
  }

  function goToPrevStep() {
    if (submitting) return;
    const prevIndex = Math.max(0, activeStepIndex - 1);
    setActiveStepIndex(prevIndex);
  }

  function goToStep(stepIndex: number) {
    if (submitting) return;
    if (stepIndex < 0 || stepIndex > maxReachedStepIndex) return;
    setActiveStepIndex(stepIndex);
    setErrors({});
  }

  async function submitProduct() {
    const fieldErrors = getFormErrors(form, sellerId, existingMedia, isEditMode);
    const errorKeys = FIELD_ERROR_ORDER.filter((key) => fieldErrors[key]);

    if (errorKeys.length > 0) {
      setErrors(fieldErrors);
      const targetStepIndex = STEP_INDEX_BY_ERROR[errorKeys[0]] ?? activeStepIndex;
      setActiveStepIndex(targetStepIndex);
      setMaxReachedStepIndex((prev) => Math.max(prev, targetStepIndex));
      setTimeout(() => {
        document
          .querySelector(`[data-form-field="${errorKeys[0]}"]`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }

    setErrors({});
    setSubmitting(true);
    try {
      const payload = { ...form, sellerId: sellerId as number };

      if (isEditMode && productId) {
        const imageIds = [...new Set(removedMediaIds.imageIds)];
        const videoIds = [...new Set(removedMediaIds.videoIds)];
        if (imageIds.length || videoIds.length) {
          await deleteProductMedia(productId, {
            ...(imageIds.length ? { image_ids: imageIds } : {}),
            ...(videoIds.length ? { video_ids: videoIds } : {}),
          });
        }
      }

      const product =
        isEditMode && productId
          ? await updateProduct(productId, payload)
          : await createProduct(payload);

      if (isEditMode) {
        showSuccessToast(
          approvalStatus === "revision_required"
            ? "Changes saved."
            : "Product updated. Material changes may require re-approval before buyers see them."
        );
      } else {
        showSuccessToast("Product created. It will appear to buyers after approval.");
      }

      router.push(
        product?.id
          ? `/seller/product/${product.id}`
          : "/seller/catalog"
      );
    } catch (err) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : isEditMode
            ? "Failed to update product"
            : "Failed to create product";
      showErrorToast(message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (isEditMode) {
      await submitProduct();
      return;
    }

    // Create mode: advance step-by-step until the final submit.
    if (activeStepIndex !== lastStepIndex) {
      const ok = validateStep(activeStepIndex);
      if (!ok) return;
      const nextIndex = activeStepIndex + 1;
      setErrors({});
      setActiveStepIndex(nextIndex);
      setMaxReachedStepIndex((prev) => Math.max(prev, nextIndex));
      return;
    }

    await submitProduct();
  }

  if (sellerLoading || productLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-fg">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading...
      </div>
    );
  }

  if (isEditMode && approvalStatus && !canSellerEditProduct(approvalStatus)) {
    return (
      <div className="space-y-4 rounded-xl border border-error/20 bg-error-soft p-6">
        <div className="flex flex-wrap items-center gap-2">
          <ProductApprovalBadge status={approvalStatus} />
          <h2 className="text-base font-semibold text-foreground">Editing blocked</h2>
        </div>
        <p className="text-sm text-muted-fg">
          {approvalStatusHint(approvalStatus) ??
            "This product was rejected and cannot be edited or resubmitted."}
        </p>
        {latestReviewRemarks ? (
          <p className="text-sm text-foreground">
            <span className="font-semibold">Admin remarks: </span>
            {latestReviewRemarks}
          </p>
        ) : null}
        <Link href={productId ? `/seller/product/${productId}` : "/seller/catalog"}>
          <Button>Back to product</Button>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {isEditMode && approvalStatus ? (
        <div
          className={`rounded-xl border px-4 py-3 ${
            approvalStatus === "revision_required"
              ? "border-warning/30 bg-warning-soft"
              : approvalStatus === "in_review"
                ? "border-warning/30 bg-warning-soft"
                : "border-success/20 bg-success-soft"
          }`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <ProductApprovalBadge status={approvalStatus} />
            <p className="text-sm text-muted-fg">
              {approvalStatus === "revision_required"
                ? "Save your changes after making the requested edits."
                : approvalStatusHint(approvalStatus)}
            </p>
          </div>
          {latestReviewRemarks ? (
            <p className="mt-2 text-sm text-foreground">
              <span className="font-semibold">Admin remarks: </span>
              {latestReviewRemarks}
            </p>
          ) : null}
        </div>
      ) : null}

      {!sellerId ? (
        <div
          className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3"
          data-form-field="seller"
        >
          <p className="text-sm font-medium text-foreground">
            Your account does not have a seller ID yet.
          </p>
          <p className="mt-1 text-sm text-muted-fg">
            Product creation needs a seller profile from the server. This usually happens if you
            skipped profile setup after signup, or have not submitted seller details (company name,
            GST, PAN, logo).
          </p>
          <Button type="button" size="sm" className="mt-3" onClick={openSellerProfileSetup}>
            Complete seller profile
          </Button>
        </div>
      ) : null}

      <ProductWizardStepper
        steps={WIZARD_STEPS}
        activeIndex={activeStepIndex}
        maxReachedIndex={maxReachedStepIndex}
        onStepClick={goToStep}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={activeStepIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {activeStepIndex === 0 ? (
        <MediaUploadSection
          thumbnail={form.thumbnail}
          thumbnailPreview={thumbnailPreview}
          images={form.images}
          imageUrls={galleryPreviews}
          videos={form.videos}
          videoUrls={videoPreviews}
          existingImageUrls={existingGalleryUrls(existingMedia)}
          existingVideoUrls={existingVideoUrls(existingMedia)}
          thumbnailInputRef={thumbnailInputRef}
          imageInputRef={galleryInputRef}
          videoInputRef={videoInputRef}
          onThumbnailSelect={(file) => updateForm("thumbnail", file)}
          onThumbnailRemove={handleThumbnailRemove}
          onAddImages={addGalleryImages}
          onAddVideos={addGalleryVideos}
          onRemoveImage={removeGalleryImage}
          onRemoveVideo={removeGalleryVideo}
          onRemoveExistingImage={removeExistingGalleryImage}
          onRemoveExistingVideo={removeExistingGalleryVideo}
          onReorderImages={reorderGalleryImages}
          onReplaceImage={replaceGalleryImage}
          thumbnailError={errors.thumbnail}
          galleryError={errors.gallery}
          maxGalleryMedia={MAX_GALLERY_MEDIA}
        />
      ) : null}

      {activeStepIndex === 1 ? (
        <Section title="Product Details">
        <FormField label="Name" htmlFor="name" fieldKey="name" required error={errors.name}>
          <Input
            id="name"
            value={form.name}
            onChange={(e) => updateForm("name", e.target.value)}
            placeholder="PIR Motion Detector HC-SR502"
            error={!!errors.name}
            aria-required
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category" htmlFor="category" fieldKey="category" required error={errors.category}>
            <Select
              id="category"
              value={form.categoryId ? String(form.categoryId) : ""}
              onChange={(e) => {
                updateForm("categoryId", Number(e.target.value));
                updateForm("subcategoryId", 0);
              }}
              placeholder={categoriesLoading ? "Loading..." : "Select category"}
              options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
              disabled={categoriesLoading}
              hasMore={categoriesHasMore}
              loadingMore={categoriesLoadingMore}
              onLoadMore={loadMoreCategories}
              error={!!errors.category}
              aria-required
            />
          </FormField>

          <FormField label="Subcategory" htmlFor="subcategory" fieldKey="subcategory" required error={errors.subcategory}>
            <Select
              id="subcategory"
              value={form.subcategoryId ? String(form.subcategoryId) : ""}
              onChange={(e) => updateForm("subcategoryId", Number(e.target.value))}
              placeholder={
                !form.categoryId
                  ? "Select category first"
                  : subcategoriesLoading
                    ? "Loading..."
                    : "Select subcategory"
              }
              options={subcategories.map((s) => ({ value: String(s.id), label: s.name }))}
              disabled={!form.categoryId || subcategoriesLoading}
              hasMore={subcategoriesHasMore}
              loadingMore={subcategoriesLoadingMore}
              onLoadMore={loadMoreSubcategories}
              error={!!errors.subcategory}
              aria-required
            />
          </FormField>
        </div>

        <FormField label="Brand" htmlFor="brand" fieldKey="brand" required error={errors.brand}>
          <Select
            id="brand"
            value={form.brandId ? String(form.brandId) : ""}
            onChange={(e) => updateForm("brandId", Number(e.target.value))}
            placeholder={brandsLoading ? "Loading..." : "Select brand"}
            options={brands.map((b) => ({ value: String(b.id), label: b.name }))}
            disabled={brandsLoading}
            hasMore={brandsHasMore}
            loadingMore={brandsLoadingMore}
            onLoadMore={loadMoreBrands}
            error={!!errors.brand}
            aria-required
          />
        </FormField>

        <FormField
          label="Short Description"
          htmlFor="shortDescription"
          fieldKey="shortDescription"
          required
          error={errors.shortDescription}
          hint={errors.shortDescription ? undefined : `${form.shortDescription.length}/500 characters (minimum 10)`}
        >
          <textarea
            id="shortDescription"
            rows={3}
            maxLength={500}
            value={form.shortDescription}
            onChange={(e) => updateForm("shortDescription", e.target.value)}
            placeholder="High-sensitivity PIR motion sensor module for security and automation projects."
            className={`${inputClassName(!!errors.shortDescription)} min-h-[88px] resize-y py-3`}
            aria-required
          />
        </FormField>

        <FormField label="Description" htmlFor="description">
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => updateForm("description", e.target.value)}
            placeholder="Detailed product description with features, applications, and packaging details."
            className={`${inputClassName()} min-h-[120px] resize-y py-3`}
          />
        </FormField>
        </Section>
      ) : null}

      {activeStepIndex === 2 ? (
        <Section title="Pricing & Stock">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Price" htmlFor="price" fieldKey="price" required error={errors.price}>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => updateForm("price", e.target.value)}
              placeholder="1499.50"
              error={!!errors.price}
              aria-required
            />
          </FormField>

          <FormField label="Currency" htmlFor="currency" fieldKey="currency" required error={errors.currency}>
            <Select
              id="currency"
              value={form.currency}
              onChange={(e) => updateForm("currency", e.target.value)}
              options={CURRENCIES}
              error={!!errors.currency}
              aria-required
            />
          </FormField>

          <FormField label="MOQ" htmlFor="moq" fieldKey="moq" required error={errors.moq}>
            <Input
              id="moq"
              type="number"
              min="1"
              value={form.moq}
              onChange={(e) => updateForm("moq", e.target.value)}
              placeholder="10"
              error={!!errors.moq}
              aria-required
            />
          </FormField>

          <FormField label="Unit" htmlFor="unit" fieldKey="unit" required error={errors.unit}>
            <Select
              id="unit"
              value={form.unit}
              onChange={(e) => updateForm("unit", e.target.value)}
              options={UNITS}
              error={!!errors.unit}
              aria-required
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Material" htmlFor="material" fieldKey="material" required error={errors.material}>
            <Input
              id="material"
              value={form.material}
              onChange={(e) => updateForm("material", e.target.value)}
              placeholder="ABS Plastic"
              error={!!errors.material}
              aria-required
            />
          </FormField>

          <FormField
            label="Country of Origin"
            htmlFor="countryOfOrigin"
            fieldKey="countryOfOrigin"
            required
            error={errors.countryOfOrigin}
          >
            <Input
              id="countryOfOrigin"
              value={form.countryOfOrigin}
              onChange={(e) => updateForm("countryOfOrigin", e.target.value)}
              placeholder="India"
              error={!!errors.countryOfOrigin}
              aria-required
            />
          </FormField>

          <FormField label="Condition" htmlFor="productCondition" required>
            <Select
              id="productCondition"
              value={form.productCondition}
              onChange={(e) => updateForm("productCondition", e.target.value as ProductCondition)}
              options={PRODUCT_CONDITIONS.map((c) => ({ value: c.value, label: c.label }))}
            />
          </FormField>

          <FormField label="Stock Status" htmlFor="stockStatus" required>
            <Select
              id="stockStatus"
              value={form.stockStatus}
              onChange={(e) => updateForm("stockStatus", e.target.value as StockStatus)}
              options={STOCK_STATUSES.map((s) => ({ value: s.value, label: s.label }))}
            />
          </FormField>
        </div>
        </Section>
      ) : null}

      {activeStepIndex === 3 ? (
        <Section title="Listing Settings">
        <div className="flex flex-wrap gap-6">
          <ToggleField
            id="showPrice"
            label="Show price"
            checked={form.showPrice}
            onChange={(checked) => updateForm("showPrice", checked)}
          />
          <ToggleField
            id="acceptInquiry"
            label="Accept inquiry"
            checked={form.acceptInquiry}
            onChange={(checked) => updateForm("acceptInquiry", checked)}
          />
          <ToggleField
            id="isActive"
            label="Active listing"
            checked={form.isActive}
            onChange={(checked) => updateForm("isActive", checked)}
          />
        </div>
        </Section>
      ) : null}

      {activeStepIndex === 4 ? (
        <Section title="Additional Details" optional>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FormField label="Warranty" htmlFor="warranty">
            <Input
              id="warranty"
              value={form.warranty}
              onChange={(e) => updateForm("warranty", e.target.value)}
              placeholder="12 months"
            />
          </FormField>

          <FormField label="Stock Quantity" htmlFor="stockQuantity">
            <Input
              id="stockQuantity"
              type="number"
              min="0"
              value={form.stockQuantity}
              onChange={(e) => updateForm("stockQuantity", e.target.value)}
              placeholder="500"
            />
          </FormField>

          <FormField label="HSN Code" htmlFor="hsnCode">
            <Input
              id="hsnCode"
              value={form.hsnCode}
              onChange={(e) => updateForm("hsnCode", e.target.value)}
              placeholder="85365090"
            />
          </FormField>

          <FormField label="GST %" htmlFor="gstPercentage">
            <Input
              id="gstPercentage"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={form.gstPercentage}
              onChange={(e) => updateForm("gstPercentage", e.target.value)}
              placeholder="18"
            />
          </FormField>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Search Tags" htmlFor="searchTags" hint="Comma-separated">
            <Input
              id="searchTags"
              value={form.searchTags}
              onChange={(e) => updateForm("searchTags", e.target.value)}
              placeholder="pir, sensor, motion detector"
            />
          </FormField>

          <FormField label="Rating" htmlFor="rating">
            <Input
              id="rating"
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={form.rating}
              onChange={(e) => updateForm("rating", e.target.value)}
              placeholder="4.5"
            />
          </FormField>
        </div>

        <ToggleField
          id="isTrending"
          label="Mark as trending"
          checked={form.isTrending}
          onChange={(checked) => updateForm("isTrending", checked)}
        />

        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">Specifications</p>
          {form.specifications.map((row, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  id={`spec-key-${index}`}
                  value={row.key}
                  onChange={(e) => updateSpec(index, "key", e.target.value)}
                  placeholder="Key (e.g. Voltage)"
                  className="flex-1"
                />
                <Input
                  id={`spec-value-${index}`}
                  value={row.value}
                  onChange={(e) => updateSpec(index, "value", e.target.value)}
                  placeholder="Value (e.g. 5V DC)"
                  className="flex-1"
                />
                <button
                  type="button"
                  onClick={() => removeSpecRow(index)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-muted-fg transition hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                  aria-label="Remove specification"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          <Button type="button" variant="outline" size="sm" onClick={addSpecRow}>
            <Plus className="h-4 w-4" />
            Add row
          </Button>
        </div>
      </Section>
      ) : null}

        </motion.div>
      </AnimatePresence>

      {isEditMode && productId ? (
        <div className="rounded-xl border border-error/20 bg-error-soft p-4">
          <p className="text-sm font-semibold text-error">Danger zone</p>
          <p className="mt-1 text-xs text-muted-fg">
            Permanently remove this listing from your catalog.
          </p>
          <div className="mt-3">
            <DeleteProductButton
              productId={productId}
              productName={form.name || "this product"}
              label="Delete Product"
            />
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 gap-3">
          {activeStepIndex > 0 ? (
            <Button
              type="button"
              variant="secondary"
              fullWidth
              size="md"
              onClick={goToPrevStep}
              disabled={submitting}
            >
              Back
            </Button>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
          {activeStepIndex < lastStepIndex ? (
            <Button
              type="button"
              variant={isEditMode ? "secondary" : "primary"}
              fullWidth
              size="md"
              onClick={goToNextStep}
              disabled={submitting}
            >
              Next
            </Button>
          ) : null}
          {isEditMode ? (
            <Button
              type="button"
              fullWidth
              size="md"
              loading={submitting}
              loadingText="Updating..."
              onClick={() => void submitProduct()}
            >
              Update Product
            </Button>
          ) : activeStepIndex >= lastStepIndex ? (
            <Button
              type="submit"
              fullWidth
              loading={submitting}
              loadingText="Submitting..."
            >
              Submit Product
            </Button>
          ) : null}
        </div>
      </div>
    </form>
  );
}
