import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { BuySection } from '../../types';

export const Buy = ({ data }: { data: BuySection }) => {
  useEffect(() => {
    const container = document.getElementById('fv-container');
    if (!container) return;

    // --- 1. DETECTAR PROMOTOR ---
    const params = new URLSearchParams(window.location.search);
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const hash = window.location.hash;

    // Prioridad 1: Parámetro query (?p= o ?promoter=)
    let promoterParam = params.get('p') || params.get('promoter');

    // Prioridad 2: Primer parte del path (ej: /the-cluster)
    // Evitamos palabras reservadas que podrían colisionar
    const reservedPaths = ['admin', 'login', 'events', 'tickets', 'buy'];
    if (!promoterParam && pathParts.length > 0 && !reservedPaths.includes(pathParts[0].toLowerCase())) {
      promoterParam = pathParts[0];
    }

    // Persistir si encontramos uno nuevo
    if (promoterParam) {
      localStorage.setItem('fv_promoter', promoterParam);
    }
    const activePromoter = localStorage.getItem('fv_promoter') || 'technical-live';

    // --- 2. DETECTAR EVENTO ---
    // Buscamos el ID en el hash (soporta #events/slug-ID o #events/ID)
    const eventMatch = hash.match(/(?:events|tickets)\/([^/?#]+)/);
    let extractedEventId = eventMatch ? eventMatch[1] : null;

    // Si el slug contiene guiones, el ID suele ser la última parte (ej: sabado...-Q9E4)
    if (extractedEventId && extractedEventId.includes('-')) {
      const parts = extractedEventId.split('-');
      const potentialId = parts[parts.length - 1];
      // Solo tomamos la última parte si parece un ID corto (ej: 4-6 caracteres)
      if (potentialId.length >= 4 && potentialId.length <= 10) {
        extractedEventId = potentialId;
      }
    }

    // --- 3. CONSTRUIR URL DEL WIDGET ---
    let baseUrl = data.widgetUrl;

    // Reemplazar promotor en la URL base si es necesario
    if (activePromoter !== 'technical-live') {
      baseUrl = baseUrl.replace('/technical-live/', `/${activePromoter}/`);
    }

    // Reemplazar evento en la URL base si detectamos uno en el hash
    if (extractedEventId) {
      // Buscamos el patrón del ID en la URL original (ej: Q9E4)
      // Extraemos el ID actual de la widgetUrl (segunda parte después de /iframe/promoter/)
      const urlParts = baseUrl.split('/');
      const iframeIdx = urlParts.indexOf('iframe');
      if (iframeIdx !== -1 && urlParts[iframeIdx + 2]) {
        const currentIdInUrl = urlParts[iframeIdx + 2].split('?')[0];
        if (currentIdInUrl !== extractedEventId) {
          baseUrl = baseUrl.replace(`/${currentIdInUrl}?`, `/${extractedEventId}?`);
        }
      }
    }

    const finalUrl = baseUrl.includes('theme=')
      ? baseUrl
      : `${baseUrl}${baseUrl.includes('?') ? '&' : '?'}theme=dark`;

    // --- 4. INYECCIÓN DEL SCRIPT ---
    const cleanup = () => {
      const existingScript = document.getElementById('fv-script');
      if (existingScript) existingScript.remove();
      // Solo limpiar el contenedor si realmente vamos a re-inyectar
      if (container) {
        container.innerHTML = '<div id="fourvenues-iframe" class="w-full h-full min-h-[600px]"></div>';
      }
      // Eliminar iframes huérfanos
      document.querySelectorAll('iframe[src*="fourvenues"]').forEach(el => el.remove());
    };

    cleanup();

    const script = document.createElement('script');
    script.id = 'fv-script';
    script.src = finalUrl;
    script.async = true;

    container.appendChild(script);

    return () => {
      // No hacemos cleanup agresivo al desmontar para evitar romper el flujo de pago 
      // si hay re-renders menores, pero sí eliminamos el script
      const s = document.getElementById('fv-script');
      if (s) s.remove();
    };
  }, [data.widgetUrl, window.location.hash, window.location.pathname, window.location.search]);

  return (
    <section className="py-24 px-4 bg-dark/20 backdrop-blur-sm relative overflow-hidden w-full max-w-[100vw]">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10 text-center">
        <div className="mb-12 space-y-4 px-4">
          <motion.span className="text-gold tracking-[0.5em] text-[10px] font-archivo font-black uppercase">BOLETERÍA</motion.span>
          <motion.h2 className="text-3xl md:text-7xl font-archivo font-black italic text-white leading-tight uppercase">{data.title}</motion.h2>
          <motion.p className="text-white/40 text-[10px] md:text-sm tracking-[0.1em] font-archivo max-w-2xl mx-auto uppercase">{data.description}</motion.p>
        </div>

        {/* Contenedor principal donde FourVenues inyectará su widget */}
        <div id="fv-container" className="w-full min-h-[600px] relative">
          <div id="fourvenues-iframe" className="w-full h-full min-h-[600px]" />
        </div>
      </div>
    </section>
  );
};
