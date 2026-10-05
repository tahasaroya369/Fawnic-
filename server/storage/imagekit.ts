import fs from 'fs';
import path from 'path';
import ImageKit from 'imagekit';

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
  isPersistentImageKit: boolean;
}

export interface ImageKitUploadOptions {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  folder?: string;
  uploadedBy?: string;
}

let imagekitInstance: ImageKit | null = null;
let initialized = false;

export function getImageKitClient(): ImageKit | null {
  const publicKey = process.env.IMAGEKIT_PUBLIC_KEY;
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

  if (!publicKey || !privateKey || !urlEndpoint) {
    if (!initialized) {
      console.info(
        '[ImageKit] Note: IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, or IMAGEKIT_URL_ENDPOINT not detected. Using local fallback until ImageKit credentials are set in environment variables.'
      );
      initialized = true;
    }
    return null;
  }

  if (!imagekitInstance) {
    imagekitInstance = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint: urlEndpoint.replace(/\/+$/, ''),
    });
  }

  return imagekitInstance;
}

/**
 * Uploads media to ImageKit.
 * If ImageKit credentials are not yet configured, gracefully falls back to local storage.
 */
export async function uploadMedia(options: ImageKitUploadOptions): Promise<ImageKitUploadResult> {
  const { buffer, filename, mimeType, folder = 'products', uploadedBy = 'admin' } = options;
  const ik = getImageKitClient();

  // Create clean safe name
  const ext = path.extname(filename) || (mimeType.includes('png') ? '.png' : mimeType.includes('webp') ? '.webp' : '.jpg');
  const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_-]/g, '-').slice(0, 32);
  const safeFilename = `${Date.now()}-${baseName}${ext}`;

  if (ik) {
    try {
      const response = await ik.upload({
        file: buffer,
        fileName: safeFilename,
        folder: folder.startsWith('/') ? folder : `/${folder}`,
        useUniqueFileName: true,
        tags: ['fawnic', folder],
      });

      console.info(`[ImageKit] Successfully uploaded media: ${response.url} (fileId: ${response.fileId})`);

      return {
        url: response.url,
        fileId: response.fileId,
        name: response.name,
        size: response.size || buffer.length,
        mimeType,
        thumbnailUrl: response.thumbnailUrl,
        isPersistentImageKit: true,
      };
    } catch (err: any) {
      console.error('[ImageKit] Upload failed, falling back to local storage:', err.message);
    }
  }

  // Graceful local fallback for development / before ImageKit credentials are added
  const uploadsDir = path.join(process.cwd(), 'data', 'uploads', folder);
  try {
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const safeLocalName = `${Date.now()}-${baseName}${ext}`;
    const filePath = path.join(uploadsDir, safeLocalName);
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/${folder}/${safeLocalName}`;
    return {
      url: publicUrl,
      fileId: `local_${safeLocalName}`,
      name: safeLocalName,
      size: buffer.length,
      mimeType,
      isPersistentImageKit: false,
    };
  } catch {
    // If local disk is read-only (e.g. serverless without ImageKit), use /tmp
    const tmpDir = path.join('/tmp', 'uploads', folder);
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    const safeLocalName = `${Date.now()}-${baseName}${ext}`;
    fs.writeFileSync(path.join(tmpDir, safeLocalName), buffer);

    return {
      url: `/uploads/${folder}/${safeLocalName}`,
      fileId: `tmp_${safeLocalName}`,
      name: safeLocalName,
      size: buffer.length,
      mimeType,
      isPersistentImageKit: false,
    };
  }
}

/**
 * Deletes media from ImageKit when a product image is replaced or removed.
 */
export async function deleteMedia(fileIdOrUrl: string): Promise<boolean> {
  if (!fileIdOrUrl) return false;
  const ik = getImageKitClient();
  if (!ik) return false;

  try {
    let targetFileId = fileIdOrUrl;

    // If an ImageKit URL was provided, attempt to locate the file by name
    if (fileIdOrUrl.startsWith('http://') || fileIdOrUrl.startsWith('https://')) {
      try {
        const parsed = new URL(fileIdOrUrl);
        const fileName = path.basename(parsed.pathname);

        const list = await ik.listFiles({ searchQuery: `name="${fileName}"`, limit: 1 });
        if (list && list.length > 0 && (list[0] as any).fileId) {
          targetFileId = (list[0] as any).fileId;
        } else {
          return false;
        }
      } catch {
        return false;
      }
    }

    if (targetFileId && !targetFileId.startsWith('http') && !targetFileId.startsWith('/')) {
      await ik.deleteFile(targetFileId);
      console.info(`[ImageKit] Successfully deleted media: ${targetFileId}`);
      return true;
    }
  } catch (err: any) {
    console.warn(`[ImageKit] Note: Could not delete media (${fileIdOrUrl}):`, err.message);
  }
  return false;
}
