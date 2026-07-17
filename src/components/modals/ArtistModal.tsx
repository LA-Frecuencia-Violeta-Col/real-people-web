import React from 'react';
import { motion } from 'motion/react';
import { X, Instagram } from 'lucide-react';
import { PageData } from '../../types';

interface ArtistModalProps {
    artist: PageData['lineup']['artists'][0];
    onClose: () => void;
}

export const ArtistModal = ({ artist, onClose }: ArtistModalProps) => {
    const getYouTubeEmbedUrl = (url: string) => {
        if (!url) return '';
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : url;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 uppercase overflow-hidden">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-dark/95 backdrop-blur-md md:backdrop-blur-xl"
            />

            <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-4xl bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl overflow-y-auto max-h-[90vh] scrollbar-hide pointer-events-auto"
            >
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-[10001] p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors text-white pointer-events-auto"
                >
                    <X size={24} />
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Image / Media Section */}
                    <div className="relative aspect-square lg:aspect-auto lg:h-full min-h-[400px]">
                        <img
                            src={artist.img || undefined}
                            alt={artist.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>

                        <div className="absolute bottom-8 left-8 right-8">
                            <div className="text-gold text-[10px] tracking-[0.3em] font-archivo font-black mb-2 uppercase italic">{artist.genre}</div>
                            <h2 className="text-4xl md:text-6xl font-archivo font-black tracking-tighter uppercase italic leading-none">{artist.name}</h2>
                        </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-8 md:p-12 flex flex-col justify-center space-y-8 relative">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-6 text-white/40 border-b border-white/10 pb-6 uppercase">
                                {artist.instagram && (
                                    <a href={artist.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors p-2 pointer-events-auto">
                                        <Instagram size={22} />
                                    </a>
                                )}
                                {artist.spotify && (
                                    <a href={artist.spotify} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors p-2 pointer-events-auto">
                                        <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M15.915,8.865 C12.692,6.951 7.375,6.775 4.297,7.709 C3.803,7.858 3.281,7.58 3.131,7.085 C2.981,6.591 3.26,6.069 3.754,5.919 C7.287,4.846 13.159,5.053 16.87,7.256 C17.314,7.52 17.46,8.094 17.196,8.538 C16.934,8.982 16.358,9.129 15.915,8.865 L15.915,8.865 Z M15.81,11.7 C15.584,12.067 15.104,12.182 14.737,11.957 C12.05,10.305 7.952,9.827 4.773,10.792 C4.36,10.916 3.925,10.684 3.8,10.272 C3.676,9.86 3.908,9.425 4.32,9.3 C7.951,8.198 12.466,8.732 15.553,10.629 C15.92,10.854 16.035,11.334 15.81,11.7 L15.81,11.7 Z M14.586,14.423 C14.406,14.717 14.023,14.81 13.729,14.63 C11.381,13.195 8.425,12.871 4.944,13.666 C4.609,13.743 4.274,13.533 4.198,13.197 C4.121,12.862 4.33,12.528 4.667,12.451 C8.476,11.580 11.743,11.955 14.379,13.566 C14.673,13.746 14.766,14.129 14.586,14.423 L14.586,14.423 Z M10,0 C4.477,0 0,4.477 0,10 C0,15.523 4.477,20 10,20 C15.523,20 20,15.523 20,10 C20,4.478 15.523,0.001 10,0.001 L10,0 Z" />
                                        </svg>
                                    </a>
                                )}
                                {artist.soundcloud && (
                                    <a href={artist.soundcloud} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors p-2 pointer-events-auto">
                                        <svg width="26" height="26" viewBox="-271 345.8 256 111.2" fill="currentColor">
                                            <path d="M-238.4,398.1c-0.8,0-1.4,0.6-1.5,1.5l-2.3,28l2.3,27.1c0.1,0.8,0.7,1.5,1.5,1.5c0.8,0,1.4-0.6,1.5-1.5l2.6-27.1l-2.6-28 C-237,398.7-237.7,398.1-238.4,398.1z"></path>
                                            <path d="M-228.2,399.9c-0.9,0-1.7,0.7-1.7,1.7l-2.1,26l2.1,27.3c0.1,1,0.8,1.7,1.7,1.7c0.9,0,1.6-0.7,1.7-1.7l2.4-27.3l-2.4-26 C-226.6,400.6-227.3,399.9-228.2,399.9z"></path>
                                            <path d="M-258.6,403.5c-0.5,0-1,0.4-1.1,1l-2.5,23l2.5,22.5c0.1,0.6,0.5,1,1.1,1c0.5,0,1-0.4,1.1-1l2.9-22.5l-2.9-23 C-257.7,404-258.1,403.5-258.6,403.5z"></path>
                                            <path d="M-268.1,412.3c-0.5,0-1,0.4-1,1l-1.9,14.3l1.9,14c0.1,0.6,0.5,1,1,1s0.9-0.4,1-1l2.2-14l-2.2-14.2 C-267.2,412.8-267.6,412.3-268.1,412.3z"></path>
                                            <path d="M-207.5,373.5c-1.2,0-2.1,0.9-2.2,2.1l-1.9,52l1.9,27.2c0.1,1.2,1,2.1,2.2,2.1s2.1-0.9,2.2-2.1l2.1-27.2l-2.1-52 C-205.4,374.4-206.4,373.5-207.5,373.5z"></path>
                                            <path d="M-248.6,399c-0.7,0-1.2,0.5-1.3,1.3l-2.4,27.3l2.4,26.3c0.1,0.7,0.6,1.3,1.3,1.3c0.7,0,1.2-0.5,1.3-1.2l2.7-26.3l-2.7-27.3 C-247.4,399.6-247.9,399-248.6,399z"></path>
                                            <path d="M-217.9,383.4c-1,0-1.9,0.8-1.9,1.9l-2,42.3l2,27.3c0.1,1.1,0.9,1.9,1.9,1.9s1.9-0.8,1.9-1.9l2.3-27.3l-2.3-42.3 C-216,384.2-216.9,383.4-217.9,383.4z"></path>
                                            <path d="M-154.4,359.3c-1.8,0-3.2,1.4-3.2,3.2l-1.2,65l1.2,26.1c0,1.8,1.5,3.2,3.2,3.2c1.8,0,3.2-1.5,3.2-3.2l1.4-26.1l-1.4-65 C-151.1,360.8-152.6,359.3-154.4,359.3z"></path>
                                            <path d="M-197.1,368.9c-1.3,0-2.3,1-2.4,2.4l-1.8,56.3l1.8,26.9c0,1.3,1.1,2.3,2.4,2.3s2.3-1,2.4-2.4l2-26.9l-2-56.3 C-194.7,370-195.8,368.9-197.1,368.9z"></path>
                                            <path d="M-46.5,394c-4.3,0-8.4,0.9-12.2,2.4C-61.2,368-85,345.8-114,345.8c-7.1,0-14,1.4-20.1,3.8c-2.4,0.9-3,1.9-3,3.7v99.9 c0,1.9,1.5,3.5,3.4,3.7c0.1,0,86.7,0,87.3,0c17.4,0,31.5-14.1,31.5-31.5C-15,408.1-29.1,394-46.5,394z"></path>
                                            <path d="M-143.6,353.2c-1.9,0-3.4,1.6-3.5,3.5l-1.4,70.9l1.4,25.7c0,1.9,1.6,3.4,3.5,3.4c1.9,0,3.4-1.6,3.5-3.5l1.5-25.8l-1.5-70.9 C-140.2,354.8-141.7,353.2-143.6,353.2z"></path>
                                            <path d="M-186.5,366.8c-1.4,0-2.5,1.1-2.6,2.6l-1.6,58.2l1.6,26.7c0,1.4,1.2,2.6,2.6,2.6s2.5-1.1,2.6-2.6l1.8-26.7l-1.8-58.2 C-184,367.9-185.1,366.8-186.5,366.8z"></path>
                                            <path d="M-175.9,368.1c-1.5,0-2.8,1.2-2.8,2.8l-1.5,56.7l1.5,26.5c0,1.6,1.3,2.8,2.8,2.8s2.8-1.2,2.8-2.8l1.7-26.5l-1.7-56.7 C-173.1,369.3-174.3,368.1-175.9,368.1z"></path>
                                            <path d="M-165.2,369.9c-1.7,0-3,1.3-3,3l-1.4,54.7l1.4,26.3c0,1.7,1.4,3,3,3c1.7,0,3-1.3,3-3l1.5-26.3l-1.5-54.7 C-162.2,371.3-163.5,369.9-165.2,369.9z"></path>
                                        </svg>
                                    </a>
                                )}
                                {artist.beatport && (
                                    <a href={artist.beatport} target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors p-2 pointer-events-auto">
                                        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M14.668 24c-3.857 0-6.935-3.039-6.935-6.974a6.98 6.98 0 0 1 1.812-4.714l-4.714 4.714-2.474-2.474 5.319-5.26c.72-.72 1.09-1.656 1.09-2.688V0h3.487v6.604c0 2.026-.72 3.74-2.123 5.143l-.156.156a6.945 6.945 0 0 1 4.694-1.812c3.955 0 6.975 3.136 6.975 6.935A6.943 6.943 0 0 1 14.668 24zm0-10.714c-2.123 0-3.779 1.753-3.779 3.74 0 2.045 1.675 3.78 3.78 3.78a3.804 3.804 0 0 0 3.818-3.78c0-2.065-1.715-3.74-3.819-3.74z"></path>
                                        </svg>
                                    </a>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <p className="text-white/60 font-sans text-sm md:text-base leading-relaxed normal-case">
                                {artist.bio || "No hay biografía disponible para este artista en este momento."}
                            </p>

                            {artist.videoUrl && (
                                <div className="aspect-video rounded-xl overflow-hidden border border-white/10 bg-white/5 relative z-20 pointer-events-auto">
                                    <iframe
                                        src={getYouTubeEmbedUrl(artist.videoUrl)}
                                        className="w-full h-full"
                                        allow="autoplay; encrypted-media"
                                        title={`Video de ${artist.name}`}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="pt-6 relative z-20">
                            <button
                                onClick={onClose}
                                className="w-full py-4 rounded-full border border-white/10 font-archivo font-black text-[10px] tracking-[0.3em] hover:bg-white/5 transition-colors uppercase pointer-events-auto"
                            >
                                Volver al Line Up
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
