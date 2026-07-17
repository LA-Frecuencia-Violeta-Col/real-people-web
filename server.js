/**
 * server.js — Servidor Express para Real People Web
 *
 * Este servidor actúa como intermediario seguro entre el frontend (React)
 * y los servicios de Cloudflare (R2 Storage + KV Database).
 *
 * Las credenciales de Cloudflare NUNCA se exponen al navegador.
 * Solo este servidor las conoce, a través de variables de entorno.
 *
 * Endpoints:
 *   POST /api/login    → Autenticación de administrador (devuelve JWT)
 *   GET  /api/config   → Lee la configuración del sitio desde Cloudflare KV
 *   POST /api/config   → Guarda la configuración en Cloudflare KV (protegido)
 *   POST /api/presign  → Genera URL firmada temporal para subir a R2 (protegido)
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Validación de variables de entorno requeridas ─────────────────────────

const requiredEnvVars = [
  'ADMIN_PASSWORD',
  'JWT_SECRET',
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
  'CLOUDFLARE_ACCOUNT_ID',
  'CLOUDFLARE_API_TOKEN',
  'CLOUDFLARE_KV_NAMESPACE_ID',
];

const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
  console.warn(`⚠️  Variables de entorno faltantes: ${missingVars.join(', ')}`);
  console.warn('   Algunas funciones del servidor pueden no funcionar correctamente.');
}

// ─── Cliente Cloudflare R2 (compatible con API de AWS S3) ──────────────────

const s3Client = new S3Client({
  region: 'auto',                                   // R2 usa "auto"
  endpoint: process.env.R2_ENDPOINT,                // Tu endpoint de R2
  forcePathStyle: true,                             // Evitar subdominios multinivel y error SSL
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

// ─── Cloudflare KV — Base de datos de configuración ───────────────────────

const CF_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CF_KV_NAMESPACE_ID = process.env.CLOUDFLARE_KV_NAMESPACE_ID;
const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CONFIG_KEY = 'real-people-config';  // Clave bajo la que se guarda la config

const KV_BASE_URL = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${CF_KV_NAMESPACE_ID}/values`;

/**
 * Lee el valor de una clave desde Cloudflare KV.
 * Retorna null si la clave no existe o hay un error.
 */
async function kvGet(key) {
  try {
    const res = await fetch(`${KV_BASE_URL}/${key}`, {
      headers: { Authorization: `Bearer ${CF_API_TOKEN}` },
    });
    if (res.status === 404) return null;  // Clave no existe aún → primera vez
    if (!res.ok) {
      console.error(`[KV] Error leyendo "${key}": HTTP ${res.status}`);
      return null;
    }
    return await res.json();
  } catch (e) {
    console.error(`[KV] Error inesperado leyendo "${key}":`, e);
    return null;
  }
}

/**
 * Escribe un valor en Cloudflare KV bajo una clave dada.
 * Retorna true si fue exitoso, false si hubo un error.
 */
