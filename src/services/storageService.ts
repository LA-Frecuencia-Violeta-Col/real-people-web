/**
 * storageService.ts
 * Servicio de carga de archivos hacia Cloudflare R2.
 *
 * Arquitectura: Presigned URL segura (sin exponer credenciales al frontend)
 *
 * Flujo:
 *   1. Browser solicita URL firmada temporal a nuestro servidor (POST /api/presign)
 *   2. Servidor genera la URL usando credenciales secretas de R2
 *   3. Browser sube el archivo DIRECTO a R2 con la URL temporal
 *   4. Browser recibe la URL pública permanente del archivo
 *
 * Estructura de carpetas en el bucket R2 (media/):
 *   ├── logos/        → logos del sitio, navbar, footer
 *   ├── hero/         → imagen o video de portada
 *   ├── backgrounds/  → fondos globales de la web
 *   ├── artists/      → fotos de artistas del lineup
 *   ├── experiences/  → fotos de experiencias
 *   ├── lodging/      → fotos de suites y galerías
 *   ├── tickets/      → imágenes de fondo de tiers
 *   └── branding/     → favicon, imágenes SEO, fuentes
 */

import { getAdminToken } from './configService';

export type MediaFolder =
  | 'logos'
  | 'hero'
  | 'backgrounds'
  | 'artists'
  | 'experiences'
  | 'lodging'
  | 'tickets'
  | 'branding';

export interface UploadResult {
  url: string;   // URL pública permanente del archivo en R2
  path: string;  // Path relativo en el bucket (ej: "logos/abc123.png")
}

/**
 * Convierte una imagen a formato WebP usando Canvas / createImageBitmap del navegador.
 * Mantiene intactos los archivos SVG, GIF, ya en WebP, fuentes y videos.
 */
export async function convertToWebP(file: File, quality = 0.85): Promise<File> {
  const type = file.type || '';
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // No convertir si no es imagen, o si es SVG, GIF o ya es WEBP
  const isImage = type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'bmp', 'tiff', 'heic', 'heif'].includes(ext);
  const isExcluded = type === 'image/svg+xml' || type === 'image/gif' || type === 'image/webp' || ['svg', 'gif', 'webp'].includes(ext);

  if (!isImage || isExcluded) {
    console.log(`[WebP Converter] ℹ️ Omitiendo conversión para: ${file.name} (tipo: ${type || ext})`);
    return file;
  }

  try {
    let width = 0;
    let height = 0;
    let imageSource: CanvasImageSource;

    // Intentar usando createImageBitmap (más rápido y confiable en navegadores modernos)
    if (typeof createImageBitmap === 'function') {
      const bitmap = await createImageBitmap(file);
      width = bitmap.width;
      height = bitmap.height;
      imageSource = bitmap;
    } else {
      // Fallback usando HTMLImageElement
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        const url = URL.createObjectURL(file);
        image.onload = () => {
          URL.revokeObjectURL(url);
          resolve(image);
        };
        image.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(err);
        };
        image.src = url;
      });
      width = img.width;
      height = img.height;
      imageSource = img;
    }

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.warn('[WebP Converter] ⚠️ No se pudo obtener context2d. Subiendo imagen original.');
      return file;
    }

    ctx.drawImage(imageSource, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/webp', quality);
    });

    if (!blob) {
      console.warn('[WebP Converter] ⚠️ Falló la conversión a blob WebP. Subiendo original.');
      return file;
    }

    const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp';
    const webpFile = new File([blob], newFileName, {
      type: 'image/webp',
      lastModified: Date.now(),
    });

    const origKB = (file.size / 1024).toFixed(1);
    const webpKB = (webpFile.size / 1024).toFixed(1);
    console.log(`[WebP Converter] ⚡ Convertido con éxito: ${file.name} (${origKB} KB) ➔ ${newFileName} (${webpKB} KB)`);

    return webpFile;
  } catch (err) {
    console.error('[WebP Converter] ❌ Error durante la conversión a WebP. Subiendo archivo original:', err);
    return file;
  }
}

/**
 * Sube un archivo a Cloudflare R2 a través del servidor Express (proxy seguro).
 * El archivo viaja: Browser → /api/upload (Express) → Cloudflare R2.
 * De esta forma, el navegador nunca habla directamente con R2 (sin problemas CORS).
 */
export async function uploadFile(
  file: File,
  folder: MediaFolder
): Promise<UploadResult> {
  // 1. Convertir imágenes (JPG, PNG, etc.) a WebP automáticamente antes de subir
  const fileToUpload = await convertToWebP(file);

  // 2. Validar el archivo (imágenes, videos o fuentes)
  const validation = validateMediaFile(fileToUpload);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 3. Obtener token de administrador
  const token = getAdminToken();

  // 4. Subir el archivo al servidor Express (que lo reenvía a R2)
  const contentType = fileToUpload.type || 'application/octet-stream';

  const uploadRes = await fetch(
    `/api/upload?folder=${encodeURIComponent(folder)}&name=${encodeURIComponent(fileToUpload.name)}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': contentType,
        'x-file-content-type': contentType,
      },
      body: fileToUpload,
    }
  );

  if (!uploadRes.ok) {
    // Capturar el texto real de la respuesta para debug
    const rawText = await uploadRes.text().catch(() => '');
    let errMsg = `Error ${uploadRes.status} al subir el archivo.`;
    try {
      const parsed = JSON.parse(rawText);
      errMsg = parsed.error || errMsg;
    } catch {
      // El servidor devolvió algo que no es JSON (ej: HTML de Nginx)
      errMsg = `Error ${uploadRes.status}: ${rawText.slice(0, 200) || 'Respuesta vacía del servidor'}`;
    }
    throw new Error(errMsg);
  }

  const { url } = await uploadRes.json();

  console.log(`[R2 Storage] ✅ Subido: ${url}`);
  return { url, path: url };
}

/**
 * Valida un archivo antes de subirlo.
 * Soporta imágenes, videos y fuentes con límites adecuados.
 */
export function validateMediaFile(
  file: File
): { valid: boolean; error?: string } {
  const type = file.type || '';
  const isImage = type.startsWith('image/');
  const isVideo = type.startsWith('video/');
  const isFont = type.startsWith('font/') || type.includes('font') || /\.(woff2?|ttf|otf)$/i.test(file.name);

  if (!isImage && !isVideo && !isFont) {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const validExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'mp4', 'webm', 'mov', 'm4v', 'avi', 'mkv', 'woff', 'woff2', 'ttf', 'otf'];
    if (!validExts.includes(ext)) {
      return {
        valid: false,
        error: 'Formato no permitido. Sube imágenes (JPG, PNG, WEBP), videos (MP4, MOV, WEBM) o fuentes.',
      };
    }
  }

  // Límite de tamaño: 100MB para videos, 15MB para imágenes/fuentes
  const isVid = isVideo || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.name);
  const maxBytes = isVid ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
  if (file.size > maxBytes) {
    const maxMB = isVid ? 100 : 15;
    return { valid: false, error: `El archivo excede el tamaño máximo permitido (${maxMB}MB).` };
  }

  return { valid: true };
}

export function validateImageFile(
  file: File,
  maxMB = 10
): { valid: boolean; error?: string } {
  return validateMediaFile(file);
}

/**
 * Extrae el path relativo del bucket desde una URL pública de R2.
 */
export function extractPathFromUrl(publicUrl: string): string | null {
  try {
    const publicBaseUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
    if (publicBaseUrl && publicUrl.includes(publicBaseUrl)) {
      return publicUrl.split(publicBaseUrl + '/')[1] || null;
    }
    return null;
  } catch {
    return null;
  }
}
