"use client";

/** Read an image file, downscale to maxW px wide, return a JPEG/PNG data-URL. */
export function fileToDataUrl(file: File, maxW = 1600): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        if (img.width <= maxW) {
          resolve(reader.result as string);
          return;
        }
        const scale = maxW / img.width;
        const canvas = document.createElement("canvas");
        canvas.width = maxW;
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Could not load image"));
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
