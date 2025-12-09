import React from 'react';
import { ThemeConfig } from '../types';
import { Activity, Star, ArrowRight, Shield, Zap, Layout, Menu, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';

// Helper to convert style preset to classes
const getPresetClasses = (preset: ThemeConfig['stylePreset'], isDark: boolean) => {
    switch (preset) {
        case 'glass':
            return {
                card: `bg-opacity-20 backdrop-filter backdrop-blur-xl border border-white/30 shadow-xl ${isDark ? 'bg-gray-900/40 text-white' : 'bg-white/40 text-gray-900'}`,
                button: `backdrop-blur-md shadow-lg border border-white/20 hover:bg-white/20 transition-all`,
                section: `bg-transparent`, // Relies on app background
                container: isDark 
                    ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-black' 
                    : 'bg-gradient-to-br from-blue-400 via-purple-300 to-pink-300'
            };
        case 'brutal':
            return {
                card: `border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] ${isDark ? 'bg-zinc-800 border-white shadow-white text-white' : 'bg-white text-black'}`,
                button: `border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all font-bold uppercase tracking-wider`,
                section: `${isDark ? 'bg-zinc-900' : 'bg-yellow-50'}`,
                container: isDark ? 'bg-zinc-950' : 'bg-yellow-50'
            };
        case 'clay':
            return {
                card: `backdrop-blur-sm border-white/20 ${isDark 
                    ? 'bg-[#2a2a2a] shadow-[inset_-8px_-8px_16px_rgba(0,0,0,0.5),inset_8px_8px_16px_rgba(255,255,255,0.1),12px_12px_20px_rgba(0,0,0,0.5)] text-white' 
                    : 'bg-[#f0f4f8] shadow-[inset_-8px_-8px_16px_rgba(174,174,192,0.4),inset_8px_8px_16px_rgba(255,255,255,1),12px_12px_20px_rgba(174,174,192,0.4)] text-gray-800'}`,
                button: `transition-transform active:scale-95 ${isDark 
                    ? 'shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.5),inset_4px_4px_8px_rgba(255,255,255,0.1),8px_8px_16px_rgba(0,0,0,0.3)]' 
                    : 'shadow-[inset_-4px_-4px_8px_rgba(0,0,0,0.1),inset_4px_4px_8px_rgba(255,255,255,0.5),8px_8px_16px_rgba(0,0,0,0.1)]'}`,
                section: `bg-transparent`,
                container: isDark ? 'bg-[#222]' : 'bg-[#eef2f6]'
            };
        case 'neumorphic':
            return {
                card: `${isDark 
                    ? 'bg-[#2b2b2b] shadow-[8px_8px_16px_#1b1b1b,-8px_-8px_16px_#3b3b3b] text-gray-200' 
                    : 'bg-[#e0e5ec] shadow-[9px_9px_16px_rgb(163,177,198,0.6),-9px_-9px_16px_rgba(255,255,255,0.5)] text-gray-700'} border-none`,
                button: `active:shadow-[inset_6px_6px_10px_rgba(163,177,198,0.7),inset_-6px_-6px_10px_rgba(255,255,255,0.8)] transition-all ${isDark 
                    ? 'shadow-[6px_6px_10px_#1b1b1b,-6px_-6px_10px_#3b3b3b]' 
                    : 'shadow-[6px_6px_10px_rgb(163,177,198,0.6),-6px_-6px_10px_rgba(255,255,255,0.5)]'}`,
                section: `bg-transparent`,
                container: isDark ? 'bg-[#2b2b2b]' : 'bg-[#e0e5ec]'
            };
        case 'material':
            return {
                card: `shadow-lg hover:shadow-xl transition-shadow duration-300 ${isDark ? 'bg-[#1e1e1e] border-t border-white/5 text-white' : 'bg-white text-gray-900'}`,
                button: `uppercase tracking-wide font-bold shadow-md hover:shadow-lg active:shadow-inner transition-all ripple`,
                section: `${isDark ? 'bg-[#121212]' : 'bg-gray-50'}`,
                container: isDark ? 'bg-[#121212]' : 'bg-gray-100'
            };
        case 'ios':
            return {
                card: `shadow-sm border border-gray-100/50 ${isDark ? 'bg-[#1c1c1e] border-gray-800 text-white' : 'bg-white text-black'}`,
                button: `active:scale-95 transition-transform duration-200 font-medium`,
                section: `${isDark ? 'bg-[#000000]' : 'bg-[#F2F2F7]'}`,
                container: isDark ? 'bg-[#000000]' : 'bg-[#F2F2F7]'
            };
        case 'modern':
        default:
            return {
                card: `shadow-md border border-transparent ${isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'}`,
                button: `hover:opacity-90 transition-opacity shadow-sm`,
                section: `${isDark ? 'bg-gray-950' : 'bg-white'}`,
                container: isDark ? 'bg-gray-950' : 'bg-white'
            };
    }
};

interface PreviewProps {
    theme: ThemeConfig;
}

export const HeaderPreview: React.FC<PreviewProps> = ({ theme }) => {
    const classes = getPresetClasses(theme.stylePreset, theme.darkMode);
    const isNeumorphic = theme.stylePreset === 'neumorphic';
    
    return (
        <header className={`w-full p-4 flex justify-between items-center sticky top-0 z-30 mb-8 ${classes.card}`} 
            style={{ 
                borderRadius: theme.stylePreset === 'brutal' ? '0' : theme.borderRadius,
                margin: theme.stylePreset === 'glass' ? '16px' : '0',
                width: theme.stylePreset === 'glass' ? 'calc(100% - 32px)' : '100%',
            }}>
            <div className="font-bold text-xl flex items-center gap-2">
                <div className={`w-10 h-10 flex items-center justify-center ${isNeumorphic ? classes.button : 'text-white'}`} 
                    style={{ 
                        backgroundColor: isNeumorphic ? 'transparent' : theme.primaryColor, 
                        borderRadius: theme.borderRadius,
                        color: isNeumorphic ? theme.primaryColor : 'white'
                    }}>
                    <Layout size={20} />
                </div>
                <span>Brand</span>
            </div>
            <nav className="hidden md:flex gap-6 text-sm font-medium opacity-70">
                <a href="#" className="hover:opacity-100 hover:scale-105 transition-transform">Features</a>
                <a href="#" className="hover:opacity-100 hover:scale-105 transition-transform">Pricing</a>
            </nav>
            <button 
                className={`px-5 py-2.5 font-medium text-sm flex items-center gap-2 ${classes.button}`}
                style={{ 
                    backgroundColor: isNeumorphic ? 'transparent' : theme.primaryColor, 
                    color: isNeumorphic ? theme.primaryColor : '#fff',
                    borderRadius: theme.borderRadius,
                }}
            >
                Get App
            </button>
        </header>
    );
};

export const HeroPreview: React.FC<PreviewProps> = ({ theme }) => {
    const classes = getPresetClasses(theme.stylePreset, theme.darkMode);
    const isNeumorphic = theme.stylePreset === 'neumorphic';

    return (
        <section className={`py-12 px-6 text-center flex flex-col items-center gap-6 relative z-10 ${theme.stylePreset !== 'glass' && theme.stylePreset !== 'clay' ? classes.section : ''}`}>
            <span className={`px-4 py-1.5 text-xs font-bold tracking-wider uppercase opacity-80 rounded-full ${classes.card}`} style={{ borderRadius: '99px' }}>
                v3.0 Mobile First
            </span>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-3xl leading-[1.1]">
                Design <span style={{ color: theme.primaryColor }}>Anything</span>
            </h1>
            <p className="text-lg opacity-70 max-w-xl mx-auto leading-relaxed">
                Foolproof DIY interface builder. Customize styles from Clay to Glassmorphism in one click.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mt-6 w-full sm:w-auto">
                <button 
                    className={`px-8 py-4 font-bold text-lg flex justify-center items-center gap-2 ${classes.button}`}
                    style={{ 
                        backgroundColor: isNeumorphic ? 'transparent' : theme.primaryColor, 
                        color: isNeumorphic ? theme.primaryColor : '#fff',
                        borderRadius: theme.borderRadius 
                    }}
                >
                    Start Free <ArrowRight size={20} />
                </button>
                <button 
                    className={`px-8 py-4 font-bold text-lg border flex justify-center items-center gap-2 ${classes.button}`}
                    style={{ 
                        borderRadius: theme.borderRadius,
                        borderColor: isNeumorphic ? 'transparent' : (theme.darkMode ? '#333' : '#ddd'),
                        color: isNeumorphic ? theme.primaryColor : 'inherit'
                    }}
                >
                    <Activity size={20} /> Demo
                </button>
            </div>
            
            {/* Visual Flair for Glassmorphism */}
            {theme.stylePreset === 'glass' && (
                <>
                    <div className="absolute top-10 left-10 w-32 h-32 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                    <div className="absolute bottom-10 right-10 w-32 h-32 bg-yellow-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
                </>
            )}
        </section>
    );
};

export const FeaturesPreview: React.FC<PreviewProps> = ({ theme }) => {
    const classes = getPresetClasses(theme.stylePreset, theme.darkMode);
    const features = [
        { icon: <Zap />, title: "Fast", desc: "Instant load times." },
        { icon: <Shield />, title: "Secure", desc: "Bank-grade security." },
        { icon: <Activity />, title: "Growth", desc: "Scale with confidence." },
        { icon: <Star />, title: "Quality", desc: "Pixel perfect design." },
    ];
    
    const isNeumorphic = theme.stylePreset === 'neumorphic';

    return (
        <section className={`py-16 px-6 ${theme.stylePreset !== 'glass' && theme.stylePreset !== 'clay' ? classes.section : ''}`}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-6xl mx-auto">
                {features.map((f, i) => (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        key={i} 
                        className={`p-6 flex flex-col items-center text-center gap-3 ${classes.card}`}
                        style={{ borderRadius: theme.borderRadius }}
                    >
                        <div className={`w-14 h-14 flex items-center justify-center rounded-2xl mb-2 ${isNeumorphic ? classes.button : ''}`} 
                             style={{ 
                                 backgroundColor: isNeumorphic ? 'transparent' : `${theme.primaryColor}20`, 
                                 color: theme.primaryColor,
                                 borderRadius: theme.borderRadius
                             }}>
                            {f.icon}
                        </div>
                        <h3 className="text-lg font-bold">{f.title}</h3>
                        <p className="text-sm opacity-60 leading-relaxed">{f.desc}</p>
                    </motion.div>
                ))}
            </div>
        </section>
    );
};

export const PricingPreview: React.FC<PreviewProps> = ({ theme }) => {
    const classes = getPresetClasses(theme.stylePreset, theme.darkMode);
    const isNeumorphic = theme.stylePreset === 'neumorphic';
    
    return (
        <section className={`py-20 px-6 ${theme.stylePreset !== 'glass' && theme.stylePreset !== 'clay' ? classes.section : ''}`}>
            <div className="max-w-md mx-auto relative group">
                <div className={`p-8 flex flex-col gap-6 relative z-10 ${classes.card}`} 
                    style={{ 
                        borderRadius: theme.borderRadius,
                        borderTop: theme.stylePreset === 'material' ? `4px solid ${theme.primaryColor}` : undefined
                    }}>
                    
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-2xl font-bold">Pro Bundle</h3>
                            <p className="opacity-60 text-sm mt-1">Best for creators</p>
                        </div>
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${isNeumorphic ? classes.button : 'bg-black text-white'}`}
                           style={{ backgroundColor: isNeumorphic ? undefined : theme.primaryColor }}>
                            SAVE 20%
                        </span>
                    </div>

                    <div className="text-5xl font-extrabold tracking-tight">
                        $29<span className="text-xl font-medium opacity-50">/mo</span>
                    </div>

                    <div className="space-y-4 my-4">
                        {[1,2,3].map(i => (
                            <div key={i} className="flex items-center gap-3 text-sm opacity-80">
                                <div className={`p-1 rounded-full ${isNeumorphic ? classes.button : 'bg-green-100 dark:bg-green-900/30 text-green-600'}`}>
                                    <Check size={12} />
                                </div>
                                <span>All premium features included</span>
                            </div>
                        ))}
                    </div>

                    <button 
                        className={`w-full py-4 font-bold text-lg ${classes.button}`}
                        style={{ 
                            backgroundColor: isNeumorphic ? 'transparent' : theme.primaryColor,
                            color: isNeumorphic ? theme.primaryColor : '#fff',
                            borderRadius: theme.borderRadius 
                        }}
                    >
                        Get Started
                    </button>
                </div>
                
                {/* Background Decor for Glass */}
                {theme.stylePreset === 'glass' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 transform rotate-3 scale-105 opacity-20 blur-xl -z-10 rounded-3xl"></div>
                )}
            </div>
        </section>
    );
};

export const FooterPreview: React.FC<PreviewProps> = ({ theme }) => {
    const classes = getPresetClasses(theme.stylePreset, theme.darkMode);
    return (
        <footer className={`py-12 px-6 mt-auto ${theme.stylePreset !== 'glass' ? classes.card : ''} ${theme.stylePreset === 'glass' ? 'bg-black/10 backdrop-blur-md' : ''}`}>
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="font-bold text-xl flex items-center gap-2">
                    <Layout size={24} className="opacity-50" />
                    <span className="opacity-80">LazyDev</span>
                </div>
                <div className="flex gap-6 text-sm font-medium opacity-60">
                    <a href="#">Privacy</a>
                    <a href="#">Terms</a>
                    <a href="#">Cookies</a>
                </div>
                <div className="opacity-40 text-xs">
                    © 2024 Design Inc.
                </div>
            </div>
        </footer>
    );
};