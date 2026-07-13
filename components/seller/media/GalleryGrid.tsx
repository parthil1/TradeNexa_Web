"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion, Reorder } from "framer-motion";
import { Eye, Film, Plus, RefreshCw, Trash2 } from "lucide-react";
import {
  filterImageFiles,
  filterVideoFiles,
  formatDuration,
  imageItemId,
} from "./mediaUtils";

interface ImageItem {
  id: string;
  file: File;
}

const GRID_CELL = "relative aspect-square w-full min-w-0";

function useVideoDuration(url: string | undefined) {
  const [duration, setDuration] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setDuration(null);
      return;
    }
    const video = document.createElement("video");
    video.preload = "metadata";
    video.src = url;
    const onMeta = () => setDuration(formatDuration(video.duration));
    video.addEventListener("loadedmetadata", onMeta);
    return () => {
      video.removeEventListener("loadedmetadata", onMeta);
      video.src = "";
    };
  }, [url]);

  return duration;
}

interface ImageCardProps {
  file: File;
  url: string;
  index: number;
  onRemove: () => void;
  onReplace: () => void;
  onPreview: () => void;
}

function ImageCard({ file, url, index, onRemove, onReplace, onPreview }: ImageCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="group absolute inset-0 cursor-grab overflow-hidden rounded-2xl border border-border bg-card shadow-sm active:cursor-grabbing hover:shadow-md"
    >
      <button
        type="button"
        onClick={onPreview}
        className="absolute inset-0 z-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={`Preview image ${index + 1}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={file.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </button>

      <span className="pointer-events-none absolute bottom-2 left-2 z-10 rounded-md bg-navy/75 px-1.5 py-0.5 text-[10px] font-bold text-white">
        #{index + 1}
      </span>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-muted-fg shadow-md transition hover:text-error lg:opacity-0 lg:group-hover:opacity-100"
        aria-label={`Remove ${file.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-navy/80 to-transparent px-2 pb-2 pt-7 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="pointer-events-auto flex items-center justify-center gap-1.5">
          <OverlayBtn label="Preview" onClick={onPreview}>
            <Eye className="h-3.5 w-3.5" />
          </OverlayBtn>
          <OverlayBtn label="Replace" onClick={onReplace}>
            <RefreshCw className="h-3.5 w-3.5" />
          </OverlayBtn>
          <OverlayBtn label="Remove" onClick={onRemove} danger>
            <Trash2 className="h-3.5 w-3.5" />
          </OverlayBtn>
        </div>
      </div>
    </motion.div>
  );
}

function OverlayBtn({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
        className={`flex h-7 w-7 items-center justify-center rounded-full shadow-sm ${
        danger ? "bg-error text-white" : "bg-white/95 text-foreground"
      }`}
      aria-label={label}
    >
      {children}
    </motion.button>
  );
}

interface VideoCardProps {
  file: File;
  url: string;
  onRemove: () => void;
  onPreview: () => void;
}

function VideoCard({ file, url, onRemove, onPreview }: VideoCardProps) {
  const duration = useVideoDuration(url);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2 }}
      className="group absolute inset-0 overflow-hidden rounded-2xl border border-border bg-navy shadow-sm hover:shadow-md"
    >
      <video src={url} className="h-full w-full object-cover opacity-90" muted playsInline />
      <button
        type="button"
        onClick={onPreview}
        className="absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={`Preview ${file.name}`}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Film className="h-4 w-4 text-white" />
        </div>
      </button>
      {duration ? (
        <span className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {duration}
        </span>
      ) : null}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-muted-fg shadow-md transition hover:text-error lg:opacity-0 lg:group-hover:opacity-100"
        aria-label={`Remove ${file.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}

interface UploadTileProps {
  variant: "photo" | "video";
  disabled: boolean;
  onClick: () => void;
  onDrop: (files: File[]) => void;
}

function UploadTile({ variant, disabled, onClick, onDrop }: UploadTileProps) {
  const [dragOver, setDragOver] = useState(false);
  const isPhoto = variant === "photo";
  const active = dragOver && !disabled;

  return (
    <div className={GRID_CELL}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={onClick}
        whileHover={disabled ? undefined : { scale: 1.02 }}
        whileTap={disabled ? undefined : { scale: 0.98 }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (disabled) return;
          const files = isPhoto
            ? filterImageFiles(e.dataTransfer.files)
            : filterVideoFiles(e.dataTransfer.files);
          if (files.length) onDrop(files);
        }}
        className={`absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed p-2 text-center transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-40 ${
          active
            ? "border-primary bg-primary/5 shadow-[0_0_0_3px_rgba(37,99,235,0.12)]"
            : "border-muted-fg bg-muted hover:border-primary/50 hover:bg-primary/[0.03]"
        }`}
        aria-label={isPhoto ? "Add photos — JPG, PNG, WebP" : "Add videos — MP4, MOV, WebM"}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
          {isPhoto ? (
            <Plus className="h-4 w-4 text-primary" />
          ) : (
            <Film className="h-4 w-4 text-primary" />
          )}
        </div>
        <p className="text-[11px] font-semibold leading-tight text-foreground">
          {isPhoto ? "Add Photos" : "Add Videos"}
        </p>
      </motion.button>
    </div>
  );
}

function ExistingUrlImageCard({
  url,
  index,
  onRemove,
  onPreview,
}: {
  url: string;
  index: number;
  onRemove?: () => void;
  onPreview: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group absolute inset-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md"
    >
      <button
        type="button"
        onClick={onPreview}
        className="absolute inset-0 z-0 h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={`Preview existing image ${index + 1}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" className="h-full w-full object-cover" />
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-muted-fg shadow-md transition hover:text-error"
          aria-label={`Remove existing image ${index + 1}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </motion.div>
  );
}

function ExistingUrlVideoCard({
  url,
  index,
  onRemove,
  onPreview,
}: {
  url: string;
  index: number;
  onRemove?: () => void;
  onPreview: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group absolute inset-0 overflow-hidden rounded-2xl border border-border bg-navy shadow-sm hover:shadow-md"
    >
      <video src={url} className="h-full w-full object-cover opacity-90" muted playsInline />
      <button
        type="button"
        onClick={onPreview}
        className="absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        aria-label={`Preview existing video ${index + 1}`}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
          <Film className="h-4 w-4 text-white" />
        </div>
      </button>
      {onRemove ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-muted-fg shadow-md transition hover:text-error"
          aria-label={`Remove existing video ${index + 1}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </motion.div>
  );
}

export interface GalleryGridProps {
  images: File[];
  imageUrls: string[];
  videos: File[];
  videoUrls: string[];
  canAddMore: boolean;
  imageInputRef: React.RefObject<HTMLInputElement | null>;
  videoInputRef: React.RefObject<HTMLInputElement | null>;
  onAddImages: (files: FileList | null) => void;
  onAddVideos: (files: FileList | null) => void;
  onRemoveImage: (index: number) => void;
  onRemoveVideo: (index: number) => void;
  onReorderImages: (images: File[]) => void;
  onReplaceImage: (index: number) => void;
  onPreviewImage: (index: number) => void;
  onPreviewVideo: (index: number) => void;
  galleryError?: string;
  existingImageUrls?: string[];
  existingVideoUrls?: string[];
  onRemoveExistingImage?: (index: number) => void;
  onRemoveExistingVideo?: (index: number) => void;
  onPreviewExistingImage?: (index: number) => void;
  onPreviewExistingVideo?: (index: number) => void;
}

export default function GalleryGrid({
  images,
  imageUrls,
  videos,
  videoUrls,
  canAddMore,
  imageInputRef,
  videoInputRef,
  onAddImages,
  onAddVideos,
  onRemoveImage,
  onRemoveVideo,
  onReorderImages,
  onReplaceImage,
  onPreviewImage,
  onPreviewVideo,
  galleryError,
  existingImageUrls = [],
  existingVideoUrls = [],
  onRemoveExistingImage,
  onRemoveExistingVideo,
  onPreviewExistingImage,
  onPreviewExistingVideo,
}: GalleryGridProps) {
  const openImagePicker = () => imageInputRef.current?.click();
  const openVideoPicker = () => videoInputRef.current?.click();
  const hasMedia =
    images.length > 0 ||
    videos.length > 0 ||
    existingImageUrls.length > 0 ||
    existingVideoUrls.length > 0;

  const imageItems = useMemo<ImageItem[]>(
    () => images.map((file) => ({ id: imageItemId(file), file })),
    [images]
  );

  const handleImageReorder = (reordered: ImageItem[]) => {
    onReorderImages(reordered.map((item) => item.file));
  };

  const handleImageDrop = (files: File[]) => {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    onAddImages(dt.files);
  };

  const handleVideoDrop = (files: File[]) => {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    onAddVideos(dt.files);
  };

  const uploadTiles = canAddMore ? (
    <>
      <UploadTile
        variant="photo"
        disabled={!canAddMore}
        onClick={openImagePicker}
        onDrop={handleImageDrop}
      />
      <UploadTile
        variant="video"
        disabled={!canAddMore}
        onClick={openVideoPicker}
        onDrop={handleVideoDrop}
      />
    </>
  ) : null;

  return (
    <div className="min-w-0 flex-1" data-form-field="gallery">
      <div className="mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-fg">Gallery</p>
        <p className="mt-0.5 text-xs text-muted-fg">
          {hasMedia
            ? "Product photos and demo videos"
            : "Add photos or videos to your product listing"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {!hasMedia ? uploadTiles : null}
        {existingImageUrls.map((url, index) => (
          <div key={`existing-image-${url}-${index}`} className={GRID_CELL}>
            <ExistingUrlImageCard
              url={url}
              index={index}
              onRemove={onRemoveExistingImage ? () => onRemoveExistingImage(index) : undefined}
              onPreview={() => onPreviewExistingImage?.(index)}
            />
          </div>
        ))}
        {existingVideoUrls.map((url, index) => (
          <div key={`existing-video-${url}-${index}`} className={GRID_CELL}>
            <ExistingUrlVideoCard
              url={url}
              index={index}
              onRemove={onRemoveExistingVideo ? () => onRemoveExistingVideo(index) : undefined}
              onPreview={() => onPreviewExistingVideo?.(index)}
            />
          </div>
        ))}
        <Reorder.Group
          axis="y"
          values={imageItems}
          onReorder={handleImageReorder}
          className="contents"
        >
          {imageItems.map((item, index) => (
            <Reorder.Item key={item.id} value={item} className={`${GRID_CELL} list-none`}>
              <ImageCard
                file={item.file}
                url={imageUrls[index] ?? ""}
                index={index}
                onRemove={() => onRemoveImage(index)}
                onReplace={() => onReplaceImage(index)}
                onPreview={() => onPreviewImage(index)}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>

        {videos.map((file, index) => (
          <div key={`vid-${file.name}-${file.size}-${index}`} className={GRID_CELL}>
            <VideoCard
              file={file}
              url={videoUrls[index] ?? ""}
              onRemove={() => onRemoveVideo(index)}
              onPreview={() => onPreviewVideo(index)}
            />
          </div>
        ))}

        {hasMedia ? uploadTiles : null}
      </div>

      <input
        ref={imageInputRef}
        id="gallery-photos"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onAddImages(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/mp4,video/quicktime,video/webm,video/*"
        multiple
        className="hidden"
        onChange={(e) => {
          onAddVideos(e.target.files);
          e.target.value = "";
        }}
      />

      {galleryError ? (
        <p role="alert" className="mt-3 text-xs font-medium text-error">
          {galleryError}
        </p>
      ) : null}
    </div>
  );
}
