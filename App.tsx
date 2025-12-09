import React, { useState, useEffect } from 'react';
import { ThemeConfig, ComponentItem, ThemeStyle } from './types';
import { generateSiteCode, autoConfigureTheme } from './services/geminiService';
import { HeaderPreview, HeroPreview, FeaturesPreview, FooterPreview, PricingPreview } from './components/PreviewComponents';
import { 
    Palette, 
    Smartphone, 
    Monitor, 
    Code, 
    Plus, 
    Trash2, 
    Wand2, 
    Loader2, 
    Moon, 
    Sun, 
    Undo, 
    Redo,
    Download,
    Eye,
    Settings,
    Layout,
    Box,
    Layers,
    Droplet
} from 'lucide-react';

// --- Constants & Helpers ---

const DEFAULT_THEME: ThemeConfig = {
    primaryColor: '#3b82f6',
    borderRadius: '16px', // Softer default for mobile feel
    stylePreset: 'modern',
    darkMode: false,
    fontFamily: 'Inter',
};

const COMPONENT_TYPES = [
    { id: 'header', label: 'Header', icon: <Layout size={16} /> },
    { id: 'hero', label: 'Hero Section', icon: <Monitor size={16} /> },
    { id: 'features', label: 'Features Grid', icon: <Settings size={16} /> },
    { id: 'pricing', label: 'Pricing Table', icon: <Code size={16} /> },
    { id: 'footer', label: 'Footer', icon: <Layout size={16} /> },
];

const STYLE_PRESETS: { id: ThemeStyle; label: string; icon: React.ReactNode }[] = [
    { id: 'modern', label: 'Modern', icon: <Layout size={14} /> },
    { id: 'material', label: 'Google', icon: <Layers size={14} /> },
    { id: 'ios', label: 'iOS', icon: <Smartphone size={14} /> },
    { id: 'clay', label: 'Clay', icon: <Box size={14} /> },
    { id: 'neumorphic', label: 'Soft UI', icon: <Box size={14} /> },
    { id: 'glass', label: 'Glass', icon: <Droplet size={14} /> },
    { id: 'brutal', label: 'Brutal', icon: <Settings size={14} /> },
];

// --- Main Component ---