async function kvPut(key, value) {
  try {
    const res = await fetch(`${KV_BASE_URL}/${key}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(value),
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`[KV] Error escribiendo "${key}": HTTP ${res.status} — ${body}`);
      return false;
    }
    return true;
  } catch (e) {
    console.error(`[KV] Error inesperado escribiendo "${key}":`, e);
    return false;
  }
}

// ─── JWT — Autenticación de administrador ─────────────────────────────────

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';

/**
 * Middleware que verifica el token JWT en la cabecera Authorization.
 * Protege los endpoints que solo el administrador puede usar.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];  // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido.' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado.' });
    }
    req.user = payload;
    next();
  });
}

// ─── Middleware global ─────────────────────────────────────────────────────

app.use(express.json({ limit: '2mb' }));

// Importamos el módulo stream para manejar el cuerpo binario (fotos/fuentes)

// ─── Endpoints API ─────────────────────────────────────────────────────────

/**
 * POST /api/login
 * Valida la contraseña de administrador y devuelve un token JWT.
 * El token es válido por 7 días.
 *
 * Body: { password: string }
 * Response: { token: string }
 */
app.post('/api/login', (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'La contraseña es requerida.' });
  }

  if (password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta.' });
  }

  const token = jwt.sign(
    { role: 'admin', project: 'real-people' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  console.log('[Auth] ✅ Inicio de sesión de administrador exitoso.');
  res.json({ token });
});

/**
 * GET /api/config
 * Carga la configuración del sitio desde Cloudflare KV.
 * Retorna null si no hay configuración guardada aún (primera vez).
 * Este endpoint es público (los visitantes del sitio lo usan para cargar el contenido).
 *
 * Response: PageData | null
 */
app.get('/api/config', async (req, res) => {
  const data = await kvGet(CONFIG_KEY);
  res.json(data);  // null si no existe → el frontend usará los datos por defecto
});

/**
 * POST /api/config
 * Guarda la configuración del sitio en Cloudflare KV.
 * Requiere autenticación de administrador.
 *
 * Body: PageData (el JSON completo de configuración del sitio)
 * Response: { success: true }
 */
app.post('/api/config', authenticateToken, async (req, res) => {
  const configData = req.body;

  if (!configData || typeof configData !== 'object') {
    return res.status(400).json({ error: 'Datos de configuración inválidos.' });
  }

  const success = await kvPut(CONFIG_KEY, configData);

  if (!success) {
    return res.status(500).json({ error: 'Error al guardar la configuración en Cloudflare KV.' });
  }

  console.log('[Config] ✅ Configuración guardada en Cloudflare KV.');
  res.json({ success: true });
});

/**
 * POST /api/upload
 * Recibe un archivo binario desde el frontend y lo sube directamente a R2
 * usando las credenciales del servidor (sin exponer nada al navegador).
 * Requiere autenticación de administrador.
 *
 * Query params: folder (logos|hero|backgrounds|artists|experiences|lodging|tickets|branding)
 *               name   (nombre original del archivo para extraer extensión)
 * Headers:      Content-Type: tipo MIME real del archivo
 * Body:         Binario del archivo
 * Response:     { url: string } — URL pública permanente del archivo
 */
app.post('/api/upload', authenticateToken, async (req, res) => {
  try {
    const folder    = String(req.query.folder   || 'media');
    const origName  = String(req.query.name     || 'file');
    const contentType = req.get('x-file-content-type') || 'application/octet-stream';

    console.log(`[Upload] 📥 Iniciando subida — folder: ${folder}, name: ${origName}, type: ${contentType}`);

    // Tipos de archivo permitidos
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp',
      'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm',
      'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
    ];

    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: `Tipo de archivo no permitido: ${contentType}` });
    }

    // Leer el cuerpo binario del request manualmente desde el stream
    // Este método es 100% confiable independientemente del orden de middlewares
    const chunks = [];
    await new Promise((resolve, reject) => {
      req.on('data',  chunk => chunks.push(chunk));
      req.on('end',   resolve);
      req.on('error', reject);
    });
    const fileBuffer = Buffer.concat(chunks);

    console.log(`[Upload] 📦 Tamaño recibido: ${(fileBuffer.length / 1024).toFixed(1)} KB`);

    if (fileBuffer.length === 0) {
      return res.status(400).json({ error: 'El archivo recibido está vacío.' });
    }

    const ext = origName.split('.').pop()?.toLowerCase() ?? 'jpg';
    const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

    const command = new PutObjectCommand({
      Bucket:        process.env.R2_BUCKET || 'media',
      Key:           key,
      ContentType:   contentType,
      Body:          fileBuffer,
      ContentLength: fileBuffer.length,
    });

    await s3Client.send(command);

    const publicBaseUrl = process.env.VITE_R2_PUBLIC_URL || '';
    const publicUrl     = `${publicBaseUrl}/${key}`;

    console.log(`[Upload] ✅ Subido a R2: ${publicUrl}`);
    res.json({ url: publicUrl });
  } catch (error) {
    console.error('[Upload] ❌ Error subiendo archivo a R2:', error?.message || error);
    res.status(500).json({ error: String(error?.message || 'Error interno al subir el archivo.') });
  }
});

/**
 * POST /api/presign  (DEPRECATED - mantenido por compatibilidad)
 * Ahora el upload pasa por el servidor con /api/upload
 * Este endpoint se mantiene para no romper versiones previas.
 */
app.post('/api/presign', authenticateToken, async (req, res) => {
  try {
    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Se requieren "filename" y "contentType".' });
    }

    // Tipos de archivo permitidos
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/webp',
      'image/gif', 'image/svg+xml',
      'video/mp4', 'video/webm',
      'font/woff', 'font/woff2', 'font/ttf', 'font/otf',
    ];

    if (!allowedTypes.includes(contentType)) {
      return res.status(400).json({ error: `Tipo de archivo no permitido: ${contentType}` });
    }

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET || 'media',
      Key: filename,
      ContentType: contentType,
    });

    // URL firmada válida por 1 hora (3600 segundos)
    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({ url: signedUrl });
  } catch (error) {
    console.error('[R2 Presign] Error generando URL firmada:', error);
    res.status(500).json({ error: 'Error al generar URL de subida.' });
  }
});

// ─── Archivos estáticos (frontend compilado) ───────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));

// SPA fallback — todas las rutas que no son API retornan index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ─── Iniciar servidor ──────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Real People Web — Servidor corriendo en puerto ${PORT}`);
  console.log(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`   KV Config Key: "${CONFIG_KEY}"`);
  console.log(`   R2 Bucket: "${process.env.R2_BUCKET || 'media (no configurado)'}"\n`);
});
