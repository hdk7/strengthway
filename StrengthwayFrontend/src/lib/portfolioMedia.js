/**
 * Portfolio Media Resolver Utility
 *
 * Resolves local assets (e.g. "/assets/portfolio-photo-1.jpg") to their
 * Vite-bundled URLs, while safely preserving Cloudinary, external http(s),
 * blob, and base64 data URLs.
 */

const localAssets = import.meta.glob("@/assets/*", { eager: true, import: "default" });

export function resolveMediaUrl(url) {
  if (!url || typeof url !== "string") return "";

  const trimmed = url.trim();
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  // Extract base filename (e.g., "/assets/portfolio-photo-1.jpg" -> "portfolio-photo-1.jpg")
  const filename = trimmed.split("/").pop();
  if (!filename) return trimmed;

  const matchedKey = Object.keys(localAssets).find((key) => key.endsWith(`/${filename}`));
  if (matchedKey && localAssets[matchedKey]) {
    return localAssets[matchedKey];
  }

  return trimmed;
}

export default resolveMediaUrl;