export default function App() {
    // State
    const [theme, setTheme] = useState<ThemeConfig>(DEFAULT_THEME);
    const [layout, setLayout] = useState<ComponentItem[]>([
        { id: '1', type: 'header' },
        { id: '2', type: 'hero' },
        { id: '3', type: 'features' },
    ]);
    
    // History State
    const [history, setHistory] = useState<{
        past: { theme: ThemeConfig; layout: ComponentItem[] }[];
        future: { theme: ThemeConfig; layout: ComponentItem[] }[];
    }>({ past: [], future: [] });

    const [activeTab, setActiveTab] = useState<'editor' | 'code'>('editor');
    // Defaulting to mobile for "Mobile First" approach
    const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('mobile');
    const [generatedCode, setGeneratedCode] = useState<string>('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [promptInput, setPromptInput] = useState('');
    const [isAutoConfiguring, setIsAutoConfiguring] = useState(false);

    // Apply global theme classes
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme.darkMode) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme.darkMode]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Check for Cmd/Ctrl
            if (e.metaKey || e.ctrlKey) {
                if (e.key === 'z') {
                    e.preventDefault();
                    if (e.shiftKey) {
                        redo();
                    } else {
                        undo();
                    }
                }
                // Windows Redo standard
                if (e.key === 'y') {
                    e.preventDefault();
                    redo();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, theme, layout]);

    // --- History Management ---

    const saveToHistory = () => {
        setHistory(prev => {
            const newPast = [...prev.past, { 
                theme: JSON.parse(JSON.stringify(theme)), 
                layout: JSON.parse(JSON.stringify(layout)) 
            }];
            if (newPast.length > 30) newPast.shift();
            return { past: newPast, future: [] };
        });
    };

    const undo = () => {
        if (history.past.length === 0) return;
        const previous = history.past[history.past.length - 1];
        const newPast = history.past.slice(0, -1);
        const current = { theme: JSON.parse(JSON.stringify(theme)), layout: JSON.parse(JSON.stringify(layout)) };
        setHistory({ past: newPast, future: [current, ...history.future] });
        setTheme(previous.theme);
        setLayout(previous.layout);
    };

    const redo = () => {
        if (history.future.length === 0) return;
        const next = history.future[0];
        const newFuture = history.future.slice(1);
        const current = { theme: JSON.parse(JSON.stringify(theme)), layout: JSON.parse(JSON.stringify(layout)) };
        setHistory({ past: [...history.past, current], future: newFuture });
        setTheme(next.theme);
        setLayout(next.layout);
    };

    // --- Smart Updaters ---

    const updateTheme = (updates: Partial<ThemeConfig>) => {
        saveToHistory();
        setTheme(prev => ({ ...prev, ...updates }));
    };

    const addComponent = (type: ComponentItem['type']) => {
        saveToHistory();
        setLayout([...layout, { id: Math.random().toString(36).substr(2, 9), type }]);
    };

    const removeComponent = (id: string) => {
        saveToHistory();
        setLayout(layout.filter(item => item.id !== id));
    };

    // --- Actions ---

    const handleAutoConfig = async () => {
        if (!promptInput.trim()) return;
        setIsAutoConfiguring(true);
        const config = await autoConfigureTheme(promptInput);
        
        if (config.primaryColor || (config.components && config.components.length > 0)) {
            saveToHistory();
            if (config.primaryColor) {
                setTheme(prev => ({
                    ...prev,
                    primaryColor: config.primaryColor!,
                    stylePreset: config.stylePreset || 'modern',
                    borderRadius: config.borderRadius || '16px',
                    darkMode: config.darkMode ?? false
                }));
            }
            if (config.components && config.components.length > 0) {
                const newLayout = config.components.map((c: any) => ({
                    id: Math.random().toString(36).substr(2, 9),
                    type: c
                }));
                setLayout(newLayout as ComponentItem[]);
            }
        }
        setIsAutoConfiguring(false);
    };

    const handleGenerateCode = async () => {
        setIsGenerating(true);
        setActiveTab('code');
        const code = await generateSiteCode(theme, layout, promptInput || "Create a standard landing page.");
        setGeneratedCode(code);
        setIsGenerating(false);
    };

    // --- Helper to get Preview Container Background ---
    const getPreviewBackgroundClass = () => {
        const isDark = theme.darkMode;
        switch (theme.stylePreset) {
            case 'clay': return isDark ? 'bg-[#2a2a2a]' : 'bg-[#f0f4f8]';
            case 'neumorphic': return isDark ? 'bg-[#2b2b2b]' : 'bg-[#e0e5ec]';
            case 'glass': return isDark ? 'bg-gradient-to-br from-gray-900 via-indigo-900 to-black' : 'bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100';
            case 'brutal': return isDark ? 'bg-zinc-950' : 'bg-yellow-50';
            case 'ios': return isDark ? 'bg-black' : 'bg-[#F2F2F7]';
            case 'material': return isDark ? 'bg-[#121212]' : 'bg-gray-100';
            default: return isDark ? 'bg-gray-950' : 'bg-white';
        }
    };

    // Render Component based on type
    const renderComponent = (item: ComponentItem) => {
        switch (item.type) {
            case 'header': return <HeaderPreview key={item.id} theme={theme} />;
            case 'hero': return <HeroPreview key={item.id} theme={theme} />;
            case 'features': return <FeaturesPreview key={item.id} theme={theme} />;
            case 'pricing': return <PricingPreview key={item.id} theme={theme} />;
            case 'footer': return <FooterPreview key={item.id} theme={theme} />;
            default: return null;
        }
    };

    return (
        <div className={`flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-300`}>
            
            {/* Sidebar Controls */}
            <aside className="w-80 h-full border-r border-border bg-card flex flex-col z-20 shadow-xl">
                <div className="p-4 border-b border-border flex items-center justify-between">
                    <h1 className="font-bold text-lg flex items-center gap-2">
                        <Wand2 className="text-primary" /> LazyDev UI
                    </h1>
                    <div className="flex items-center gap-1">
                        <button onClick={undo} disabled={history.past.length === 0} className="p-2 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-opacity"><Undo size={18} /></button>
                        <button onClick={redo} disabled={history.future.length === 0} className="p-2 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-opacity"><Redo size={18} /></button>
                        <div className="w-px h-4 bg-border mx-1"></div>
                        <button onClick={() => updateTheme({ darkMode: !theme.darkMode })} className="p-2 rounded hover:bg-muted text-muted-foreground">{theme.darkMode ? <Moon size={18} /> : <Sun size={18} />}</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    
                    {/* Magic Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">AI Auto-Designer</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                placeholder="e.g., 'Cute pet shop clay style'"
                                className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                                value={promptInput}
                                onChange={(e) => setPromptInput(e.target.value)}
                            />
                            <button onClick={handleAutoConfig} disabled={isAutoConfiguring} className="bg-primary text-primary-foreground p-2 rounded-md hover:opacity-90 disabled:opacity-50">
                                {isAutoConfiguring ? <Loader2 className="animate-spin" size={18} /> : <Wand2 size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Theme Controls */}
                    <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Palette size={14} /> Style & Theme
                        </label>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <div>
                                <label className="text-xs block mb-1.5 opacity-80">Primary Color</label>
                                <div className="flex items-center gap-2">
                                    <input type="color" value={theme.primaryColor} onChange={(e) => updateTheme({ primaryColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
                                    <span className="text-xs font-mono opacity-60">{theme.primaryColor}</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs block mb-1.5 opacity-80">Border Radius</label>
                                <select value={theme.borderRadius} onChange={(e) => updateTheme({ borderRadius: e.target.value })} className="w-full text-sm bg-background border border-input rounded p-1">
                                    <option value="0px">None (0px)</option>
                                    <option value="4px">Small (4px)</option>
                                    <option value="8px">Medium (8px)</option>
                                    <option value="16px">Large (16px)</option>
                                    <option value="24px">Extra Large</option>
                                    <option value="99px">Round (Pill)</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs block mb-1.5 opacity-80">Style Preset</label>
                            <div className="grid grid-cols-2 gap-2">
                                {STYLE_PRESETS.map((style) => (
                                    <button
                                        key={style.id}
                                        onClick={() => updateTheme({ stylePreset: style.id })}
                                        className={`px-3 py-2 text-xs rounded border transition-all flex items-center gap-2 ${
                                            theme.stylePreset === style.id 
                                            ? 'border-primary bg-primary/10 text-primary font-bold' 
                                            : 'border-input hover:bg-muted opacity-80 hover:opacity-100'
                                        }`}
                                    >
                                        {style.icon} {style.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Layout Controls */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                            <Layout size={14} /> Components
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {COMPONENT_TYPES.map(comp => (
                                <button
                                    key={comp.id}
                                    onClick={() => addComponent(comp.id as any)}
                                    className="flex items-center gap-3 px-3 py-2 text-sm rounded hover:bg-muted border border-transparent hover:border-input text-left group"
                                >
                                    <span className="opacity-50 group-hover:opacity-100">{comp.icon}</span>
                                    {comp.label}
                                    <Plus size={14} className="ml-auto opacity-0 group-hover:opacity-100" />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active Layer List */}
                    <div className="space-y-2">
                         <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Layers</label>
                         {layout.length === 0 && <p className="text-xs opacity-50 italic">Canvas is empty</p>}
                         <ul className="space-y-1">
                             {layout.map((item, idx) => (
                                 <li key={item.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded group">
                                     <span className="truncate w-32 capitalize">{idx + 1}. {item.type}</span>
                                     <button onClick={() => removeComponent(item.id)} className="text-destructive opacity-50 hover:opacity-100"><Trash2 size={14} /></button>
                                 </li>
                             ))}
                         </ul>
                    </div>
                </div>
                
                <div className="p-4 border-t border-border">
                    <button 
                        onClick={handleGenerateCode}
                        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
                    >
                        {isGenerating ? <Loader2 className="animate-spin" /> : <Code size={18} />}
                        Generate Code
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full bg-muted/30 relative">
                
                {/* Top Bar */}
                <header className="h-14 border-b border-border bg-background flex items-center justify-between px-6 z-10">
                    <div className="flex items-center gap-1 bg-muted p-1 rounded-md">
                        <button 
                            onClick={() => setActiveTab('editor')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-sm flex items-center gap-2 ${activeTab === 'editor' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Eye size={14} /> Preview
                        </button>
                        <button 
                            onClick={() => setActiveTab('code')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-sm flex items-center gap-2 ${activeTab === 'code' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                        >
                            <Code size={14} /> Code
                        </button>
                    </div>

                    {activeTab === 'editor' && (
                        <div className="flex items-center gap-2">
                             <button onClick={() => setPreviewMode('mobile')} className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}><Smartphone size={18} /></button>
                             <button onClick={() => setPreviewMode('desktop')} className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'}`}><Monitor size={18} /></button>
                        </div>
                    )}
                </header>

                {/* Canvas / Code View */}
                <div className="flex-1 overflow-hidden relative flex items-center justify-center p-4">
                    
                    {activeTab === 'editor' ? (
                        <div 
                            className={`transition-all duration-500 ease-in-out shadow-2xl overflow-y-auto border-border ${
                                previewMode === 'mobile' 
                                ? 'w-[375px] h-[812px] rounded-[40px] border-[8px] border-gray-800' 
                                : 'w-full h-full rounded-lg border'
                            }`}
                        >
                            {/* Inner Preview Content */}
                            <div className={`w-full h-full ${previewMode === 'mobile' ? 'rounded-[32px] overflow-hidden' : ''}`}>
                                <div className={`min-h-full transition-colors duration-500 ${getPreviewBackgroundClass()} ${theme.darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {layout.map((item) => renderComponent(item))}
                                    {layout.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                                            <Layout size={48} className="mb-4" />
                                            <p>Add components from the sidebar</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="w-full h-full bg-[#1e1e1e] text-gray-300 rounded-lg overflow-hidden flex flex-col">
                            <div className="flex items-center justify-between p-3 border-b border-white/10 bg-[#252526]">
                                <span className="text-xs font-mono opacity-70">App.tsx</span>
                                <button className="text-xs hover:text-white flex items-center gap-1">
                                    <Download size={12} /> Copy
                                </button>
                            </div>
                            <div className="flex-1 overflow-auto p-4 font-mono text-sm leading-relaxed">
                                {generatedCode ? (
                                    <pre className="whitespace-pre-wrap">{generatedCode}</pre>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center opacity-50">
                                        <Code size={48} className="mb-4" />
                                        <p>Click "Generate Code" to build the source.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}