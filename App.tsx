import React, { useState, useEffect, useRef } from 'react';
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
    Droplet,
    Upload,
    FileJson,
    ClipboardPaste,
    Sparkles,
    Cookie
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
    { id: 'macaron', label: 'Macaron', icon: <Cookie size={14} /> },
    { id: 'neumorphic', label: 'Soft UI', icon: <Box size={14} /> },
    { id: 'glass', label: 'Glass', icon: <Droplet size={14} /> },
    { id: 'brutal', label: 'Brutal', icon: <Settings size={14} /> },
];

// --- Color Utilities ---

function hexToHSL(hex: string): { h: number, s: number, l: number } {
    let r = 0, g = 0, b = 0;
    // Handle short #fff
    if (hex.length === 4) {
        r = parseInt("0x" + hex[1] + hex[1]);
        g = parseInt("0x" + hex[2] + hex[2]);
        b = parseInt("0x" + hex[3] + hex[3]);
    } else {
        r = parseInt("0x" + hex[1] + hex[2]);
        g = parseInt("0x" + hex[3] + hex[4]);
        b = parseInt("0x" + hex[5] + hex[6]);
    }
    r /= 255; g /= 255; b /= 255;
    let cmin = Math.min(r,g,b), cmax = Math.max(r,g,b), delta = cmax - cmin;
    let h = 0, s = 0, l = 0;

    if (delta === 0) h = 0;
    else if (cmax === r) h = ((g - b) / delta) % 6;
    else if (cmax === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;

    h = Math.round(h * 60);
    if (h < 0) h += 360;

    l = (cmax + cmin) / 2;
    s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);

    return { h, s, l };
}

