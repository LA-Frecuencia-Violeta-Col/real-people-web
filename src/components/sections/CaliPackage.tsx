import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { PageData } from '../../types';

export const CaliPackage = ({ data }: { data: PageData['caliPackage'] }) => {
    const IconComponent = (Icons as any)[data.icon || 'Calendar'] || Icons.Calendar;

    return (
        <section id="caliPackage" className="py-16 md:py-24 bg-dark/20 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-6">
                <motion.div
                    whileInView={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.6 }}
                    className="border border-gold/40 p-6 sm:p-10 md:p-16 relative rounded-3xl bg-black/40 backdrop-blur-md shadow-2xl"
                >
                    {/* Decorative gold corner brackets */}
                    <div className="absolute -top-[2px] -left-[2px] w-12 h-12 md:w-16 md:h-16 border-t-2 border-l-2 border-gold rounded-tl-3xl"></div>
                    <div className="absolute -bottom-[2px] -right-[2px] w-12 h-12 md:w-16 md:h-16 border-b-2 border-r-2 border-gold rounded-br-3xl"></div>

                    <div className="text-center relative z-10">
                        <div className="inline-flex items-center justify-center p-3.5 bg-gold/10 border border-gold/30 rounded-2xl mb-6 text-gold shadow-lg">
                            <IconComponent size={36} />
                        </div>

                        <h2 className="text-3xl sm:text-4xl md:text-6xl font-archivo font-black tracking-tighter mb-4 md:mb-6 italic uppercase text-white">
                            {data.title || 'ITINERARIO DÍA A DÍA'}
                        </h2>
                        
                        {data.desc && (
                            <p className="text-white/70 font-sans font-light text-sm md:text-base tracking-wide max-w-2xl mx-auto mb-10 md:mb-14">
                                {data.desc}
                            </p>
                        )}

                        {/* Itinerary Cards Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left">
                            {(data.items || []).filter(item => !item.hidden).map((item, idx) => {
                                // Extract day badge if title contains "|" or "Día"
                                const hasPipe = item.title.includes('|');
                                const dayTag = hasPipe ? item.title.split('|')[0].trim() : `DÍA ${idx + 1}`;
                                const dayTitle = hasPipe ? item.title.split('|')[1].trim() : item.title;

                                // Format description lines
                                const lines = (item.desc || '').split('\n').filter(Boolean);

                                return (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1, duration: 0.5 }}
                                        className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-gold/40 transition-all duration-300 backdrop-blur-md flex flex-col justify-between group hover:bg-white/[0.07]"
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-4 mb-3">
                                                <span className="px-3 py-1 bg-gold/20 border border-gold/40 rounded-full text-[9px] md:text-[10px] tracking-[0.25em] font-archivo font-black text-gold uppercase">
                                                    {dayTag}
                                                </span>
                                            </div>

                                            <h4 className="text-lg md:text-xl font-archivo font-black tracking-tight mb-4 text-white uppercase italic group-hover:text-gold transition-colors">
                                                {dayTitle}
                                            </h4>

                                            <div className="space-y-2.5">
                                                {lines.map((line, lIdx) => (
                                                    <div key={lIdx} className="flex items-start gap-2.5 text-white/80 text-xs md:text-sm font-sans font-light leading-relaxed">
                                                        <span className="text-gold font-bold mt-0.5">•</span>
                                                        <span>{line.replace(/^•\s*/, '')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {data.btnText && (
                            <div className="mt-10 md:mt-14">
                                <button
                                    onClick={() => {
                                        const url = data.btnUrl || '#buy';
                                        if (url.startsWith('#')) {
                                            const el = document.getElementById(url.substring(1));
                                            el?.scrollIntoView({ behavior: 'smooth' });
                                        } else if (url.startsWith('http')) {
                                            window.open(url, '_blank');
                                        }
                                    }}
                                    className="px-8 md:px-12 py-4 md:py-5 bg-gold text-dark text-[10px] md:text-[11px] tracking-[0.3em] font-archivo font-black hover:bg-white hover:text-dark transition-all duration-500 uppercase rounded-full border border-gold shadow-xl active:scale-95"
                                >
                                    {data.btnText}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
