/**
 * configService.ts
 * Servicio para leer y guardar la configuración del sitio.
 *
 * La configuración vive en Cloudflare KV (base de datos en la nube de Cloudflare).
 * El servidor Express actúa como intermediario seguro entre el frontend y Cloudflare.
 *
 * Endpoints:
 *   GET  /api/config   → Carga la configuración (público)
 *   POST /api/config   → Guarda la configuración (requiere token admin)
 *
 * Autenticación de administrador:
 *   POST /api/login    → Devuelve un token JWT firmado (válido 7 días)
 *   El token se guarda en localStorage bajo la key 'rp_admin_token'
 */

import { PageData } from '../types';

const TOKEN_KEY = 'rp_admin_token';

// ─── Autenticación ─────────────────────────────────────────────────────────

/**
 * Inicia sesión como administrador.
 * Envía la contraseña al servidor y recibe un token JWT si es correcta.
 */
export async function login(password: string): Promise<void> {
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error al iniciar sesión' }));
    throw new Error(err.error || 'Credenciales incorrectas');
  }

  const { token } = await res.json();
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Cierra sesión eliminando el token del navegador.
 */
export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Obtiene el token de administrador guardado en el navegador.
 */
export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Verifica si el usuario está autenticado como administrador.
 * Decodifica el token JWT localmente para comprobar que no haya expirado.
 * El servidor verifica la firma real en cada petición protegida.
 */
export function isAuthenticated(): boolean {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) return false;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = JSON.parse(atob(parts[1]));
    // Verificar que el token no haya expirado
    return typeof payload.exp === 'number' && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

// ─── Configuración del sitio ───────────────────────────────────────────────

/**
 * Carga la configuración del sitio desde Cloudflare KV (vía servidor).
 * Retorna null si no hay configuración guardada aún (primera vez).
 */
export async function loadConfig(): Promise<PageData | null> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) return null;
    const data = await res.json();
    return data as PageData | null;
  } catch (e) {
    console.error('[Config] Error cargando configuración:', e);
    return null;
  }
}

/**
 * Guarda la configuración del sitio en Cloudflare KV (vía servidor).
 * Requiere que el usuario esté autenticado como administrador.
 */
export async function saveConfig(data: PageData): Promise<boolean> {
  const token = getAdminToken();
  if (!token) {
    console.error('[Config] No hay token de administrador.');
    return false;
  }

  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error desconocido' }));
      console.error('[Config] Error guardando:', err.error);
      return false;
    }

    console.log('[Config] ✅ Configuración guardada en Cloudflare KV');
    return true;
  } catch (e) {
    console.error('[Config] Error inesperado guardando configuración:', e);
    return false;
  }
}
