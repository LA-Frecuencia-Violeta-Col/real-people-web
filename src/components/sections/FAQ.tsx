import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Plus,
    Minus
} from 'lucide-react';
import { PageData } from '../../types';

export const FAQ = ({ data }: { data: PageData['faqs'] }) => {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    return (
        <section id="faqs" className="py-20 md:py-32 bg-dark/30 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-12 md:mb-20">
                    <span className="text-gold tracking-[0.5em] text-[10px] font-archivo font-black uppercase mb-2 md:mb-4 block">{data.subtitle}</span>
                    <h2 className="text-3xl md:text-6xl font-archivo font-black tracking-tighter uppercase italic">{data.title}</h2>
                </div>

                <div className="space-y-2 md:space-y-4">
                    {(data.items || []).filter(item => !item.hidden).map((item, idx) => (
                        <div key={idx} className="border-b border-white/10 pb-2 md:pb-4">
                            <button
                                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                                className="w-full flex justify-between items-center py-4 md:py-6 text-left group"
                            >
                                <span className={`text-lg md:text-2xl font-archivo font-black tracking-tight transition-colors ${openIndex === idx ? 'text-white' : 'text-white/40 group-hover:text-white'}`}>
                                    {item.question}
                                </span>
                                <div className={`transition-transform duration-500 ${openIndex === idx ? 'rotate-180' : ''}`}>
                                    {openIndex === idx ? <Minus size={18} className="text-white" /> : <Plus size={18} className="text-white/40" />}
                                </div>
                            </button>
                            <AnimatePresence>
                                {openIndex === idx && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden"
                                    >
                                        <p className="text-white/60 font-sans leading-relaxed pb-6 md:pb-8 text-base md:text-lg">
                                            {item.answer}
                                        </p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};
