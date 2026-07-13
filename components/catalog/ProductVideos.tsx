"use client";

import React from "react";
import { Play } from "lucide-react";
import PortalSection from "@/components/portal/PortalSection";
import type { ResolvedProductVideo } from "@/utils/catalogHelpers";

interface ProductVideosProps {
  videos: ResolvedProductVideo[];
  productName: string;
}

const cardClass = "rounded-2xl border border-border bg-card shadow-sm overflow-hidden";

export default function ProductVideos({ videos, productName }: ProductVideosProps) {
  if (videos.length === 0) return null;

  return (
    <PortalSection
      title="Product Videos"
      subtitle={`${videos.length} video${videos.length === 1 ? "" : "s"}`}
    >
      <div className={`grid gap-4 ${videos.length > 1 ? "md:grid-cols-2" : ""}`}>
        {videos.map((video, index) => (
          <div key={video.key} className={cardClass}>
            <div className="relative aspect-video bg-foreground">
              {video.type === "file" ? (
                <video
                  src={video.src}
                  controls
                  playsInline
                  preload="metadata"
                  className="h-full w-full bg-black object-contain"
                >
                  <track kind="captions" />
                </video>
              ) : (
                <iframe
                  src={video.embedUrl}
                  title={`${productName || "Product"} video ${index + 1}`}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              )}
            </div>
            <div className="flex items-center gap-2 border-t border-border px-4 py-2.5 text-xs font-semibold text-muted-fg">
              <Play className="h-3.5 w-3.5 text-primary" />
              {video.type === "youtube"
                ? "YouTube"
                : video.type === "vimeo"
                  ? "Vimeo"
                  : "Product video"}
            </div>
          </div>
        ))}
      </div>
    </PortalSection>
  );
}
