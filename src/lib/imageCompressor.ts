/**
 * Utility for client-side image resizing and compression to WebP format.
 * Converts mobile/desktop photo uploads to binary WebP Blob/File (<50KB typical)
 * using HTML5 Canvas API, completely avoiding bloated Base64 in auth cookies and forms.
 */

export interface CompressImageOptions {
  maxDimension?: number;
  quality?: number;
}

export interface CompressedImageResult {
  file: File;
  blob: Blob;
  dataUrl: string; // for instant local UI preview before upload
  sizeBytes: number;
}

/**
 * Compresses an image file to a binary WebP Blob & File, with instant dataUrl preview.
 */
export async function compressImageToWebPBlob(
  file: File,
  options: CompressImageOptions = {}
): Promise<CompressedImageResult> {
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

        // Export as binary WebP Blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              // Fallback to JPEG if WebP canvas export is unsupported
              canvas.toBlob(
                (jpegBlob) => {
                  if (!jpegBlob) {
                    reject(new Error("Gagal mengekspor gambar hasil kompresi."));
                    return;
                  }
                  const finalFile = new File([jpegBlob], "avatar.jpg", {
                    type: "image/jpeg",
                  });
                  const dataUrl = canvas.toDataURL("image/jpeg", quality);
                  resolve({
                    file: finalFile,
                    blob: jpegBlob,
                    dataUrl,
                    sizeBytes: jpegBlob.size,
                  });
                },
                "image/jpeg",
                quality
              );
              return;
            }

            const finalFile = new File([blob], "avatar.webp", {
              type: "image/webp",
            });
            const dataUrl = canvas.toDataURL("image/webp", quality);
            resolve({
              file: finalFile,
              blob,
              dataUrl,
              sizeBytes: blob.size,
            });
          },
          "image/webp",
          quality
        );
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

/**
 * Backward-compatible helper for cases needing string Data URL.
 */
export async function compressImageToWebP(
  file: File,
  options: CompressImageOptions = {}
): Promise<string> {
  const result = await compressImageToWebPBlob(file, options);
  return result.dataUrl;
}
