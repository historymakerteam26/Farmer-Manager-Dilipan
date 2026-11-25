import { v2 as cloudinary } from "cloudinary";

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });
}

export async function uploadImage(fileBase64: string, folder = "farmer-crm"): Promise<string> {
  // If not configured with Cloudinary credentials, return the base64 string or mock URL
  // so the user can test photo upload without needing an active Cloudinary account immediately.
  if (!isCloudinaryConfigured) {
    // Check if it's already a data URL
    if (fileBase64.startsWith("data:image/")) {
      return fileBase64;
    }
    return `data:image/jpeg;base64,${fileBase64}`;
  }

  try {
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder,
      resource_type: "image",
      transformation: [
        { width: 1000, height: 1000, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" },
      ],
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload failed, falling back to data URL:", error);
    if (fileBase64.startsWith("data:image/")) {
      return fileBase64;
    }
    return `data:image/jpeg;base64,${fileBase64}`;
  }
}
