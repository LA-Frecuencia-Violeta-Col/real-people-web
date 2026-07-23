import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
    ChevronLeft,
    ChevronRight,
    X,
    Maximize2
} from 'lucide-react';
import { PageData, SuiteItem } from '../../types';

// ─── Gallery Modal — rendered via Portal into document.body ────────────────
// This is CRITICAL: the parent LazySection wraps everything in a motion.div
// with CSS transforms (y: 15 → 0). Any position:fixed element inside a
// CSS-transformed ancestor is positioned relative to that ancestor, not the
// viewport. On mobile this completely breaks the modal layout.
// createPortal teleports the modal to document.body, escaping all transforms.
function GalleryModal({
    suite,
    onClose,
}: {
    suite: SuiteItem;
    onClose: () => void;
}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    const photos =
        suite.gallery && suite.gallery.length > 0
            ? suite.gallery
            : suite.img
            ? [suite.img]
            : [];

    const prev = () =>
        setCurrentIndex(i => (i - 1 + photos.length) % photos.length);
    const next = () =>
        setCurrentIndex(i => (i + 1) % photos.length);

    // Keyboard navigation
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') prev();
            if (e.key === 'ArrowRight') next();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    // Lock body scroll using the iOS-safe technique
    useEffect(() => {
        const scrollY = window.scrollY;
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.width = '100%';
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.position = '';
            document.body.style.top = '';
            document.body.style.width = '';
            document.body.style.overflow = '';
            window.scrollTo(0, scrollY);
        };
    }, []);

    const onTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const onTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const dx = touchStartX.current - e.changedTouches[0].clientX;
        const dy = touchStartY.current - e.changedTouches[0].clientY;
        touchStartX.current = null;
        touchStartY.current = null;
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
            dx > 0 ? next() : prev();
        }
    };

    const modal = (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                backgroundColor: 'rgba(0,0,0,0.96)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
            }}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
        >
            {/* Close button */}
            <button
                type="button"
                style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    zIndex: 100000,
                    background: 'rgba(255,255,255,0.12)',
                    border: 'none',
                    borderRadius: '50%',
                    width: 48,
                    height: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                }}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                aria-label="Cerrar"
            >
                <X size={22} strokeWidth={2} />
            </button>

            {/* Photo */}
            <img
                src={photos[currentIndex] || suite.img}
                alt={`${suite.name} — foto ${currentIndex + 1}`}
                style={{
                    maxWidth: '90vw',
                    maxHeight: '75vh',
                    objectFit: 'contain',
                    borderRadius: 12,
                    boxShadow: '0 25px 60px rgba(0,0,0,0.8)',
                    display: 'block',
                    userSelect: 'none',
                    WebkitUserSelect: 'none',
                    pointerEvents: 'none',
                }}
                draggable={false}
            />

            {/* Prev / Next buttons */}
            {photos.length > 1 && (
                <>
                    <button
                        type="button"
                        style={{
                            position: 'absolute',
                            left: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 100000,
                            background: 'rgba(0,0,0,0.7)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: 52,
                            height: 52,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                        onClick={(e) => { e.stopPropagation(); prev(); }}
                        aria-label="Foto anterior"
                    >
                        <ChevronLeft size={22} />
                    </button>

                    <button
                        type="button"
                        style={{
                            position: 'absolute',
                            right: 8,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            zIndex: 100000,
                            background: 'rgba(0,0,0,0.7)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '50%',
                            width: 52,
                            height: 52,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer',
                            WebkitTapHighlightColor: 'transparent',
                        }}
                        onClick={(e) => { e.stopPropagation(); next(); }}
                        aria-label="Foto siguiente"
                    >
                        <ChevronRight size={22} />
                    </button>
                </>
            )}

            {/* Counter + dots */}
            {photos.length > 1 && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 24,
                        left: 0,
                        right: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                        zIndex: 100000,
                    }}
                >
                    <span
                        style={{
                            fontSize: 10,
                            letterSpacing: '0.3em',
                            fontWeight: 900,
                            color: 'rgba(255,255,255,0.4)',
                            textTransform: 'uppercase',
                        }}
                    >
                        {currentIndex + 1} DE {photos.length}
                    </span>
                    <div style={{ display: 'flex', gap: 6 }}>
                        {photos.map((_, i) => (
                            <button
                                key={i}
                                type="button"
                                style={{
                                    width: i === currentIndex ? 16 : 8,
                                    height: 8,
                                    borderRadius: 4,
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: i === currentIndex ? '#c9a84c' : 'rgba(255,255,255,0.25)',
                                    transition: 'all 0.2s',
                                    padding: 0,
                                    WebkitTapHighlightColor: 'transparent',
                                }}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                                aria-label={`Foto ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    return createPortal(modal, document.body);
}

// ─── Lodging Section ───────────────────────────────────────────────────────
export const Lodging = ({ data }: { data: PageData['lodging'] }) => {
    const [selectedSuite, setSelectedSuite] = useState<SuiteItem | null>(null);

    const scroll = (direction: 'left' | 'right') => {
        const container = document.getElementById('lodging-slider');
        if (container) {
            container.scrollBy({
                left: direction === 'left' ? -(container.clientWidth * 0.85) : container.clientWidth * 0.85,
                behavior: 'smooth',
            });
        }
    };

    return (
        <section id="hospedaje" className="py-20 md:py-32 bg-dark/40 backdrop-blur-sm overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6 md:gap-8">
                    <div className="text-left">
                        <span className="text-gold tracking-[0.4em] text-[10px] md:text-[11px] font-archivo font-black mb-2 md:mb-4 block uppercase">
                            {data.subtitle}
                        </span>
                        <h2 className="text-4xl md:text-7xl font-archivo font-black tracking-tighter italic uppercase">
                            {data.title}
                        </h2>
                        <p className="text-white/50 max-w-xl mt-4 md:mt-6 font-sans font-light text-sm md:text-base tracking-wide">
                            {data.desc}
                        </p>
                    </div>
                </div>

                {/* Horizontal card slider */}
                <div
                    id="lodging-slider"
                    className="flex space-x-6 md:space-x-8 overflow-x-auto pb-10 md:pb-12 scrollbar-hide snap-x snap-mandatory"
                    style={{
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        WebkitOverflowScrolling: 'touch',
                    }}
                >
                    {(data.suites || [])
                        .filter(suite => !suite.hidden)
                        .map((suite, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, scale: 0.95 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="min-w-[85vw] md:min-w-[700px] lg:min-w-[900px] snap-center"
                            >
                                <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-center bg-white/5 p-6 md:p-12 rounded-[32px] md:rounded-[40px] border border-white/5 backdrop-blur-md">
                                    {/* Thumbnail — tap to open gallery */}
                                    <div
                                        className="w-full lg:w-1/2 relative group overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl aspect-[4/3] cursor-pointer"
                                        onClick={() => setSelectedSuite(suite)}
                                    >
                                        <img
                                            src={suite.img || undefined}
                                            alt={suite.name}
                                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                            referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-dark/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                            <div className="bg-white/10 backdrop-blur-md p-4 rounded-full border border-white/20 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                                <Maximize2 size={24} className="text-white" />
                                            </div>
                                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] font-archivo font-black text-white/80">
                                                VER GALERÍA
                                            </div>
                                        </div>
                                        <div className="absolute top-4 md:top-6 left-4 md:left-6 glass px-4 md:px-6 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] tracking-widest font-bold text-gold uppercase">
                                            {suite.highlight}
                                        </div>
                                    </div>

                                    {/* Suite info */}
                                    <div className="w-full lg:w-1/2 space-y-4 md:space-y-6 text-left">
                                        <h3 className="text-2xl md:text-4xl font-archivo font-black tracking-tighter italic uppercase">
                                            {suite.name}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-4 md:gap-6 py-4 md:py-6 border-y border-white/10">
                                            <div>
                                                <div className="text-gold text-[8px] md:text-[9px] tracking-widest font-archivo font-black mb-1 uppercase">
                                                    Capacidad
                                                </div>
                                                <div className="text-white/80 font-sans font-light text-xs md:text-sm">
                                                    {suite.capacity}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-gold text-[8px] md:text-[9px] tracking-widest font-archivo font-black mb-1 uppercase">
                                                    Espacio
                                                </div>
                                                <div className="text-white/80 font-sans font-light text-xs md:text-sm">
                                                    {suite.space}
                                                </div>
                                            </div>
                                            <div className="col-span-2">
                                                <div className="text-gold text-[8px] md:text-[9px] tracking-widest font-archivo font-black mb-1 uppercase">
                                                    Camas
                                                </div>
                                                <div className="text-white/80 font-sans font-light text-xs md:text-sm">
                                                    {suite.beds}
                                                </div>
                                            </div>
                                        </div>
                                        {suite.btnUrl ? (
                                            <a
                                                href={suite.btnUrl}
                                                target={suite.btnUrl.startsWith('http') ? '_blank' : '_self'}
                                                rel="noopener noreferrer"
                                                className="inline-block w-full py-3 md:py-4 border border-white/20 rounded-full text-[9px] md:text-[10px] tracking-[0.4em] font-archivo font-black hover:bg-white hover:text-dark transition-all duration-500 uppercase text-center"
                                            >
                                                {suite.btnText || 'RESERVAR SUITE'}
                                            </a>
                                        ) : (
                                            <button className="w-full py-3 md:py-4 border border-white/20 rounded-full text-[9px] md:text-[10px] tracking-[0.4em] font-archivo font-black hover:bg-white hover:text-dark transition-all duration-500 uppercase">
                                                {suite.btnText || 'RESERVAR SUITE'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                </div>

                {/* Scroll controls */}
                <div className="flex justify-center space-x-4 mt-12 md:mt-16">
                    <button
                        onClick={() => scroll('left')}
                        className="p-4 md:p-5 border border-white/10 rounded-full hover:bg-white hover:text-dark transition-all duration-500 bg-white/5 backdrop-blur-sm shadow-xl touch-manipulation"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-4 md:p-5 border border-white/10 rounded-full hover:bg-white hover:text-dark transition-all duration-500 bg-white/5 backdrop-blur-sm shadow-xl touch-manipulation"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Portal modal — rendered directly in document.body, outside all CSS transforms */}
            {selectedSuite && (
                <GalleryModal
                    suite={selectedSuite}
                    onClose={() => setSelectedSuite(null)}
                />
            )}
        </section>
    );
};
