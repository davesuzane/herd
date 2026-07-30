// src/utils/generateThumbnail.ts
export function generateThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.src = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(0.3, video.duration / 2);
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(video.src);
          blob
            ? resolve(blob)
            : reject(new Error("Could not generate thumbnail"));
        },
        "image/jpeg",
        0.8,
      );
    };

    video.onerror = () => reject(new Error("Could not read video"));
  });
}
