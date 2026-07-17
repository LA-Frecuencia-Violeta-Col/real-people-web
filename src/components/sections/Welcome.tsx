import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Plus,
    Minus,
    ChevronRight
} from 'lucide-react';
import { PageData } from '../../types';
import { isYouTubeUrl, getYouTubeEmbedUrl, isVideoUrl } from '../../lib/videoUtils';

export const Welcome = ({ data }: { data: PageData['welcome'] }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(2); // Default open "Quality" as in image
    const [openIndex2, setOpenIndex2] = useState<number | null>(null);

    return (
        <section id="welcome" className="py-20 md:py-32 bg-dark/20 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 space-y-20 lg:space-y-32">
                {/* Block 1: Image Left, Accordion Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl"
                    >
                        {isYouTubeUrl(data.video1) ? (
                            <iframe
                                src={getYouTubeEmbedUrl(data.video1)}
                                className="w-full h-full object-cover"
                                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                title="Welcome Video 1"
                            />
                        ) : isVideoUrl(data.video1) ? (
                            <video
                                src={data.video1 || undefined}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={data.img1 || data.video1 || undefined}
                                alt={data.title1}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        )}
                    </motion.div>

                    <div className="space-y-6 md:space-y-8 text-left">
                        <div className="space-y-2">
                            <span className="text-gold tracking-[0.5em] text-[10px] font-archivo font-black uppercase">{data.subtitle1 || 'ESENCIA'}</span>
                            <h2 className="text-3xl md:text-6xl font-archivo font-black tracking-tighter uppercase leading-tight">
                                {data.title1}
                            </h2>
                            <p className="text-white/60 font-sans text-sm md:text-base leading-relaxed max-w-lg">
                                {data.desc1}
                            </p>
                        </div>

                        <div className="space-y-2 md:space-y-4 pt-4 border-t border-white/10">
                            {(data.accordion || []).filter(item => !item.hidden).map((item, idx) => (
                                <div key={idx} className="border-b border-white/10 pb-2 md:pb-4">
                                    <button
                                        onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                        className="w-full flex justify-between items-center py-4 text-left group"
                                    >
                                        <span className={`text-xl md:text-3xl font-archivo font-black tracking-tighter transition-colors ${openIndex === idx ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>
                                            {item.title}
                                        </span>
                                        {openIndex === idx ? <Minus size={18} className="text-white" /> : <Plus size={18} className="text-white/40" />}
                                    </button>
                                    <AnimatePresence>
                                        {openIndex === idx && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <p className="text-white/60 font-sans text-sm md:text-base leading-relaxed pb-4 max-w-lg">
                                                    {item.content}
                                                </p>
                                                <button
                                                    onClick={() => {
                                                        const url = item.btnUrl || '';
                                                        if (url.startsWith('#')) {
                                                            const el = document.getElementById(url.substring(1));
                                                            el?.scrollIntoView({ behavior: 'smooth' });
                                                        } else if (url.startsWith('http')) {
                                                            window.open(url, '_blank');
                                                        }
                                                    }}
                                                    className="flex items-center space-x-2 text-[8px] md:text-[10px] tracking-[0.3em] font-archivo font-black text-white hover:text-gold transition-colors uppercase border border-white/20 px-4 md:px-6 py-2 md:py-3 rounded-full"
                                                >
                                                    <span>{item.btnText || 'SABER MÁS'}</span>
                                                    <ChevronRight size={12} />
                                                </button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Block 2: Text Left, Image Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                    <div className="space-y-6 md:space-y-8 order-2 lg:order-1 text-left">
                        <div className="space-y-2">
                            <span className="text-gold tracking-[0.5em] text-[10px] font-archivo font-black uppercase">{data.subtitle2}</span>
                            <h2 className="text-3xl md:text-6xl font-archivo font-black tracking-tighter uppercase leading-tight">
                                {data.title2}
                            </h2>
                        </div>
                        {data.desc2 && (
                            <p className="text-white/60 font-sans text-sm md:text-base leading-relaxed max-w-xl">
                                {data.desc2}
                            </p>
                        )}

                        {(data.accordion2 && data.accordion2.length > 0) ? (
                            <div className="space-y-2 md:space-y-4 pt-4 border-t border-white/10">
                                {data.accordion2.filter(item => !item.hidden).map((item, idx) => (
                                    <div key={idx} className="border-b border-white/10 pb-2 md:pb-4">
                                        <button
                                            onClick={() => setOpenIndex2(openIndex2 === idx ? null : idx)}
                                            className="w-full flex justify-between items-center py-4 text-left group"
                                        >
                                            <span className={`text-xl md:text-3xl font-archivo font-black tracking-tighter transition-colors ${openIndex2 === idx ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>
                                                {item.title}
                                            </span>
                                            {openIndex2 === idx ? <Minus size={18} className="text-white" /> : <Plus size={18} className="text-white/40" />}
                                        </button>
                                        <AnimatePresence>
                                            {openIndex2 === idx && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    className="overflow-hidden"
                                                >
                                                    <p className="text-white/60 font-sans text-sm md:text-base leading-relaxed pb-4 max-w-lg">
                                                        {item.content}
                                                    </p>
                                                    {item.btnText && (
                                                        <button
                                                            onClick={() => {
                                                                const url = item.btnUrl || '';
                                                                if (url.startsWith('#')) {
                                                                    const el = document.getElementById(url.substring(1));
                                                                    el?.scrollIntoView({ behavior: 'smooth' });
                                                                } else if (url.startsWith('http')) {
                                                                    window.open(url, '_blank');
                                                                }
                                                            }}
                                                            className="flex items-center space-x-2 text-[8px] md:text-[10px] tracking-[0.3em] font-archivo font-black text-white hover:text-gold transition-colors uppercase border border-white/20 px-4 md:px-6 py-2 md:py-3 rounded-full"
                                                        >
                                                            <span>{item.btnText}</span>
                                                            <ChevronRight size={12} />
                                                        </button>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        ) : data.btnText2 && (
                            <button
                                onClick={() => {
                                    const url = data.btnUrl2 || '';
                                    if (url.startsWith('#')) {
                                        const el = document.getElementById(url.substring(1));
                                        el?.scrollIntoView({ behavior: 'smooth' });
                                    } else if (url.startsWith('http')) {
                                        window.open(url, '_blank');
                                    }
                                }}
                                className="bg-gold text-white px-6 md:px-8 py-3 md:py-4 rounded-full border border-white/20 font-archivo font-black text-[10px] tracking-[0.3em] flex items-center space-x-3 hover:scale-105 transition-transform uppercase"
                            >
                                <span>{data.btnText2}</span>
                                <ChevronRight size={16} />
                            </button>
                        )}
                    </div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-2xl order-1 lg:order-2"
                    >
                        {isYouTubeUrl(data.video2) ? (
                            <iframe
                                src={getYouTubeEmbedUrl(data.video2)}
                                className="w-full h-full object-cover"
                                allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                                title="Welcome Video 2"
                            />
                        ) : isVideoUrl(data.video2) ? (
                            <video
                                src={data.video2 || undefined}
                                autoPlay
                                muted
                                loop
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <img
                                src={data.img2 || data.video2 || undefined}
                                alt={data.title2}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                        )}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};
