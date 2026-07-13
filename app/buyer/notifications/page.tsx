"use client";

import React from "react";
import { Bell } from "lucide-react";
import PortalPageHeader from "@/components/portal/PortalPageHeader";
import PortalEmptyState from "@/components/portal/PortalEmptyState";

const demoNotifications = [
  { id: "1", title: "New quote received", body: "TechParts Solutions quoted on your LED inquiry", time: "2h ago" },
  { id: "2", title: "Supplier responded", body: "Acme Textiles replied to your RFQ", time: "1d ago" },
];

export default function BuyerNotificationsPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-5 sm:px-6 lg:px-8">
      <PortalPageHeader title="Notifications" />
      {demoNotifications.length === 0 ? (
        <PortalEmptyState icon={Bell} title="All caught up" description="No new notifications." />
      ) : (
        <div className="space-y-3">
          {demoNotifications.map((n) => (
            <div key={n.id} className="rounded-2xl border border-border bg-white p-4">
              <p className="font-extrabold text-foreground">{n.title}</p>
              <p className="mt-1 text-sm text-muted-fg">{n.body}</p>
              <p className="mt-2 text-xs text-muted-fg">{n.time}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
