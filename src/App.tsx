import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { INITIAL_DATA } from './constants';
import { PageData } from './types';
import { isAuthenticated, loadConfig, saveConfig, logout } from './services/configService';
import { isYouTubeUrl, getYouTubeEmbedUrl, isVideoUrl } from './lib/videoUtils';

// Components
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './components/Login';
import { Buy } from './components/sections/Buy';

// Sections
import { Hero } from './components/sections/Hero';
import { Welcome } from './components/sections/Welcome';
import { Experience } from './components/sections/Experience';
import { LineUp } from './components/sections/LineUp';
import { Lodging } from './components/sections/Lodging';
import { CaliPackage } from './components/sections/CaliPackage';
import { Tickets } from './components/sections/Tickets';
import { FAQ } from './components/sections/FAQ';
import { LazySection } from './components/layout/LazySection';

// Modals
import { ArtistModal } from './components/modals/ArtistModal';

const SECTION_MIN_HEIGHTS: Record<string, string> = {
  welcome: '600px',
  experience: '500px',
  lineup: '800px',
  lodging: '600px',
  caliPackage: '500px',
  tickets: '600px',
  buy: '700px',
  faqs: '400px',
};

export default function App() {
  const [pageData, setPageData] = useState<PageData>(INITIAL_DATA);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<PageData['lineup']['artists'][0] | null>(null);
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay una sesión de admin activa al cargar
  useEffect(() => {
    setAdminAuthenticated(isAuthenticated());
  }, []);

  // Actualizar favicon dinámicamente
  useEffect(() => {
    document.title = pageData.settings.siteName || 'Real People';

    const updateFavicon = (url: string) => {
      const existingIcons = document.querySelectorAll("link[rel*='icon']");
      existingIcons.forEach(el => el.parentNode?.removeChild(el));
      if (!url) return;

      const newIcon = document.createElement('link');
      newIcon.rel = 'icon';
      newIcon.href = url + (url.includes('?') ? '&' : '?') + `t=${Date.now()}`;
      newIcon.type = url.toLowerCase().endsWith('.ico') ? 'image/x-icon' : 'image/png';
      newIcon.setAttribute('sizes', '32x32');
      document.head.appendChild(newIcon);

      const appleIcon = document.createElement('link');
      appleIcon.rel = 'apple-touch-icon';
      appleIcon.href = url;
      document.head.appendChild(appleIcon);
    };

    updateFavicon(pageData.settings.faviconUrl);
  }, [pageData.settings.siteName, pageData.settings.faviconUrl]);

  // Cargar configuración desde Cloudflare KV al iniciar la app
  useEffect(() => {
    async function loadData() {
      try {
        const remoteData = await loadConfig();

        if (remoteData) {
          // Merge: datos remotos sobre INITIAL_DATA para que nunca falten campos nuevos
          const baseOrder = (remoteData.sectionOrder || INITIAL_DATA.sectionOrder).filter(id =>
            !['location', 'aliados', 'patrocinadores', 'sponsors', 'partners'].includes(id)
          );
          const finalOrder = [...baseOrder];
          INITIAL_DATA.sectionOrder.forEach(id => {
            if (!finalOrder.includes(id) && id !== 'location') {
              const ticketIdx = finalOrder.indexOf('tickets');
              if (ticketIdx !== -1) finalOrder.splice(ticketIdx + 1, 0, id);
              else finalOrder.push(id);
            }
          });

          setPageData({
            ...INITIAL_DATA,
            ...remoteData,
            settings: { ...INITIAL_DATA.settings, ...(remoteData.settings || {}) },
            sectionOrder: finalOrder,
            sectionLabels: Object.fromEntries(
              Object.entries({ ...INITIAL_DATA.sectionLabels, ...(remoteData.sectionLabels || {}) })
                .filter(([key]) => !['location', 'aliados', 'patrocinadores', 'sponsors', 'partners'].includes(key))
            ),
            hero:         { ...INITIAL_DATA.hero,         ...(remoteData.hero         || {}) },
            welcome: {
              ...INITIAL_DATA.welcome,
              ...(remoteData.welcome || {}),
              subtitle1:  (remoteData.welcome as any)?.subtitle1  || (INITIAL_DATA.welcome as any).subtitle1,
              accordion2: (remoteData.welcome as any)?.accordion2 || INITIAL_DATA.welcome.accordion2 || [],
            },
            lineup:       { ...INITIAL_DATA.lineup,       ...(remoteData.lineup       || {}) },
            experience:   { ...INITIAL_DATA.experience,   ...(remoteData.experience   || {}) },
            lodging:      { ...INITIAL_DATA.lodging,      ...(remoteData.lodging      || {}) },
            caliPackage:  { ...INITIAL_DATA.caliPackage,  ...(remoteData.caliPackage  || {}) },
            tickets:      { ...INITIAL_DATA.tickets,      ...(remoteData.tickets      || {}) },
            faqs:         { ...INITIAL_DATA.faqs,         ...(remoteData.faqs         || {}) },
            buy:          { ...INITIAL_DATA.buy,          ...(remoteData.buy          || {}) },
            footer:       { ...INITIAL_DATA.footer,       ...(remoteData.footer       || {}) },
          });
        }
        // Si remoteData es null, quedará con INITIAL_DATA (valores vacíos de Real People)
      } catch (e) {
        console.error('[App] Error inesperado cargando datos:', e);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  // Scroll automático a #buy si la URL contiene /events/
  useEffect(() => {
    const isEventPath = window.location.pathname.includes('/events/') || window.location.hash.includes('events');
    if (isEventPath && !isLoading) {
      setTimeout(() => {
        const buySection = document.getElementById('buy');
        if (buySection) buySection.scrollIntoView({ behavior: 'smooth' });
      }, 1000);
    }
  }, [isLoading]);

  // Aplicar configuración de fuentes y color de acento
  useEffect(() => {
    document.title = pageData.settings.siteName;
    document.documentElement.style.setProperty('--accent-color', pageData.settings.accentColor);

    const displayFont = pageData.settings.fontDisplayUrl ? 'CustomDisplay' : pageData.settings.fontDisplay;
    const sansFont    = pageData.settings.fontSansUrl    ? 'CustomSans'    : pageData.settings.fontSans;

    document.documentElement.style.setProperty('--font-display',  `"${displayFont}", sans-serif`);
    document.documentElement.style.setProperty('--font-archivo',  `"${displayFont}", sans-serif`);
    document.documentElement.style.setProperty('--font-sans',     `"${sansFont}", sans-serif`);

    let styleTag = document.getElementById('dynamic-fonts');
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'dynamic-fonts';
      document.head.appendChild(styleTag);
    }

    let fontFaceRules = '';
    if (pageData.settings.fontDisplayUrl) {
      fontFaceRules += `
        @font-face {
          font-family: 'CustomDisplay';
          src: url('${pageData.settings.fontDisplayUrl}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
    }
    if (pageData.settings.fontSansUrl) {
      fontFaceRules += `
        @font-face {
          font-family: 'CustomSans';
          src: url('${pageData.settings.fontSansUrl}');
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }
      `;
    }
    styleTag.innerHTML = fontFaceRules;
  }, [
    pageData.settings.accentColor,
    pageData.settings.fontDisplay,
    pageData.settings.fontSans,
    pageData.settings.fontDisplayUrl,
    pageData.settings.fontSansUrl,
    pageData.settings.siteName,
  ]);

  // Actualizar meta tags SEO dinámicamente
  useEffect(() => {
    if (!pageData.seo) return;

    document.title = pageData.seo.title || pageData.settings.siteName;

    const updateMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let meta = document.querySelector(`meta[${attr}="${name}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attr, name);
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    updateMeta('description', pageData.seo.description);
    updateMeta('keywords', pageData.seo.keywords || '');
    updateMeta('og:title', pageData.seo.title, 'property');
    updateMeta('og:description', pageData.seo.description, 'property');
    updateMeta('og:image', pageData.seo.image, 'property');
    updateMeta('og:url', window.location.href, 'property');
    updateMeta('twitter:title', pageData.seo.title);
    updateMeta('twitter:description', pageData.seo.description);
    updateMeta('twitter:image', pageData.seo.image);
  }, [pageData.seo, pageData.settings.siteName]);

  // Guardar la configuración en Cloudflare KV
  const handleSave = async (newData: PageData) => {
    try {
      const success = await saveConfig(newData);
      if (!success) {
        alert('Error al guardar en Cloudflare KV. Revisa la consola para más detalles.');
        return;
      }
      setPageData(newData);
      setIsAdminOpen(false);
    } catch (e) {
      console.error('[App] Error inesperado al guardar:', e);
      setPageData(newData);
      setIsAdminOpen(false);
    }
  };

  // Cerrar sesión de administrador
  const handleLogout = () => {
    logout();
    setAdminAuthenticated(false);
    setIsAdminOpen(false);
  };

  // Pantalla de carga
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark flex flex-col items-center justify-center space-y-6">
        <div
          className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: `${pageData.settings.loadingColor}33`, borderTopColor: pageData.settings.loadingColor }}
        />
        <div
          className="animate-pulse tracking-[0.5em] font-archivo font-black text-xs"
          style={{ color: pageData.settings.loadingColor }}
        >
          {pageData.settings.loadingText || 'CARGANDO...'}
        </div>
      </div>
    );
  }

  const sections = (pageData.sectionOrder || INITIAL_DATA.sectionOrder)
    .filter(id => !pageData.hiddenSections?.includes(id));

  return (
    <div className="min-h-screen relative overflow-x-hidden">

      {/* Fondo global */}
      <div
        className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none transition-colors duration-1000"
        style={{
          backgroundColor: pageData.settings.globalBgType === 'color'
            ? pageData.settings.globalBgColor
            : '#000000'
        }}
      >
        {pageData.settings.globalBgType === 'blurred' && (
          <div className="absolute inset-0 w-full h-full">
            {isVideoUrl(pageData.hero.videoUrl) ? (
              <video
                key={pageData.hero.videoUrl}
                autoPlay muted loop playsInline
                className="w-full h-full object-cover blur-[100px] opacity-40 scale-110"
              >
                <source src={pageData.hero.videoUrl} type="video/mp4" />
              </video>
            ) : pageData.hero.bgImage ? (
              <img
                src={pageData.hero.bgImage}
                alt=""
                className="w-full h-full object-cover blur-[100px] opacity-40 scale-110"
              />
            ) : null}
            <div className="absolute inset-0 bg-dark/20" />
          </div>
        )}

        {pageData.settings.globalBgType === 'image' && (
          <picture className="w-full h-full">
            {pageData.settings.globalBgImageMobile && (
              <source media="(max-width: 768px)" srcSet={pageData.settings.globalBgImageMobile} />
            )}
            <img
              src={pageData.settings.globalBgImageDesktop || pageData.settings.globalBgImage || ''}
              alt="Background"
              className="w-full h-full object-cover"
            />
          </picture>
        )}
      </div>

      <Navbar
        data={pageData}
        onAdminClick={() => {
          if (adminAuthenticated) setIsAdminOpen(true);
          else setIsLoginOpen(true);
        }}
      />

      <main>
        <Hero data={pageData.hero} />
        {sections.map((sectionId) => (
          <LazySection
            key={sectionId}
            id={sectionId}
            minHeight={SECTION_MIN_HEIGHTS[sectionId] || '500px'}
          >
            {(() => {
              switch (sectionId) {
                case 'welcome':     return <Welcome     data={pageData.welcome}     />;
                case 'experience':  return <Experience  data={pageData.experience}  />;
                case 'lineup':      return <LineUp      data={pageData.lineup}      onArtistSelect={setSelectedArtist} />;
                case 'lodging':     return <Lodging     data={pageData.lodging}     />;
                case 'caliPackage': return <CaliPackage data={pageData.caliPackage} />;
                case 'tickets':     return <Tickets     data={pageData.tickets}     />;
                case 'buy':         return <Buy         data={pageData.buy}         />;
                case 'faqs':        return <FAQ         data={pageData.faqs}        />;
                default:            return null;
              }
            })()}
          </LazySection>
        ))}
      </main>

      <Footer data={pageData.footer} settings={pageData.settings} />

      {/* Botón flotante de WhatsApp */}
      {pageData.settings.whatsappNumber && (
        <a
          href={`https://wa.me/${pageData.settings.whatsappNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-8 right-8 bg-[#25D366] p-4 rounded-full shadow-2xl hover:scale-110 transition-transform duration-300 z-50 flex items-center space-x-3 group"
        >
          <div className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-in-out">
            <span className="text-[10px] tracking-[0.2em] font-archivo font-black whitespace-nowrap pr-2 text-white">ASISTENCIA PERSONALIZADA</span>
          </div>
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.94 3.659 1.437 5.63 1.438h.008c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>
      )}

      {/* Modal de Artista */}
      <AnimatePresence>
        {selectedArtist && (
          <ArtistModal
            artist={selectedArtist}
            onClose={() => setSelectedArtist(null)}
          />
        )}
      </AnimatePresence>

      {/* Panel de Admin */}
      <AnimatePresence>
        {isAdminOpen && adminAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10002]"
          >
            <AdminPanel
              data={pageData}
              onSave={handleSave}
              onClose={() => setIsAdminOpen(false)}
              onLogout={handleLogout}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Login */}
      <AnimatePresence>
        {isLoginOpen && (
          <Login
            onClose={() => setIsLoginOpen(false)}
            onSuccess={() => {
              setAdminAuthenticated(true);
              setIsLoginOpen(false);
              setIsAdminOpen(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
