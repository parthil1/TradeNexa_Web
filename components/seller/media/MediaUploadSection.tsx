"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ImageIcon } from "lucide-react";
import ThumbnailUpload from "./ThumbnailUpload";
import GalleryGrid from "./GalleryGrid";
import MediaStatusBar from "./MediaStatusBar";
import MediaPreviewModal, { type MediaPreviewItem } from "./MediaPreviewModal";
import { DEFAULT_MAX_GALLERY_MEDIA, galleryMediaRoom } from "./mediaUtils";

export { DEFAULT_MAX_GALLERY_MEDIA };

export interface MediaUploadSectionProps {
  thumbnail: File | null;
  thumbnailPreview: string | null;
  images: File[];
  imageUrls: string[];
  videos: File[];
  videoUrls: string[];
  thumbnailInputRef: React.RefObject<HTMLInputElement | null>;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  onThumbnailSelect: (file: File | null) => void;
  onThumbnailRemove: () => void;
  onAddImages: (files: FileList | null) => void;
  onAddVideos: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: (index: number) => void;
  onReorderImages: (images: File[]) => void;
  onReplaceImage: (index: number, file: File) => void;
  thumbnailError?: string;
  galleryError?: string;
  maxGalleryMedia?: number;
}

export default function MediaUploadSection({
  thumbnail,
  thumbnailPreview,
  images,
  imageUrls,
  videos,
  videoUrls,
  thumbnailInputRef,
  imageInputRef,
  videoInputRef,
  onThumbnailSelect,
  onThumbnailRemove,
  onAddImages,
  onAddVideos,
  onRemoveImage,
  onRemoveVideo,
  onReorderImages,
  onReplaceImage,
  thumbnailError,
  galleryError,
  maxGalleryMedia = DEFAULT_MAX_GALLERY_MEDIA,
}: MediaUploadSectionProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const replaceImageIndexRef = useRef<number | null>(null);

  const remaining = galleryMediaRoom(images, videos, maxGalleryMedia);
  const canAddMore = remaining > 0;

  const previewItems = useMemo((): MediaPreviewItem[] => {
    const items: MediaPreviewItem[] = [];
    if (thumbnail && thumbnailPreview) {
      items.push({
        kind: "thumbnail",
        url: thumbnailPreview,
        name: thumbnail.name,
        file: thumbnail,
      });
    }
    images.forEach((file, index) => {
      if (imageUrls[index]) {
        items.push({
          kind: "image",
          index,
          url: imageUrls[index],
          name: file.name,
          file,
        });
      }
    });
    videos.forEach((file, index) => {
      if (videoUrls[index]) {
        items.push({
          kind: "video",
          index,
          url: videoUrls[index],
          name: file.name,
          file,
        });
      }
    });
    return items;
  }, [thumbnail, thumbnailPreview, images, imageUrls, videos, videoUrls]);

  const openPreview = useCallback(
    (item: MediaPreviewItem) => {
      const idx = previewItems.findIndex((p) => {
        if (item.kind === "thumbnail") return p.kind === "thumbnail";
        if (item.kind === "image") return p.kind === "image" && p.index === item.index;
        return p.kind === "video" && p.index === item.index;
      });
      setPreviewIndex(idx >= 0 ? idx : 0);
    },
    [previewItems]
  );

  const handlePreviewDelete = useCallback(
    (item: MediaPreviewItem) => {
      if (item.kind === "thumbnail") {
        onThumbnailRemove();
      } else if (item.kind === "image") {
        onRemoveImage(item.index!);
      } else {
        onRemoveVideo(item.index!);
      }
      setPreviewIndex(null);
    },
    [onThumbnailRemove, onRemoveImage, onRemoveVideo]
  );

  const handleImageInputChange = useCallback(
    (files: FileList | null) => {
      if (replaceImageIndexRef.current !== null && files?.[0]) {
        onReplaceImage(replaceImageIndexRef.current, files[0]);
        replaceImageIndexRef.current = null;
        return;
      }
      onAddImages(files);
    },
    [onAddImages, onReplaceImage]
  );

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="rounded-[20px] border border-slate-200/80 bg-white p-7 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-4px_rgba(15,23,42,0.08)] sm:p-8"
        aria-labelledby="media-section-title"
      >
        <div className="mb-6 flex items-start gap-3 border-b border-slate-100 pb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 id="media-section-title" className="text-base font-semibold text-slate-900">
              Media
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Upload product images and videos</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)] lg:items-start">
          <ThumbnailUpload
            previewUrl={thumbnailPreview}
            inputRef={thumbnailInputRef}
            onSelect={onThumbnailSelect}
            onRemove={onThumbnailRemove}
            onPreview={() => {
              if (thumbnail && thumbnailPreview) {
                openPreview({ kind: "thumbnail", url: thumbnailPreview, name: thumbnail.name });
              }
            }}
            error={thumbnailError}
          />

          <GalleryGrid
            images={images}
            imageUrls={imageUrls}
            videos={videos}
            videoUrls={videoUrls}
            canAddMore={canAddMore}
            imageInputRef={imageInputRef}
            videoInputRef={videoInputRef}
            onAddImages={handleImageInputChange}
            onAddVideos={onAddVideos}
            onRemoveImage={onRemoveImage}
            onRemoveVideo={onRemoveVideo}
            onReorderImages={onReorderImages}
            onReplaceImage={(index) => {
              replaceImageIndexRef.current = index;
              imageInputRef.current?.click();
            }}
            onPreviewImage={(index) => {
              const file = images[index];
              const url = imageUrls[index];
              if (file && url) openPreview({ kind: "image", index, url, name: file.name });
            }}
            onPreviewVideo={(index) => {
              const file = videos[index];
              const url = videoUrls[index];
              if (file && url) openPreview({ kind: "video", index, url, name: file.name });
            }}
            galleryError={galleryError}
          />
        </div>

        <div className="mt-6">
          <MediaStatusBar
            imageCount={images.length}
            videoCount={videos.length}
            maxTotal={maxGalleryMedia}
            remaining={remaining}
          />
        </div>
      </motion.section>

      <MediaPreviewModal
        items={previewItems}
        activeIndex={previewIndex}
        onClose={() => setPreviewIndex(null)}
        onNavigate={setPreviewIndex}
        onDelete={handlePreviewDelete}
      />
    </>
  );
}
