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
  existingImageUrls?: string[];
  existingVideoUrls?: string[];
  onRemoveExistingImage?: (index: number) => void;
  onRemoveExistingVideo?: (index: number) => void;
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
  existingImageUrls = [],
  existingVideoUrls = [],
  onRemoveExistingImage,
  onRemoveExistingVideo,
}: MediaUploadSectionProps) {
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const replaceImageIndexRef = useRef<number | null>(null);

  const existingGalleryCount = existingImageUrls.length + existingVideoUrls.length;
  const remaining =
    maxGalleryMedia - images.length - videos.length - existingGalleryCount;
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
    existingImageUrls.forEach((url, index) => {
      items.push({
        kind: "image",
        index,
        url,
        name: `Existing photo ${index + 1}`,
        source: "existing",
      });
    });
    images.forEach((file, index) => {
      if (imageUrls[index]) {
        items.push({
          kind: "image",
          index,
          url: imageUrls[index],
          name: file.name,
          file,
          source: "new",
        });
      }
    });
    existingVideoUrls.forEach((url, index) => {
      items.push({
        kind: "video",
        index,
        url,
        name: `Existing video ${index + 1}`,
        source: "existing",
      });
    });
    videos.forEach((file, index) => {
      if (videoUrls[index]) {
        items.push({
          kind: "video",
          index,
          url: videoUrls[index],
          name: file.name,
          file,
          source: "new",
        });
      }
    });
    return items;
  }, [thumbnail, thumbnailPreview, images, imageUrls, videos, videoUrls, existingImageUrls, existingVideoUrls]);

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
        if (item.source === "existing") {
          onRemoveExistingImage?.(item.index!);
        } else {
          onRemoveImage(item.index!);
        }
      } else if (item.source === "existing") {
        onRemoveExistingVideo?.(item.index!);
      } else {
        onRemoveVideo(item.index!);
      }
      setPreviewIndex(null);
    },
    [onThumbnailRemove, onRemoveImage, onRemoveVideo, onRemoveExistingImage, onRemoveExistingVideo]
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
        className="rounded-[20px] border border-border bg-card p-7 shadow-[0_1px_3px_rgba(15,23,42,0.06),0_8px_24px_-4px_rgba(15,23,42,0.08)] sm:p-8"
        aria-labelledby="media-section-title"
      >
        <div className="mb-6 flex items-start gap-3 border-b border-border pb-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <ImageIcon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 id="media-section-title" className="text-base font-semibold text-foreground">
              Media
            </h2>
            <p className="mt-0.5 text-sm text-muted-fg">Upload product images and videos</p>
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
              } else if (thumbnailPreview) {
                openPreview({ kind: "thumbnail", url: thumbnailPreview, name: "Thumbnail" });
              }
            }}
            error={thumbnailError}
          />

          <GalleryGrid
            images={images}
            imageUrls={imageUrls}
            videos={videos}
            videoUrls={videoUrls}
            existingImageUrls={existingImageUrls}
            existingVideoUrls={existingVideoUrls}
            canAddMore={canAddMore}
            imageInputRef={imageInputRef}
            videoInputRef={videoInputRef}
            onAddImages={handleImageInputChange}
            onAddVideos={onAddVideos}
            onRemoveImage={onRemoveImage}
            onRemoveVideo={onRemoveVideo}
            onRemoveExistingImage={onRemoveExistingImage}
            onRemoveExistingVideo={onRemoveExistingVideo}
            onReorderImages={onReorderImages}
            onReplaceImage={(index) => {
              replaceImageIndexRef.current = index;
              imageInputRef.current?.click();
            }}
            onPreviewExistingImage={(index) => {
              const url = existingImageUrls[index];
              if (url) openPreview({ kind: "image", index, url, name: `Photo ${index + 1}` });
            }}
            onPreviewExistingVideo={(index) => {
              const url = existingVideoUrls[index];
              if (url) openPreview({ kind: "video", index, url, name: `Video ${index + 1}` });
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
            imageCount={images.length + existingImageUrls.length}
            videoCount={videos.length + existingVideoUrls.length}
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
