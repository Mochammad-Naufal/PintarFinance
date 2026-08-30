/**
 * Utility for client-side image resizing and compression to WebP format.
 * Optimizes mobile photo uploads (<50KB typical) using HTML5 Canvas API.
 */

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
}

export async function compressImageToWebP(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const { maxDimension = 400, quality = 0.82 } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("File yang dipilih bukan merupakan gambar."));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;

        // Calculate aspect ratio preserving resize
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, width);
        canvas.height = Math.max(1, height);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Gagal menginisialisasi Canvas Context"));
          return;
        }

        // Draw image into canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to WebP Base64 Data URL
        try {
          const webpDataUrl = canvas.toDataURL("image/webp", quality);
          resolve(webpDataUrl);
        } catch {
          // Fallback to JPEG if WebP canvas export is unsupported in ancient browser
          const jpegDataUrl = canvas.toDataURL("image/jpeg", quality);
          resolve(jpegDataUrl);
        }
      };

      img.onerror = () => {
        reject(new Error("Gagal memuat gambar untuk proses kompresi."));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Gagal membaca file dari perangkat."));
    };

    reader.readAsDataURL(file);
  });
}
