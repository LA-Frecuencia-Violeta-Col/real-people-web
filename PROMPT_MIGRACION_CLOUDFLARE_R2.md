# 🚀 PROMPT MASTER: Migración de Supabase Storage → Cloudflare R2

> **Guarda este prompt.** Úsalo como instrucción completa para migrar el almacenamiento
> de medios de Supabase a Cloudflare R2 en cualquier proyecto web con Node.js + Vite/React.
> Basado en la implementación real del proyecto **La Frecuencia Violeta** (2026).

---

## 📋 INSTRUCCIÓN PARA EL ASISTENTE

Necesito migrar el sistema de almacenamiento de archivos de mi proyecto web.
**Actualmente uso Supabase Storage** para guardar imágenes y otros medios, lo que
genera costos de "Cached Egress" elevados. Quiero migrar todo a **Cloudflare R2**,
que no cobra por egress (transferencia de datos).

El stack de mi proyecto es:
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js con Express (archivo `server.ts` para dev, `server.js` para prod)
- **Despliegue:** [indica tu plataforma: Heroku / Railway / Render / VPS]
- **Supabase:** Lo uso actualmente para Storage (base de datos puede quedarse en Supabase)

### 🎯 Objetivo final:
1. Subidas de archivos van directamente a **Cloudflare R2** (sin pasar por Supabase Storage)
2. Las imágenes se sirven desde la **URL pública de R2** (sin egress costs)
3. El sistema es **seguro**: las credenciales de R2 NUNCA se exponen al frontend
4. El sistema de **Presigned URLs** permite subir archivos directamente desde el browser

---

## 🏗️ ARQUITECTURA A IMPLEMENTAR

```
BROWSER (React)
    │
    │  1. POST /api/presign  (pide permiso)
    ▼
NODE.JS SERVER (Express)
    │  Tiene las credenciales de R2 de forma segura
    │  Genera una URL firmada temporal (1 hora)
    │
    │  2. Devuelve { url: "https://r2.presigned-url..." }
    ▼
BROWSER (React)
    │
    │  3. PUT directo al Presigned URL (sube el archivo)
    ▼
CLOUDFLARE R2 BUCKET
    │
    │  4. URL pública permanente del archivo
    ▼
BROWSER muestra la imagen desde R2
```

**¿Por qué Presigned URLs?** Las credenciales de R2 son secretas y solo viven en el
servidor. El frontend nunca las ve. Solo recibe una URL temporal y firmada para subir
UN archivo específico.

---

## ⚙️ PASO 1: Configurar Cloudflare R2

### En el dashboard de Cloudflare (cloudflare.com):

1. **Crear bucket R2:**
   - Ve a `R2 Object Storage` → `Create bucket`
   - Nombre del bucket: `media` (o el nombre de tu proyecto)
   - Región: `Auto`

2. **Habilitar URL pública del bucket:**
   - Entra al bucket → `Settings` → `Public Access`
   - Activa "Allow Public Access"
   - Copia la URL pública: `https://pub-XXXX.r2.dev` ← la necesitarás

3. **Crear API Token (credenciales de acceso):**
   - Ve a `R2` → `Manage R2 API Tokens` → `Create API Token`
   - Permisos: `Object Read & Write`
   - Scope: Solo el bucket `media`
   - Guarda estos valores:
     - `Access Key ID`
     - `Secret Access Key`
     - `Endpoint`: `https://ACCOUNT_ID.r2.cloudflarestorage.com`

4. **Configurar CORS en el bucket** (para subidas desde el browser):
   - Ve al bucket → `Settings` → `CORS Policy`
   - Pega esta configuración:

```json
[
  {
    "AllowedOrigins": ["https://tudominio.com", "http://localhost:3000"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3000
  }
]
```

---

## 📦 PASO 2: Instalar dependencias

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

> **¿Por qué AWS SDK?** Cloudflare R2 es 100% compatible con la API de AWS S3,
> así que usamos el mismo SDK. Solo cambia el endpoint.

---

## 🔑 PASO 3: Variables de entorno

Agrega estas variables a tu archivo `.env` (NUNCA al frontend, solo al servidor):

```env
# === CLOUDFLARE R2 ===
R2_ENDPOINT=https://TU_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=tu_access_key_id
R2_SECRET_ACCESS_KEY=tu_secret_access_key
R2_BUCKET=media

# URL pública del bucket (SÍ va al frontend como VITE_)
VITE_R2_PUBLIC_URL=https://pub-XXXX.r2.dev
```

> **Regla de oro:**
> - Variables `R2_*` → solo en el servidor (`.env`, NUNCA en el código frontend)
> - Variable `VITE_R2_PUBLIC_URL` → puede ir al frontend (es pública de todas formas)

Agrega `.env` a tu `.gitignore`:
```
.env
.env.local
.env.production
```

---

## 🖥️ PASO 4: Backend — Endpoint `/api/presign`

### Para `server.ts` (desarrollo con TypeScript):

