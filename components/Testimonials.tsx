"use client";

import React from "react";
import { Star, Quote, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

interface TestimonialItem {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
}

export default function Testimonials() {
  const testimonials: TestimonialItem[] = [
    {
      name: "Rajesh Kumar",
      role: "Managing Director",
      company: "Kumar Electronics & Cables",
      content: "Since listing our heavy machinery parts on the marketplace, we've received high-quality inquiries from buyers across states. The verification badge has significantly increased our business trust.",
      rating: 5,
    },
    {
      name: "Priya Sharma",
      role: "Founder",
      company: "EcoOrganic Agricultural Exports",
      content: "As a seller, building our profile was incredibly simple. Within weeks, we got connected with three major bulk distributors who found us via the industry directory. Exceptional B2B portal!",
      rating: 5,
    },
    {
      name: "Amit Patel",
      role: "Procurement Lead",
      company: "BuildTech Construction Ltd.",
      content: "We use the platform daily to search for steel and timber suppliers. It saves us weeks of catalog scanning because we can send inquiries and compare verified sellers instantly in one place.",
      rating: 4,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {testimonials.map((t, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-8 shadow-sm transition-all hover:shadow-md hover:border-slate-200"
        >
          {/* Quote Icon Overlay */}
          <div className="absolute right-6 top-6 text-slate-100">
            <Quote className="h-8 w-8" />
          </div>

          <div>
            {/* Stars */}
            <div className="mb-4 flex gap-1 text-slate-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 fill-current ${i < t.rating ? "text-slate-600" : "text-slate-200"}`}
                />
              ))}
            </div>
            
            {/* Feedback Content */}
            <p className="mb-6 text-sm italic leading-relaxed text-slate-600">
              &ldquo;{t.content}&rdquo;
            </p>
          </div>

          {/* Business Owner Profile */}
          <div className="flex items-center gap-3 pt-4 border-t border-slate-50">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
              {t.name.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-slate-900">{t.name}</span>
                <ShieldCheck className="h-4 w-4 text-primary fill-primary/10" />
              </div>
              <p className="text-xs text-slate-500">{t.role}, {t.company}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
