import React from 'react';
import { motion } from 'motion/react';
import {
    ChevronLeft,
    ChevronRight,
    Clock
} from 'lucide-react';
import { PageData } from '../../types';

export const Experience = ({ data }: { data: PageData['experience'] }) => {
    const scroll = (direction: 'left' | 'right') => {
        const container = document.getElementById('experience-slider');
        if (container) {
            const scrollAmount = container.clientWidth * 0.8;
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    return (
        <section id="experience" className="py-20 md:py-32 bg-dark/30 backdrop-blur-sm overflow-hidden">
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-16 gap-6 md:gap-8">
                    <div className="text-left">
                        <h2 className="text-4xl md:text-7xl font-archivo font-black tracking-tighter italic mb-4 md:mb-6 uppercase">{data.title}</h2>
                        <div className="w-24 md:w-32 h-[1px] bg-gold opacity-50"></div>
                    </div>

                </div>

                <div
                    id="experience-slider"
                    className="flex space-x-6 md:space-x-8 overflow-x-auto pb-10 md:pb-12 scrollbar-hide snap-x snap-mandatory"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {(data.items || []).filter(item => !item.hidden).map((item, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.1 }}
                            className="min-w-[85vw] md:min-w-[400px] lg:min-w-[500px] snap-center"
                        >
                            <div className="relative group overflow-hidden rounded-[24px] md:rounded-[32px] aspect-[3/4] shadow-2xl">
                                <img
                                    src={item.img || undefined}
                                    alt={item.title}
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                    referrerPolicy="no-referrer"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-dark via-dark/20 to-transparent opacity-90"></div>

                                <div className="absolute bottom-0 left-0 p-6 md:p-12 w-full">
                                    {item.duration && (
                                        <div className="flex items-center space-x-2 text-gold text-[8px] md:text-[10px] tracking-widest font-archivo font-black mb-2 md:mb-4 uppercase">
                                            <Clock size={12} />
                                            <span>{item.duration}</span>
                                        </div>
                                    )}
                                    <h3 className="text-2xl md:text-3xl font-archivo font-black tracking-tighter mb-2 md:mb-3 italic uppercase">{item.title}</h3>
                                    <p className="text-white/60 text-xs md:text-sm font-sans font-light leading-relaxed tracking-wide line-clamp-3">{item.desc}</p>
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
        </section>
    );
};
