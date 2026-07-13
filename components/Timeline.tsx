"use client";

import React from "react";
import { Calendar, Award, Globe, Users, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface TimelineItem {
  year: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function Timeline() {
  const items: TimelineItem[] = [
    {
      year: "2020",
      title: "Platform Conception",
      description: "Founded with a mission to bridge the digital gap for local micro, small and medium enterprises (MSMEs). Launched the beta directory.",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      year: "2022",
      title: "Nationwide Seller Network",
      description: "Expanded categories across 15+ industrial domains. Reached 2,000 verified sellers and integrated basic buyer-seller communication pathways.",
      icon: <Globe className="h-5 w-5" />,
    },
    {
      year: "2024",
      title: "Inquiry Management Launch",
      description: "Introduced advanced CRM dashboards for sellers and instant quote request forms for buyers, driving 3x faster transaction matching.",
      icon: <Award className="h-5 w-5" />,
    },
    {
      year: "2026",
      title: "Smart Recommendations & Premium",
      description: "Redesigned the entire ecosystem with AI-assisted product recommendation engines, active verification programs, and mobile-responsive portal.",
      icon: <TrendingUp className="h-5 w-5" />,
    },
  ];

  return (
    <div className="relative mx-auto max-w-4xl py-8">
      {/* Central Line */}
      <div className="absolute left-4 top-0 h-full w-0.5 bg-border sm:left-1/2 sm:-translate-x-1/2" />

      <div className="space-y-12">
        {items.map((item, index) => {
          const isEven = index % 2 === 0;
          return (
            <div key={index} className="relative flex flex-col sm:flex-row items-start sm:items-center">
              {/* Dot Icon */}
              <div className="absolute left-4 top-1.5 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border-4 border-card bg-primary text-white shadow sm:left-1/2">
                {item.icon}
              </div>

              {/* Box */}
              <div className={`w-full pl-12 sm:w-1/2 sm:pl-0 ${isEven ? "sm:pr-12 sm:text-right" : "sm:pl-12 sm:order-last"}`}>
                <motion.div
                  initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary mb-2">
                    {item.year}
                  </span>
                  <h4 className="text-lg font-bold text-foreground mb-1">{item.title}</h4>
                  <p className="text-sm text-muted-fg leading-relaxed">{item.description}</p>
                </motion.div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