```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

// Cliente S3 apuntando a Cloudflare R2
const s3Client = new S3Client({
  region: "auto",                          // R2 usa "auto"
  endpoint: process.env.R2_ENDPOINT,       // Tu endpoint de R2
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

const app = express();

// Endpoint: genera una URL firmada para subir un archivo
app.post("/api/presign", express.json(), async (req, res) => {
  try {
    const { filename, contentType } = req.body;

    // Validación básica
    if (!filename || !contentType) {
      return res.status(400).json({ error: "Missing filename or contentType" });
    }

    // Crear el comando de subida
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || "media",
      Key: filename,           // ej: "logos/1234567-abc.png"
      ContentType: contentType, // ej: "image/png"
    });

    // Generar URL firmada (válida por 1 hora)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ url: signedUrl });
  } catch (error) {
    console.error("Presign URL Error:", error);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});
```

### Para `server.js` (producción con CommonJS):

```javascript
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

// Dentro de tu función de configuración de Express:
app.post("/api/presign", express.json(), async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    if (!filename || !contentType) {
      return res.status(400).json({ error: "Missing filename or contentType" });
    }
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || "media",
      Key: filename,
      ContentType: contentType,
    });
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    res.json({ url: signedUrl });
  } catch (error) {
    console.error("Presign URL Error:", error);
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});
```

---

## ⚛️ PASO 5: Frontend — `storageService.ts`

Reemplaza (o crea) tu servicio de storage con este código:

```typescript
/**
 * storageService.ts
 * Servicio de carga de archivos hacia Cloudflare R2.
 *
 * Arquitectura: Presigned URL segura (sin exponer credenciales al frontend)
 *
 * Estructura de carpetas en el bucket:
 *   media/
 *   ├── logos/        → logos del sitio, navbar, footer
 *   ├── hero/         → imágenes de portada (hero section)
 *   ├── backgrounds/  → fondos globales de la web
 *   ├── banners/      → banners promocionales
 *   ├── menu/         → fotos de platos y categorías del menú
 *   ├── experience/   → imágenes de la sección Experiencia
 *   ├── feed/         → imágenes del feed (ej: Instagram)
 *   └── popup/        → imágenes del popup promocional
 */

export type MediaFolder =
  | 'logos'
  | 'hero'
  | 'backgrounds'
  | 'banners'
  | 'menu'
  | 'experience'
  | 'feed'
  | 'popup';

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
  // 1. Generar nombre único conservando la extensión original
  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${folder}/${uniqueName}`;

  // 2. Pedir Presigned URL seguro al backend
  //    (el backend tiene las credenciales, nosotros solo pedimos permiso)
  const presignRes = await fetch('/api/presign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: path, contentType: file.type }),
  });

  if (!presignRes.ok) {
    throw new Error('Error al solicitar permiso de subida seguro.');
  }

  const { url: presignedUrl } = await presignRes.json();

  // 3. Subir el archivo DIRECTAMENTE a Cloudflare R2
  //    (no pasa por nuestro servidor → más rápido, sin límites de tamaño)
  const uploadRes = await fetch(presignedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });

  if (!uploadRes.ok) {
    throw new Error('Error al subir imagen a Cloudflare R2.');
  }

  // 4. Construir la URL pública permanente
  //    VITE_R2_PUBLIC_URL = "https://pub-XXXX.r2.dev"
  const publicBaseUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';
  const publicUrl = `${publicBaseUrl}/${path}`;

  console.log(`[Storage R2] ✅ Subido correctamente: ${publicUrl}`);
  return { url: publicUrl, path };
}

/**
 * Validación de archivos antes de subirlos.
 * Verifica tipo MIME y tamaño máximo.
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
 * Extrae el path relativo del bucket desde una URL pública.
 * Útil para identificar archivos cuando solo tienes la URL completa.
 * Soporta tanto URLs de R2 como URLs legacy de Supabase.
 */
export function extractPathFromUrl(publicUrl: string): string | null {
  try {
    const publicBaseUrl = import.meta.env.VITE_R2_PUBLIC_URL || '';

    // URL nueva de R2
    if (publicBaseUrl && publicUrl.includes(publicBaseUrl)) {
      return publicUrl.split(publicBaseUrl + '/')[1] || null;
    }

    // URL legacy de Supabase (soporte backwards compatibility)
    const supabaseMarker = `/storage/v1/object/public/media/`;
    const idx = publicUrl.indexOf(supabaseMarker);
    if (idx !== -1) return publicUrl.slice(idx + supabaseMarker.length);

    return null;
  } catch {
    return null;
  }
}
```

---

## 🔄 PASO 6: Actualizar referencias a Supabase Storage en el frontend

Busca en tu proyecto todos los usos del cliente de Supabase Storage y reemplázalos:

### ❌ ANTES (Supabase):
```typescript
import { supabase } from '../lib/supabase';

const { data, error } = await supabase.storage
  .from('media')
  .upload(path, file);

const { data: urlData } = supabase.storage
  .from('media')
  .getPublicUrl(path);

const publicUrl = urlData.publicUrl;
```

### ✅ DESPUÉS (Cloudflare R2):
```typescript
import { uploadFile, validateImageFile } from '../services/storageService';

