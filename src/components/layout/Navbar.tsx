import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
    Menu,
    X,
    Instagram,
    Facebook,
    Twitter,
    User
} from 'lucide-react';
import { PageData } from '../../types';

export const Navbar = ({ data, onAdminClick }: { data: PageData, onAdminClick: () => void }) => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 100);
        };

        const observerOptions = {
            root: null,
            rootMargin: '-40% 0px -40% 0px',
            threshold: 0,
        };

        const observerCallback = (entries: IntersectionObserverEntry[]) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        const sections = data.sectionOrder || [];
        sections.forEach((id) => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        window.addEventListener('scroll', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll);
            observer.disconnect();
        };
    }, [data.sectionOrder]);

    const navLinks = (data.sectionOrder || [])
        .filter(id => !data.hiddenSections?.includes(id))
        .map(id => ({
            name: (data.sectionLabels && data.sectionLabels[id]) || id.toUpperCase(),
            id
        }));

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <>
            {/* 1. Global Brand Header */}
            <header className="absolute top-0 left-0 w-full z-50 py-6 px-8 flex justify-between items-center">
                <style dangerouslySetInnerHTML={{
                    __html: `
                    :root {
                        --logo-height: ${data.settings.mobileLogoSize || 48}px;
                    }
                    @media (min-width: 768px) {
                        :root {
                            --logo-height: ${data.settings.logoSize || 60}px;
                        }
                    }
                `}} />
                <div className="flex items-center">
                    <img
                        src={data.settings.headerLogoUrl || undefined}
                        alt="Real People Logo"
                        className="w-auto object-contain transition-all duration-300"
                        style={{
                            height: `var(--logo-height, ${data.settings.logoSize || 60}px)`
                        }}
                        referrerPolicy="no-referrer"
                    />
                </div>

                <div className="flex items-center space-x-6">
                    <button
                        onClick={onAdminClick}
                        className="p-2 text-white/40 hover:text-gold transition-all"
                        title="Admin Panel"
                    >
                        <User size={20} />
                    </button>

                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setIsMobileMenuOpen(true)}
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            {/* 2. Centered Pill Menu (Tomorrowland Style) */}
            <div className={`fixed left-0 w-full z-50 transition-all duration-700 pointer-events-none ${isScrolled ? 'top-6' : 'bottom-12'}`}>
                <div className="max-w-7xl mx-auto px-4 flex justify-center">
                    <motion.nav
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className={`pointer-events-auto flex items-center px-2 py-2 rounded-full transition-all duration-500 shadow-2xl glass text-white ${isScrolled ? 'scale-90 md:scale-100' : ''}`}
                    >
                        {/* Event Title */}
                        <div className="hidden lg:flex items-center px-6 border-r border-white/10">
                            <span className="text-[9px] tracking-[0.3em] font-display font-black whitespace-nowrap uppercase">{data.settings.navBrandText}</span>
                        </div>

                        {/* Nav Links */}
                        <div className="hidden md:flex items-center px-1 md:px-4 space-x-0 md:space-x-2">
                            {navLinks.map((link) => (
                                <button
                                    key={link.name}
                                    onClick={() => scrollToSection(link.id)}
                                    className={`px-2 md:px-5 py-2 rounded-full text-[8px] md:text-[10px] tracking-[0.1em] md:tracking-[0.2em] font-display font-black transition-all duration-300 relative group cursor-pointer`}
                                >
                                    <span className="relative z-10">{link.name}</span>
                                    {activeSection === link.id && (
                                        <motion.div
                                            layoutId="pillActive"
                                            className="absolute inset-0 rounded-full z-0 bg-white/10"
                                        />
                                    )}
                                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0 h-[2px] transition-all duration-300 group-hover:w-1/2 bg-gold"></div>
                                </button>
                            ))}
                        </div>

                        {/* Mobile Nav Links (Simplified) */}
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="flex md:hidden items-center px-4 py-2 hover:bg-white/5 rounded-full transition-colors"
                        >
                            <span className="text-[9px] tracking-[0.3em] font-display font-black uppercase text-gold">MENU</span>
                        </button>
                    </motion.nav>
                </div>
            </div>

            {/* Full-screen Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-dark z-[100] flex flex-col items-center justify-center space-y-8"
                    >
                        <button
                            className="absolute top-8 right-8 text-white p-2"
                            onClick={() => setIsMobileMenuOpen(false)}
                        >
                            <X size={32} strokeWidth={1} />
                        </button>

                        <div className="text-gold text-[10px] tracking-[0.5em] font-display font-black mb-4">MENÚ</div>

                        {navLinks.map((link, idx) => (
                            <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 * idx }}
                                key={link.name}
                                onClick={() => {
                                    setIsMobileMenuOpen(false);
                                    scrollToSection(link.id);
                                }}
                                className="text-3xl font-display font-black tracking-[0.2em] hover:text-gold transition-colors italic uppercase cursor-pointer"
                            >
                                {link.name}
                            </motion.button>
                        ))}

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5 }}
                            className="pt-12 flex space-x-8 text-white/40"
                        >
                            <Instagram size={24} />
                            <Facebook size={24} />
                            <Twitter size={24} />
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};
