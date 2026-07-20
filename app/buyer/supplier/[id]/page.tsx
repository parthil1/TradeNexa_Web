"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  Clock3,
  Loader2,
  MapPin,
  Star,
  TrendingUp,
} from "lucide-react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import { Button } from "@/components/common/Button";
import { fetchSupplierById } from "@/services/supplierService";
import { getInitials, resolveImageUrl } from "@/utils/catalogHelpers";
import { showErrorToast } from "@/utils/toast";
import type { ApiSupplier } from "@/types/supplier";

function DetailRow({
  icon: Icon,
  label,
  value,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  index: number;
}) {
  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: 0.08 + index * 0.04, ease: "easeOut" }}
      className="group border-b border-border/80 last:border-b-0 odd:bg-card even:bg-primary-soft/25"
    >
      <th scope="row" className="px-4 py-3.5 text-left sm:px-5">
        <span className="inline-flex items-center gap-2.5 text-sm font-medium text-muted-fg">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-white">
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          {label}
        </span>
      </th>
      <td className="px-4 py-3.5 text-right text-sm font-semibold text-foreground sm:px-5">
        {value}
      </td>
    </motion.tr>
  );
}

export default function BuyerSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = Number(params.id);

  const [supplier, setSupplier] = useState<ApiSupplier | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    if (!supplierId || Number.isNaN(supplierId)) {
      setLoading(false);
      setSupplier(null);
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setSupplier(null);
      try {
        const data = await fetchSupplierById(supplierId);
        if (!cancelled) setSupplier(data);
      } catch (err) {
        if (cancelled) return;
        setSupplier(null);
        const message =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: unknown }).message ?? "")
            : "";
        showErrorToast(message.trim() || "Could not load seller profile");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  useEffect(() => {
    setLogoFailed(false);
  }, [supplier?.logo]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!supplier) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
        <PortalBackLink href="/buyer/home" />
        <p className="mt-6 text-sm text-muted-fg">Seller profile not found.</p>
        <Button
          type="button"
          variant="secondary"
          className="mt-4"
          onClick={() => router.back()}
        >
          Go back
        </Button>
      </div>
    );
  }

  const logoUrl = resolveImageUrl(supplier.logo);
  const showLogo = Boolean(logoUrl) && !logoFailed;
  const city = supplier.city?.trim() || "—";
  const state = supplier.state?.trim() || "—";
  const rating = supplier.rating ?? 0;
  const responseRate = supplier.response_rate ?? 0;
  const years = supplier.years_in_business ?? 0;
  const isInactive = supplier.is_active === false;

  const rows = [
    {
      icon: Star,
      label: "Rating",
      value: (
        <span className="inline-flex items-center gap-1.5">
          <span className="tabular-nums">{rating.toFixed(1)}</span>
          <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
        </span>
      ),
    },
    {
      icon: Clock3,
      label: "Years in business",
      value: <span className="tabular-nums">{years}</span>,
    },
    {
      icon: TrendingUp,
      label: "Response rate",
      value: (
        <span className="inline-flex items-center gap-2.5">
          <span className="tabular-nums">{responseRate}%</span>
          <span className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted sm:block">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, Math.max(0, responseRate))}%` }}
            />
          </span>
        </span>
      ),
    },
    {
      icon: MapPin,
      label: "City",
      value: city,
    },
    {
      icon: Building2,
      label: "State",
      value: state,
    },
  ];

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-5 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-2 h-44 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft)_0%,_transparent_70%)] opacity-90"
      />

      <div className="relative">
        <PortalBackLink href="/buyer/home" label="Back" />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mt-4"
        >
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
            {/* Hero band */}
            <div className="relative border-b border-border/70 bg-gradient-to-br from-primary-soft/80 via-card to-card px-5 pb-5 pt-6 sm:px-7 sm:pb-6 sm:pt-7">
              <div className="flex items-start gap-4 sm:gap-5">
                <span className="relative flex h-[4.5rem] w-[4.5rem] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-primary/10 bg-card text-2xl font-bold text-primary shadow-[var(--shadow-soft)] sm:h-24 sm:w-24 sm:text-3xl">
                  {showLogo ? (
                    <Image
                      src={logoUrl as string}
                      alt={supplier.company_name}
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      unoptimized
                      onError={() => setLogoFailed(true)}
                    />
                  ) : (
                    getInitials(supplier.company_name)
                  )}
                </span>

                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                    Supplier profile
                  </p>
                  <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                    {supplier.company_name}
                  </h1>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {supplier.verified ? (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1 text-xs font-semibold text-white">
                        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                        Verified
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {isInactive ? (
                <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-warning-soft px-4 py-3">
                  <AlertTriangle
                    className="mt-0.5 h-4 w-4 shrink-0 text-warning"
                    aria-hidden
                  />
                  <p className="text-xs font-medium leading-relaxed text-warning">
                    This seller is currently inactive and may not respond to new inquiries.
                  </p>
                </div>
              ) : null}
            </div>

            {/* Details table */}
            <div className="px-2 py-2 sm:px-3 sm:py-3">
              <table className="w-full overflow-hidden rounded-xl">
                <tbody>
                  {rows.map((row, index) => (
                    <DetailRow
                      key={row.label}
                      icon={row.icon}
                      label={row.label}
                      value={row.value}
                      index={index}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
