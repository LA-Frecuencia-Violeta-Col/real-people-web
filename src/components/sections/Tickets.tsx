import React from 'react';
import { motion } from 'motion/react';
import { PageData } from '../../types';

export const Tickets = ({ data }: { data: PageData['tickets'] }) => {
    return (
        <section id="tickets" className="py-20 md:py-24 bg-dark/40 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-12 md:mb-20">
                    <h2 className="text-3xl md:text-6xl font-archivo font-black tracking-tighter mb-4 md:mb-6 italic uppercase">{data.title}</h2>
                    <p className="text-white/50 tracking-[0.2em] text-[10px] md:text-[12px] font-archivo font-black uppercase">{data.subtitle}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {(data.tiers || []).filter(tier => !tier.hidden).map((tier, idx) => (
                        <div
                            key={idx}
                            className={`relative p-8 md:p-12 flex flex-col items-center text-center transition-all duration-500 overflow-hidden rounded-2xl ${tier.recommended ? 'glass border-gold/50 md:scale-105 z-10' : 'bg-white/5 border border-white/5'}`}
                        >
                            {/* Tier Background Image */}
                            {tier.bgImage && (
                                <div className="absolute inset-0 z-0">
                                    <img
                                        src={tier.bgImage || undefined}
                                        alt={tier.name}
                                        className="w-full h-full object-cover opacity-20 transition-transform duration-700 group-hover:scale-110"
                                        referrerPolicy="no-referrer"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/40 to-dark/80"></div>
                                </div>
                            )}

                            <div className="relative z-10 w-full flex flex-col items-center">
                                {tier.recommended && <span className="text-gold text-[9px] md:text-[10px] tracking-[0.3em] font-archivo font-black mb-4 md:mb-6 uppercase">Más Popular</span>}
                                <h3 className="text-2xl md:text-3xl font-archivo font-black tracking-tighter mb-3 md:mb-4 italic uppercase">{tier.name}</h3>
                                <div className="text-3xl md:text-4xl font-display font-bold mb-8 md:mb-10 text-gold">{tier.price} <span className="text-xs md:text-sm text-white/40">COP</span></div>

                                <ul className="space-y-3 md:space-y-4 mb-8 md:mb-12 w-full">
                                    {(tier.features || []).map((f, fIdx) => (
                                        <li key={fIdx} className="text-white/60 text-xs md:text-sm font-sans font-light border-b border-white/5 pb-2">{f}</li>
                                    ))}
                                </ul>

                                <button
                                    onClick={() => {
                                        const url = tier.btnUrl || '#buy';
                                        if (url.startsWith('#')) {
                                            const el = document.getElementById(url.substring(1));
                                            el?.scrollIntoView({ behavior: 'smooth' });
                                        } else {
                                            window.open(url, '_blank');
                                        }
                                    }}
                                    className={`w-full py-3 md:py-4 text-[10px] md:text-[11px] tracking-[0.3em] font-archivo font-black transition-all duration-500 rounded-full ${tier.recommended ? 'bg-gold text-white border border-gold hover:bg-white hover:text-dark' : 'border border-white/20 hover:bg-white hover:text-dark'} uppercase`}
                                >
                                    {tier.btnText || 'COMPRAR AHORA'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