// Generate a color shifted by degrees on the hue wheel
const getShiftedColor = (hex: string, degree: number, lighten: number = 0) => {
    try {
        const { h, s, l } = hexToHSL(hex);
        const newH = (h + degree) % 360;
        // Ensure it stays pastel/light for backgrounds
        const newL = Math.min(Math.max(l + lighten, 85), 98); 
        return `hsl(${newH}, ${s}%, ${newL}%)`;
    } catch (e) {
        return hex;
    }
}

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
    
    const fileInputRef = useRef<HTMLInputElement>(null);

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

    // --- Import / Export ---

    const handleExport = () => {
        const data = JSON.stringify({ theme, layout }, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `lazydev-theme-${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);
                if (data.theme && data.layout) {
                    saveToHistory(); // Save state before importing
                    setTheme(data.theme);
                    setLayout(data.layout);
                } else {
                    alert('Invalid configuration file. Missing theme or layout data.');
                }
            } catch (err) {
                console.error('Failed to parse file', err);
                alert('Failed to parse file');
            }
        };
        reader.readAsText(file);
        // Reset input to allow selecting same file again
        event.target.value = '';
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

    const handlePasteExample = () => {
        setPromptInput(".btn { background: #6366f1; border-radius: 20px; box-shadow: 5px 5px 10px #bebebe, -5px -5px 10px #ffffff; }");
    };

    // --- Helper to get Preview Container Background ---
    const getPreviewBackgroundClass = () => {
        const isDark = theme.darkMode;
        switch (theme.stylePreset) {
            case 'clay': return isDark ? 'bg-[#2a2a2a]' : 'bg-[#f0f4f8]';
            // For Macaron, we will use inline style for complex gradients, but return base color here
            case 'macaron': return isDark ? 'bg-[#1a1a1a]' : 'bg-[#fffcf8]';
            case 'neumorphic': return isDark ? 'bg-[#2b2b2b]' : 'bg-[#e0e5ec]';
            case 'glass': return isDark ? 'bg-gradient-to-br from-gray-900 via-indigo-900 to-black' : 'bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100';
            case 'brutal': return isDark ? 'bg-zinc-950' : 'bg-yellow-50';
            case 'ios': return isDark ? 'bg-black' : 'bg-[#F2F2F7]';
            case 'material': return isDark ? 'bg-[#121212]' : 'bg-gray-100';
            default: return isDark ? 'bg-gray-950' : 'bg-white';
        }
    };

    // Generates a professional designer-style diffusion background based on primary color
    const getMacaronBackgroundStyle = () => {
        if (theme.darkMode) return {};
        
        const primary = theme.primaryColor;
        // Generate Analogous palette (neighbors on color wheel) for smooth diffusion
        const color1 = getShiftedColor(primary, -30, 10); // Left neighbor
        const color2 = getShiftedColor(primary, 30, 10);  // Right neighbor
        const color3 = getShiftedColor(primary, 0, 40);   // Very light version of primary
        
        return {
            backgroundImage: `
                radial-gradient(at 10% 10%, ${color1} 0px, transparent 50%),
                radial-gradient(at 90% 0%, ${color2} 0px, transparent 50%),
                radial-gradient(at 20% 80%, ${color2} 0px, transparent 50%),
                radial-gradient(at 80% 80%, ${color1} 0px, transparent 50%),
                radial-gradient(at 50% 50%, ${color3} 0px, transparent 70%),
                linear-gradient(to bottom right, #fff, #fdfbff)
            `,
            backgroundAttachment: 'fixed',
            backgroundSize: '100% 100%'
        };
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
                        {/* Import/Export */}
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileImport} 
                            className="hidden" 
                            accept=".json" 
                        />
                        <button onClick={handleImportClick} className="p-2 rounded hover:bg-muted text-muted-foreground transition-opacity" title="Import Config">
                            <Upload size={18} />
                        </button>
                        <button onClick={handleExport} className="p-2 rounded hover:bg-muted text-muted-foreground transition-opacity" title="Export Config">
                            <Download size={18} />
                        </button>
                        
                        <div className="w-px h-4 bg-border mx-1"></div>
                        
                        {/* History */}
                        <button onClick={undo} disabled={history.past.length === 0} className="p-2 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-opacity" title="Undo"><Undo size={18} /></button>
                        <button onClick={redo} disabled={history.future.length === 0} className="p-2 rounded hover:bg-muted text-muted-foreground disabled:opacity-30 transition-opacity" title="Redo"><Redo size={18} /></button>
                        
                        <div className="w-px h-4 bg-border mx-1"></div>
                        
                        {/* Dark Mode */}
                        <button onClick={() => updateTheme({ darkMode: !theme.darkMode })} className="p-2 rounded hover:bg-muted text-muted-foreground" title="Toggle Dark Mode">{theme.darkMode ? <Moon size={18} /> : <Sun size={18} />}</button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    
                    {/* Magic Input */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                <Sparkles size={12} /> AI Designer
                            </label>
                            <button onClick={handlePasteExample} className="text-[10px] text-primary hover:underline flex items-center gap-1">
                                Try Code Paste
                            </button>
                        </div>
                        <div className="relative">
                            <textarea 
                                placeholder="Describe a style (e.g. 'Cyberpunk') OR paste CSS code from uiverse.io to match."
                                className="w-full h-24 px-3 py-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                value={promptInput}
                                onChange={(e) => setPromptInput(e.target.value)}
                            />
                            <div className="absolute bottom-2 right-2 flex gap-1">
                                <button 
                                    onClick={handleAutoConfig}
                                    disabled={isAutoConfiguring || !promptInput.trim()}
                                    className="bg-primary text-primary-foreground p-2 rounded-md hover:opacity-90 disabled:opacity-50 shadow-sm"
                                    title="Generate Theme"
                                >
                                    {isAutoConfiguring ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                                </button>
                            </div>
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
                                <div 
                                    className={`min-h-full transition-colors duration-500 ${getPreviewBackgroundClass()} ${theme.darkMode ? 'text-white' : 'text-gray-900'}`}
                                    style={theme.stylePreset === 'macaron' ? getMacaronBackgroundStyle() : {}}
                                >
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