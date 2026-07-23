import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    ChevronLeft,
    ChevronRight,
    X,
    Maximize2
} from 'lucide-react';
import { PageData, SuiteItem } from '../../types';

export const Lodging = ({ data }: { data: PageData['lodging'] }) => {
    const [selectedSuite, setSelectedSuite] = useState<SuiteItem | null>(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    // useRef instead of useState — no re-renders during touch, no event routing issues
    const touchStartX = useRef<number | null>(null);
    const touchStartY = useRef<number | null>(null);

    // Close modal on Esc key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedSuite(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (selectedSuite) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [selectedSuite]);

    const getPhotos = (suite: SuiteItem) =>
        suite.gallery && suite.gallery.length > 0
            ? suite.gallery
            : suite.img ? [suite.img] : [];

    const photos = selectedSuite ? getPhotos(selectedSuite) : [];

    // Scroll the lodging card slider
    const scroll = (direction: 'left' | 'right') => {
        const container = document.getElementById('lodging-slider');
        if (container) {
            const scrollAmount = container.clientWidth * 0.85;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const nextPhoto = () => {
        if (photos.length > 1) {
            setCurrentPhotoIndex(prev => (prev + 1) % photos.length);
        }
    };

    const prevPhoto = () => {
        if (photos.length > 1) {
            setCurrentPhotoIndex(prev => (prev - 1 + photos.length) % photos.length);
        }
    };

    // Touch handlers attached to backdrop — no touchAction:none needed
    const handleTouchStart = (e: React.TouchEvent) => {
        touchStartX.current = e.touches[0].clientX;
        touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStartX.current === null || touchStartY.current === null) return;
        const dx = touchStartX.current - e.changedTouches[0].clientX;
        const dy = touchStartY.current - e.changedTouches[0].clientY;
        touchStartX.current = null;
        touchStartY.current = null;
        // Only navigate if horizontal swipe is dominant and long enough
        if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
            if (dx > 0) nextPhoto();
            else prevPhoto();
        }
    };

    return (
        <section id="hospedaje" className="py-20 md:py-32 bg-dark/40 backdrop-blur-sm overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6 md:gap-8">
                    <div className="text-left">
                        <span className="text-gold tracking-[0.4em] text-[10px] md:text-[11px] font-archivo font-black mb-2 md:mb-4 block uppercase">{data.subtitle}</span>
                        <h2 className="text-4xl md:text-7xl font-archivo font-black tracking-tighter italic uppercase">{data.title}</h2>
                        <p className="text-white/50 max-w-xl mt-4 md:mt-6 font-sans font-light text-sm md:text-base tracking-wide">{data.desc}</p>
                    </div>
                </div>

                <div
                    id="lodging-slider"
                    className="flex space-x-6 md:space-x-8 overflow-x-auto pb-10 md:pb-12 scrollbar-hide snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
                >
                    {(data.suites || []).filter(suite => !suite.hidden).map((suite, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="min-w-[85vw] md:min-w-[700px] lg:min-w-[900px] snap-center"
                        >
                            <div className="flex flex-col lg:flex-row gap-8 md:gap-12 items-center bg-white/5 p-6 md:p-12 rounded-[32px] md:rounded-[40px] border border-white/5 backdrop-blur-md">
                                <div
                                    className="w-full lg:w-1/2 relative group overflow-hidden rounded-2xl md:rounded-3xl shadow-2xl aspect-[4/3] cursor-pointer"
                                    onClick={() => {
                                        setSelectedSuite(suite);
                                        setCurrentPhotoIndex(0);
                                    }}
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
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] font-archivo font-black text-white/80">VER GALERÍA</div>
                                    </div>
                                    <div className="absolute top-4 md:top-6 left-4 md:left-6 glass px-4 md:px-6 py-1 md:py-2 rounded-full text-[8px] md:text-[10px] tracking-widest font-bold text-gold uppercase">
                                        {suite.highlight}
                                    </div>
                                </div>

                                <div className="w-full lg:w-1/2 space-y-4 md:space-y-6 text-left">
                                    <h3 className="text-2xl md:text-4xl font-archivo font-black tracking-tighter italic uppercase">{suite.name}</h3>
                                    <div className="grid grid-cols-2 gap-4 md:gap-6 py-4 md:py-6 border-y border-white/10">
                                        <div>
                                            <div className="text-gold text-[8px] md:text-[9px] tracking-widest font-archivo font-black mb-1 uppercase">Capacidad</div>
                                            <div className="text-white/80 font-sans font-light text-xs md:text-sm">{suite.capacity}</div>
                                        </div>
                                        <div>
                                            <div className="text-gold text-[8px] md:text-[9px] tracking-widest font-archivo font-black mb-1 uppercase">Espacio</div>
                                            <div className="text-white/80 font-sans font-light text-xs md:text-sm">{suite.space}</div>
                                        </div>
                                        <div className="col-span-2">
                                            <div className="text-gold text-[8px] md:text-[9px] tracking-widest font-archivo font-black mb-1 uppercase">Camas</div>
                                            <div className="text-white/80 font-sans font-light text-xs md:text-sm">{suite.beds}</div>
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

            {/* ─── Gallery Modal ─── */}
            <AnimatePresence>
                {selectedSuite && (
                    <motion.div
                        key="gallery-modal"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center select-none"
                        style={{ zIndex: 9999 }}
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onClick={(e) => {
                            // Only close when tapping directly on the black backdrop (not on any child)
                            if (e.target === e.currentTarget) {
                                setSelectedSuite(null);
                            }
                        }}
                    >
                        {/* Close button */}
                        <button
                            type="button"
                            style={{ zIndex: 10001 }}
                            className="absolute top-4 right-4 md:top-6 md:right-6 bg-white/10 hover:bg-white/25 text-white rounded-full p-3 touch-manipulation transition-colors"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSelectedSuite(null);
                            }}
                            aria-label="Cerrar"
                        >
                            <X size={24} strokeWidth={2} />
                        </button>

                        {/* Image + nav container — stopPropagation so clicks here don't reach backdrop */}
                        <div
                            className="relative flex items-center justify-center w-full h-full px-16"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Photo */}
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentPhotoIndex}
                                    src={photos[currentPhotoIndex] || selectedSuite.img}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl select-none"
                                    draggable={false}
                                    style={{ zIndex: 10000 }}
                                />
                            </AnimatePresence>

                            {/* Nav buttons — only shown when multiple photos */}
                            {photos.length > 1 && (
                                <>
                                    {/* Left */}
                                    <button
                                        type="button"
                                        style={{ zIndex: 10001 }}
                                        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/70 border border-white/20 text-white hover:bg-gold hover:border-gold transition-all touch-manipulation shadow-xl active:scale-95"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            prevPhoto();
                                        }}
                                        aria-label="Foto anterior"
                                    >
                                        <ChevronLeft size={22} />
                                    </button>

                                    {/* Right */}
                                    <button
                                        type="button"
                                        style={{ zIndex: 10001 }}
                                        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/70 border border-white/20 text-white hover:bg-gold hover:border-gold transition-all touch-manipulation shadow-xl active:scale-95"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            nextPhoto();
                                        }}
                                        aria-label="Foto siguiente"
                                    >
                                        <ChevronRight size={22} />
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Counter + dots */}
                        {photos.length > 1 && (
                            <div
                                className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-3"
                                style={{ zIndex: 10001 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <span className="text-[10px] tracking-[0.4em] font-archivo font-black text-white/50 uppercase">
                                    {currentPhotoIndex + 1} DE {photos.length}
                                </span>
                                <div className="flex gap-2">
                                    {photos.map((_, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            className={`rounded-full transition-all touch-manipulation ${i === currentPhotoIndex ? 'bg-gold w-4 h-2' : 'bg-white/30 w-2 h-2'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setCurrentPhotoIndex(i);
                                            }}
                                            aria-label={`Foto ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
