import React, { useState, useEffect } from 'react';
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

    // Close modal on Esc key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedSuite(null);
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    // Prevent scroll when modal is open
    useEffect(() => {
        if (selectedSuite) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
    }, [selectedSuite]);

    const scroll = (direction: 'left' | 'right') => {
        const container = document.getElementById('lodging-slider');
        if (container) {
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    const nextPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedSuite?.gallery) {
            setCurrentPhotoIndex((prev) => (prev + 1) % selectedSuite.gallery!.length);
        }
    };

    const prevPhoto = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (selectedSuite?.gallery) {
            setCurrentPhotoIndex((prev) => (prev - 1 + selectedSuite.gallery!.length) % selectedSuite.gallery!.length);
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
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
                        className="p-4 md:p-5 border border-white/10 rounded-full hover:bg-white hover:text-dark transition-all duration-500 bg-white/5 backdrop-blur-sm shadow-xl"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-4 md:p-5 border border-white/10 rounded-full hover:bg-white hover:text-dark transition-all duration-500 bg-white/5 backdrop-blur-sm shadow-xl"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
            </div>

            {/* Gallery Modal */}
            <AnimatePresence>
                {selectedSuite && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedSuite(null)}
                        className="fixed inset-0 z-[110] bg-dark/95 backdrop-blur-xl flex items-center justify-center p-4 md:p-6 cursor-zoom-out"
                    >
                        {/* Close Button - More visible and closer to safe area */}
                        <button
                            className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors z-[120] p-2"
                            onClick={() => setSelectedSuite(null)}
                        >
                            <X size={32} strokeWidth={1.5} />
                        </button>

                        <div className="relative w-full max-w-5xl h-[70vh] md:h-[80vh] flex items-center justify-center pointer-events-none">
                            <AnimatePresence mode="wait">
                                <motion.img
                                    key={currentPhotoIndex}
                                    src={selectedSuite.gallery?.[currentPhotoIndex] || selectedSuite.img}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 1.05 }}
                                    transition={{ duration: 0.3, ease: 'easeOut' }}
                                    className="max-w-full max-h-full object-contain rounded-xl shadow-2xl pointer-events-auto cursor-default"
                                    onClick={(e) => e.stopPropagation()} // Keep propagation on image to allow swiping/future features, or remove to close
                                />
                            </AnimatePresence>

                            {/* Navigation buttons - Positioned for better reach */}
                            {selectedSuite.gallery && selectedSuite.gallery.length > 1 && (
                                <>
                                    <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-2 md:-mx-20 pointer-events-none">
                                        <button
                                            onClick={prevPhoto}
                                            className="p-3 md:p-5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-gold transition-all pointer-events-auto"
                                        >
                                            <ChevronLeft size={24} />
                                        </button>
                                        <button
                                            onClick={nextPhoto}
                                            className="p-3 md:p-5 rounded-full bg-white/5 border border-white/10 text-white hover:bg-gold transition-all pointer-events-auto"
                                        >
                                            <ChevronRight size={24} />
                                        </button>
                                    </div>

                                    {/* Photo Counter */}
                                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] tracking-[0.4em] font-archivo font-black text-white/30 lowercase pointer-events-none">
                                        {currentPhotoIndex + 1} de {selectedSuite.gallery.length}
                                    </div>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
