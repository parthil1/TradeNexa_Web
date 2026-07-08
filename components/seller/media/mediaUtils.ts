export const MAX_THUMBNAIL_MB = 5;
export const DEFAULT_MAX_GALLERY_MEDIA = 10;

export function galleryMediaCount(images: File[], videos: File[]) {
  return images.length + videos.length;
}

export function galleryMediaRoom(images: File[], videos: File[], max = DEFAULT_MAX_GALLERY_MEDIA) {
  return max - galleryMediaCount(images, videos);
}

export function filterImageFiles(files: FileList | File[]) {
  return Array.from(files).filter((f) => f.type.startsWith("image/"));
}

export function filterVideoFiles(files: FileList | File[]) {
  return Array.from(files).filter((f) => f.type.startsWith("video/"));
}

export function fileKey(file: File, index: number) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export function formatDuration(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function imageItemId(file: File) {
  return `img-${file.name}-${file.size}-${file.lastModified}`;
}
