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
 * Sube un archivo a Cloudflare R2 mediante Presigned URL segura.
 * Genera un nombre único para evitar colisiones de nombres.
 */
export async function uploadFile(
  file: File,
  folder: MediaFolder
): Promise<UploadResult> {
  // 1. Validar el archivo antes de cualquier petición
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // 2. Generar nombre único conservando la extensión original
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${folder}/${uniqueName}`;

  // 3. Pedir URL firmada temporal al servidor
  //    El servidor tiene las credenciales de R2, nosotros solo pedimos permiso
  const token = getAdminToken();
  const presignRes = await fetch('/api/presign', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ filename: path, contentType: file.type }),
  });

  if (!presignRes.ok) {
    const err = await presignRes.json().catch(() => ({ error: 'Error desconocido' }));
    throw new Error(err.error || 'Error al solicitar permiso de subida.');
  }

  const { url: presignedUrl } = await presignRes.json();

  // 4. Subir el archivo DIRECTAMENTE a Cloudflare R2
  //    No pasa por nuestro servidor → más rápido, sin límites de tamaño del servidor
  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error('Error al subir el archivo a Cloudflare R2.');
  }

  // 5. Construir la URL pública permanente
  //    VITE_R2_PUBLIC_URL = "https://pub-XXXX.r2.dev"
  const publicBaseUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
  const publicUrl = `${publicBaseUrl}/${path}`;

  console.log(`[R2 Storage] ✅ Subido: ${publicUrl}`);
  return { url: publicUrl, path };
}

/**
 * Valida un archivo antes de subirlo.
 * Verifica tipo MIME y tamaño máximo (10MB por defecto).
 */
export function validateImageFile(
  file: File,
  maxMB = 10
): { valid: boolean; error?: string } {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/svg+xml',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Formato no permitido. Usa JPG, PNG, WEBP, GIF o SVG.',
    };
  }

  const maxBytes = maxMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return { valid: false, error: `El archivo excede ${maxMB}MB.` };
  }

  return { valid: true };
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