// Validar primero
const { valid, error } = validateImageFile(file, 10);
if (!valid) throw new Error(error);

// Subir
const { url: publicUrl, path } = await uploadFile(file, 'logos');
// publicUrl = "https://pub-XXXX.r2.dev/logos/1234567-abc.png"
```

---

## 🌐 PASO 7: Variables en el servidor de despliegue

En tu plataforma de despliegue (Railway, Heroku, Render, etc.),
agrega estas variables de entorno en el panel de configuración:

```
R2_ENDPOINT=https://TU_ACCOUNT_ID.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=tu_access_key_aqui
R2_SECRET_ACCESS_KEY=tu_secret_key_aqui
R2_BUCKET=media
VITE_R2_PUBLIC_URL=https://pub-XXXX.r2.dev
```

> **⚠️ Importante para Vite:** Si tu servidor de producción también hace el build,
> `VITE_R2_PUBLIC_URL` debe estar disponible en tiempo de build, no solo en runtime.
> Verifica que tu plataforma expone las variables de entorno durante el build.

---

## ✅ CHECKLIST DE VERIFICACIÓN

Después de implementar, verifica cada punto:

### Backend:
- [ ] `npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner` ejecutado
- [ ] Endpoint `POST /api/presign` respondiendo en `localhost:3000`
- [ ] Variables `R2_*` cargadas (verifica con `console.log(!!process.env.R2_ACCESS_KEY_ID)`)

### Cloudflare R2:
- [ ] Bucket creado con nombre `media`
- [ ] URL pública habilitada (`Allow Public Access`)
- [ ] CORS configurado con tu dominio y `localhost`
- [ ] Token API con permisos `Object Read & Write` creado

### Frontend:
- [ ] `storageService.ts` actualizado para usar `/api/presign`
- [ ] `VITE_R2_PUBLIC_URL` configurada en `.env`
- [ ] Imports de `supabase.storage` eliminados o reemplazados

### Prueba de extremo a extremo:
```bash
# 1. Prueba el endpoint presign desde la terminal:
curl -X POST http://localhost:3000/api/presign \
  -H "Content-Type: application/json" \
  -d '{"filename":"test/prueba.png","contentType":"image/png"}'

# Debe devolver: {"url":"https://TU_BUCKET.r2.cloudflarestorage.com/test/prueba.png?..."}
```

- [ ] El curl devuelve un `url` válida de R2
- [ ] Subir una imagen desde el panel de admin funciona
- [ ] La imagen es accesible en `https://pub-XXXX.r2.dev/test/prueba.png`

---

## 🐛 ERRORES COMUNES Y SOLUCIONES

| Error | Causa | Solución |
|---|---|---|
| `SignatureDoesNotMatch` | Credenciales incorrectas | Verifica `R2_ACCESS_KEY_ID` y `R2_SECRET_ACCESS_KEY` |
| `NoSuchBucket` | Bucket no existe o nombre incorrecto | Verifica `R2_BUCKET` en `.env` |
| `CORS error` en browser | CORS no configurado en R2 | Agrega tu origen en la política CORS del bucket |
| `403 Forbidden` en PUT | Token sin permisos de escritura | Recrea el token con `Object Read & Write` |
| URL pública no accesible | Public Access no habilitado | Activa "Allow Public Access" en Settings del bucket |
| `VITE_R2_PUBLIC_URL` es `undefined` | Variable no disponible en build | Agrégala al entorno de build de tu plataforma |

---

## 📁 ARCHIVOS MODIFICADOS EN ESTE PROCESO

```
proyecto/
├── .env                          ← Agregar R2_* y VITE_R2_PUBLIC_URL
├── .gitignore                    ← Verificar que .env está ignorado
├── server.ts                     ← Agregar: import S3Client, endpoint /api/presign
├── server.js                     ← Agregar: require S3Client, endpoint /api/presign
└── src/
    └── services/
        └── storageService.ts     ← Reemplazar lógica de Supabase por R2 Presigned URLs
```

---

## 💡 NOTAS ADICIONALES

- **Borrado de archivos:** R2 cobra por operaciones de escritura/borrado. Si tu app borra
  imágenes frecuentemente, considera una estrategia de "borrado lógico" (solo marcar en DB)
  y hacer limpieza batch periódica.

- **Imágenes de Supabase existentes:** Las URLs antiguas de Supabase seguirán funcionando
  mientras no elimines los archivos. Puedes migrarlas gradualmente o dejarlas como están.
  El `extractPathFromUrl()` incluido tiene soporte legacy para ambas.

- **CDN:** La URL pública de R2 (`pub-XXXX.r2.dev`) ya incluye CDN de Cloudflare global.
  No necesitas configurar nada adicional para distribución geográfica.

- **Videos:** El mismo sistema funciona para videos. Solo agrega `video/mp4` al array
  `allowedTypes` en `validateImageFile()` y ajusta `maxMB` según necesites.

---

*Prompt generado a partir de la implementación real del proyecto La Frecuencia Violeta — Mayo 2026*
