import React from 'react';
import {
    MapPin,
    Instagram,
    Facebook,
    Twitter,
    Mail,
    Phone
} from 'lucide-react';
import { PageData } from '../../types';

export const Footer = ({ data, settings }: { data: PageData['footer'], settings: PageData['settings'] }) => {
    const footerLogo = settings.footerLogoUrl || settings.headerLogoUrl;

    return (
        <footer className="bg-black border-t border-white/5 pt-24 pb-12 overflow-hidden relative">
            {/* Elemento Decorativo de Fondo */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>

            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-20">

                    {/* Columna 1: Logo y Marca (5 columnas) */}
                    <div className="lg:col-span-5 space-y-8">
                        <div className="inline-block">
                            <img
                                src={footerLogo || undefined}
                                alt="Real People Footer Logo"
                                style={{
                                    '--footer-logo-size': `${settings.footerLogoSize || 80}px`,
                                    '--footer-mobile-logo-size': `${settings.footerMobileLogoSize || 60}px`
                                } as React.CSSProperties}
                                className="h-[var(--footer-mobile-logo-size)] md:h-[var(--footer-logo-size)] w-auto object-contain transition-all"
                                referrerPolicy="no-referrer"
                            />
                        </div>
                        <p className="text-white/40 font-sans font-light text-sm leading-relaxed max-w-sm">
                            {data.description}
                        </p>
                        <div className="flex items-center space-x-5 pt-2">
                            <a href={data.social.instagram} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all duration-300">
                                <Instagram size={18} />
                            </a>
                            <a href={data.social.facebook} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all duration-300">
                                <Facebook size={18} />
                            </a>
                            <a href={data.social.twitter} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-white/40 hover:text-gold hover:border-gold/50 hover:bg-gold/5 transition-all duration-300">
                                <Twitter size={18} />
                            </a>
                        </div>
                    </div>

                    {/* Columna 2: Contacto (3 columnas) */}
                    <div className="lg:col-span-3 space-y-8">
                        <h4 className="text-gold text-[10px] tracking-[0.3em] font-archivo font-black uppercase italic">Contacto</h4>
                        <div className="space-y-6">
                            {data.email && (
                                <a href={`mailto:${data.email}`} className="flex items-center space-x-4 group">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-gold group-hover:bg-gold/10 transition-all">
                                        <Mail size={14} />
                                    </div>
                                    <span className="text-white/50 font-sans font-light text-xs group-hover:text-white transition-colors">{data.email}</span>
                                </a>
                            )}
                            {data.phone && (
                                <a href={`tel:${data.phone}`} className="flex items-center space-x-4 group">
                                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-gold group-hover:bg-gold/10 transition-all">
                                        <Phone size={14} />
                                    </div>
                                    <span className="text-white/50 font-sans font-light text-xs group-hover:text-white transition-colors">{data.phone}</span>
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Columna 3: Ubicación (4 columnas) */}
                    <div className="lg:col-span-4 space-y-8">
                        <h4 className="text-gold text-[10px] tracking-[0.3em] font-archivo font-black uppercase italic">Ubicación</h4>
                        <div className="flex items-start space-x-4 group">
                            <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/20 group-hover:text-gold group-hover:bg-gold/10 transition-all shrink-0">
                                <MapPin size={14} />
                            </div>
                            <span className="text-white/50 font-sans font-light text-xs leading-loose italic max-w-xs">{data.address}</span>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-white/20 text-[9px] tracking-[0.3em] font-archivo font-black uppercase">
                        © {new Date().getFullYear()} {settings.siteName.toUpperCase()} • TODOS LOS DERECHOS RESERVADOS
                    </div>
                    <div className="flex space-x-10 text-white/20 text-[9px] tracking-[0.3em] font-archivo font-black uppercase">
                        <a href="#" className="hover:text-gold transition-colors">Política de Privacidad</a>
                        <a href="#" className="hover:text-gold transition-colors">Términos & Condiciones</a>
                    </div>
                </div>
            </div>

            {/* Efecto de degradado inferior para suavizar el final */}
            <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-gold/5 to-transparent opacity-30 pointer-events-none"></div>
        </footer>
    );
};
