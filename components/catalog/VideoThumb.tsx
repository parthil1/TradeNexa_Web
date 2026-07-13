"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";

interface VideoThumbProps {
  src: string;
  poster?: string | null;
  alt?: string;
}

export default function VideoThumb({ src, poster, alt = "" }: VideoThumbProps) {
  const [frameUrl, setFrameUrl] = useState<string | null>(poster ?? null);

  useEffect(() => {
    if (poster) {
      setFrameUrl(poster);
      return;
    }

    let cancelled = false;
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.src = src;

    const captureFrame = () => {
      if (cancelled || !video.videoWidth) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setFrameUrl(canvas.toDataURL("image/jpeg", 0.82));
      } catch {
        // CORS or decode failure — keep play placeholder
      }
    };

    video.addEventListener("loadeddata", () => {
      if (cancelled) return;
      try {
        video.currentTime = Math.min(0.25, video.duration || 0.25);
      } catch {
        captureFrame();
      }
    });

    video.addEventListener("seeked", captureFrame);
    video.addEventListener("error", () => {
      if (!cancelled) setFrameUrl(null);
    });

    video.load();

    return () => {
      cancelled = true;
      video.removeAttribute("src");
      video.load();
    };
  }, [src, poster]);

  return (
    <>
      {frameUrl ? (
        <Image src={frameUrl} alt={alt} fill className="object-cover" unoptimized />
      ) : (
        <span className="absolute inset-0 bg-gradient-to-br from-foreground to-navy-mid" />
      )}
      <span className="absolute inset-0 flex items-center justify-center bg-black/20">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-card/95 text-primary shadow">
          <Play className="ml-0.5 h-4 w-4 fill-current" />
        </span>
      </span>
    </>
  );
}
