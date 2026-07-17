import React from 'react';
import { motion } from 'motion/react';
import { PageData } from '../../types';
import { Countdown } from './Countdown';
import { isYouTubeUrl, getYouTubeEmbedUrl, isVideoUrl } from '../../lib/videoUtils';

export const Hero = ({ data }: { data: PageData['hero'] }) => {
    const isYT = isYouTubeUrl(data.videoUrl);

    return (
        <section className="relative h-screen w-full flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                {isYT ? (
                    <iframe
                        src={getYouTubeEmbedUrl(data.videoUrl)}
                        className="w-full h-[120%] -translate-y-[10%] object-cover"
                        allow="autoplay; encrypted-media; gyroscope; picture-in-picture"
                        title="Hero Video"
                    />
                ) : isVideoUrl(data.videoUrl) ? (
                    <video
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="w-full h-full object-cover scale-105"
                    >
                        {data.videoUrl && <source src={data.videoUrl} type="video/mp4" />}
                    </video>
                ) : (
                    <img
                        src={data.bgImage || data.videoUrl || undefined}
                        alt={data.title}
                        className="w-full h-full object-cover scale-105"
                    />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-dark/60 via-dark/40 to-dark"></div>
            </div>

            <div className="relative z-10 text-center px-6 max-w-5xl -mt-20">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex items-center justify-center space-x-4 mb-4"
                >
                    <div className="h-[1px] w-8 md:w-12 bg-gold/50"></div>
                    <span className="text-gold tracking-[0.4em] md:tracking-[0.6em] text-[9px] md:text-[11px] font-archivo font-black uppercase">
                        {data.subtitle.split('|')[0].trim()}
                    </span>
                    <div className="h-[1px] w-8 md:w-12 bg-gold/50"></div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-4xl md:text-8xl font-archivo font-black tracking-tighter leading-[0.9] mb-6 uppercase"
                >
                    {data.title.split(' ').slice(0, 3).join(' ')} <br />
                    <span className="italic text-gold">{data.title.split(' ').slice(3).join(' ')}</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-white/60 tracking-[0.2em] text-[9px] md:text-[12px] font-sans font-light max-w-xl mx-auto mb-8 px-4 leading-relaxed"
                >
                    {data.subtitle.split('|')[1]?.trim() || data.subtitle}
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mb-8"
                >
                    <Countdown targetDate={data.date} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                >
                    <button
                        onClick={() => {
                            const url = data.ctaUrl || '#boleteria';
                            if (url.startsWith('#')) {
                                const el = document.getElementById(url.substring(1));
                                el?.scrollIntoView({ behavior: 'smooth' });
                            } else {
                                window.open(url, '_blank');
                            }
                        }}
                        className="inline-block px-10 md:px-16 py-4 md:py-5 bg-white text-dark text-[10px] md:text-[12px] tracking-[0.5em] font-black hover:bg-gold hover:text-white transition-all duration-500 rounded-full border-[2px] md:border-[3px] border-white hover:border-gold shadow-[0_0_50px_rgba(255,255,255,0.2)] cursor-pointer"
                    >
                        {data.ctaText}
                    </button>
                </motion.div>
            </div>

            <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/30"
            >
                <div className="w-[1px] h-16 bg-gradient-to-b from-white/50 to-transparent"></div>
            </motion.div>
        </section>
    );
};
