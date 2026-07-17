import React from 'react';
import { motion } from 'motion/react';
import * as Icons from 'lucide-react';
import { PageData } from '../../types';

export const CaliPackage = ({ data }: { data: PageData['caliPackage'] }) => {
    const IconComponent = (Icons as any)[data.icon || 'Plane'] || Icons.Plane;

    return (
        <section id="caliPackage" className="py-16 md:py-24 bg-dark/20 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-6">
                <motion.div
                    whileInView={{ opacity: 1, scale: 1 }}
                    initial={{ opacity: 0, scale: 0.95 }}
                    className="border border-gold/40 p-8 md:p-20 relative rounded-2xl"
                >
                    <div className="absolute -top-[2px] -left-[2px] w-12 h-12 md:w-16 md:h-16 border-t-2 border-l-2 border-gold rounded-tl-2xl"></div>
                    <div className="absolute -bottom-[2px] -right-[2px] w-12 h-12 md:w-16 md:h-16 border-b-2 border-r-2 border-gold rounded-br-2xl"></div>

                    <div className="text-center relative z-10">
                        <IconComponent className="mx-auto mb-6 md:mb-8 text-gold" size={40} />
                        <h2 className="text-2xl md:text-5xl font-archivo font-black tracking-tighter mb-4 md:mb-6 italic uppercase">{data.title}</h2>
                        <p className="text-white/70 font-sans font-light text-sm md:text-base tracking-wide mb-8 md:mb-12">
                            {data.desc}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 text-left">
                            {(data.items || []).filter(item => !item.hidden).map((item, idx) => (
                                <div key={idx} className="p-4 md:p-6 glass rounded-lg">
                                    <h4 className="text-gold text-[10px] md:text-[11px] tracking-[0.2em] font-archivo font-black mb-1 md:mb-2 uppercase">{item.title}</h4>
                                    <p className="text-white/80 text-xs md:text-sm font-sans font-light">{item.desc}</p>
                                </div>
                            ))}
                        </div>

                        <button
                            onClick={() => {
                                const url = data.btnUrl || '';
                                if (url.startsWith('#')) {
                                    const el = document.getElementById(url.substring(1));
                                    el?.scrollIntoView({ behavior: 'smooth' });
                                } else if (url.startsWith('http')) {
                                    window.open(url, '_blank');
                                }
                            }}
                            className="mt-8 md:mt-12 px-8 md:px-12 py-4 md:py-5 bg-gold text-white text-[10px] md:text-[11px] tracking-[0.3em] font-archivo font-black hover:bg-white hover:text-dark transition-all duration-500 uppercase rounded-full border border-gold"
                        >
                            {data.btnText || 'SOLICITAR INFORMACIÓN'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </section>
    );
};
