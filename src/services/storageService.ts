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
 * Sube un archivo a Cloudflare R2 a través del servidor Express (proxy seguro).
 * El archivo viaja: Browser → /api/upload (Express) → Cloudflare R2.
 * De esta forma, el navegador nunca habla directamente con R2 (sin problemas CORS).
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

  // 2. Obtener token de administrador
  const token = getAdminToken();

  // 3. Subir el archivo al servidor Express (que lo reenvía a R2)
  //    Enviamos el archivo como binario puro en el body.
  //    El Content-Type real del archivo va en el header x-file-content-type.
  const uploadRes = await fetch(
    `/api/upload?folder=${encodeURIComponent(folder)}&name=${encodeURIComponent(file.name)}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': file.type,
        'x-file-content-type': file.type,
      },
      body: file,
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
