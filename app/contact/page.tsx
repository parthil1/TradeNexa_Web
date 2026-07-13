"use client";

import React from "react";
import ContactForm from "@/components/ContactForm";
import MarketplacePageHero from "@/components/catalog/marketplace/MarketplacePageHero";
import { MARKETPLACE_CONTAINER } from "@/components/catalog/marketplace/marketplaceLayout";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Contact() {
  const offices = [
    {
      city: "Corporate Office (New Delhi)",
      address: "B-22, Okhla Industrial Area, Phase-III, New Delhi, 110020",
      phone: "+91 11 4050 9000",
      email: "contact@tradenexa.com",
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MarketplacePageHero
        eyebrow="Support"
        title="Get in Touch with Our Team"
        subtitle="Have questions about platform integration, business verification, or bulk directory listings? Reach out directly."
      />

      <section className="flex-1 py-12 lg:py-16">
        <div className={MARKETPLACE_CONTAINER}>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ContactForm />
            </div>

            <div className="space-y-6 lg:col-span-5">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-navy">Our Office</h3>
                {offices.map((office, idx) => (
                  <div
                    key={idx}
                    className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card"
                  >
                    <h4 className="flex items-center gap-2 text-sm font-bold text-navy">
                      <MapPin className="h-4 w-4 text-primary" />
                      {office.city}
                    </h4>
                    <p className="pl-6 text-xs leading-relaxed text-muted-fg">{office.address}</p>
                    <div className="space-y-1 pl-6 text-xs text-muted-fg">
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-muted-fg" />
                        {office.phone}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted-fg" />
                        {office.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="space-y-2 rounded-2xl border border-border bg-card p-5 shadow-card">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-navy">
                    <Clock className="h-4 w-4 text-primary" />
                    Business Hours
                  </h4>
                  <div className="space-y-1 pl-6 text-xs text-muted-fg">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                    <p>Saturday: 9:00 AM - 2:00 PM</p>
                    <p className="font-semibold text-primary">Sunday: Closed</p>
                  </div>
                </div>

                <div className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-card">
                  <h4 className="text-sm font-bold text-navy">Connect Socially</h4>
                  <div className="flex gap-3">
                    {["facebook", "twitter", "linkedin", "instagram"].map((social) => (
                      <span
                        key={social}
                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-muted text-muted-fg transition hover:border-primary/30 hover:text-primary"
                        aria-label={social}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
