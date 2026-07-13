"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import PortalBackLink from "@/components/portal/PortalBackLink";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import CreateRfqForm from "@/components/rfq/CreateRfqForm";

export default function EditRfqPage() {
  const params = useParams();
  const rfqId = Number(params.id);
  const invalidId = !rfqId || Number.isNaN(rfqId);

  if (invalidId) {
  return (
    <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <PortalBackLink href="/buyer/inquiries" label="My RFQs" />
          <div className="rounded-xl border border-red-200 bg-red-50 p-6">
            <p className="text-sm text-red-700 font-medium">Invalid RFQ ID provided</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <PortalBackLink href={`/buyer/rfq/${rfqId}`} label="RFQ details" />
        <PortalPageHeader
          title="Edit Draft RFQ"
          subtitle="Update your requirement details and settings before publishing"
        />
        <Suspense
          fallback={
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
                </div>
              </div>
            </div>
          }
        >
          <CreateRfqForm rfqId={rfqId} />
        </Suspense>
      </div>
    </div>
  );
}
