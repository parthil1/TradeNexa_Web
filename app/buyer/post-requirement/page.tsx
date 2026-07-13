"use client";

import React, { Suspense } from "react";
import PortalBackLink from "@/components/portal/PortalBackLink";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import CreateRfqForm from "@/components/rfq/CreateRfqForm";

function FormLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Progress skeleton */}
      <div className="animate-pulse rounded-xl border border-border bg-white p-6">
        <div className="mb-4 flex items-end justify-between">
          <div className="space-y-2">
            <div className="h-3 w-16 rounded bg-primary-soft"></div>
            <div className="h-5 w-32 rounded bg-primary-soft"></div>
          </div>
          <div className="h-3 w-20 rounded bg-primary-soft"></div>
        </div>
        <div className="mb-5 h-2 rounded-full bg-primary-soft"></div>
        <div className="flex justify-between">
          <div className="h-8 w-8 rounded-full bg-primary-soft"></div>
          <div className="h-8 w-8 rounded-full bg-primary-soft"></div>
          <div className="h-8 w-8 rounded-full bg-primary-soft"></div>
          <div className="h-8 w-8 rounded-full bg-primary-soft"></div>
        </div>
      </div>

      {/* Form skeleton */}
      <div className="animate-pulse rounded-xl border border-border bg-white p-6">
        <div className="mb-4 h-6 w-48 rounded bg-primary-soft"></div>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-24 rounded bg-primary-soft"></div>
            <div className="h-10 w-full rounded-lg bg-primary-soft"></div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="h-4 w-16 rounded bg-primary-soft"></div>
              <div className="h-10 w-full rounded-lg bg-primary-soft"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-primary-soft"></div>
              <div className="h-10 w-full rounded-lg bg-primary-soft"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-20 rounded bg-primary-soft"></div>
            <div className="h-20 w-full rounded-lg bg-primary-soft"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostRequirementPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <PortalBackLink href="/buyer/home" />
        <PortalPageHeader
          title="Post Requirement"
          subtitle="Create your RFQ to receive competitive quotes from verified suppliers"
        />
        <Suspense fallback={<FormLoadingSkeleton />}>
          <CreateRfqForm />
        </Suspense>
      </div>
    </div>
  );
}
