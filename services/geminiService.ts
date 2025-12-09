import { GoogleGenAI } from "@google/genai";
import { ThemeConfig, ComponentItem } from "../types";

const getGeminiClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateSiteCode = async (
    theme: ThemeConfig,
    components: ComponentItem[],
    promptText: string
): Promise<string> => {
    const ai = getGeminiClient();
    
    const componentList = components.map(c => c.type).join(", ");
    
    const sysInstruction = `
    You are an expert React and Tailwind CSS developer specialized in modern UI trends. 
    Your task is to generate a single-file React component (or a set of components in one block) based on the user's configuration.
    
    Configuration:
    - Primary Color (Hex): ${theme.primaryColor}
    - Style Preset: ${theme.stylePreset}
    - Dark Mode: ${theme.darkMode}
    - Components to include: ${componentList}
    
    Style Guides:
    - 'macaron': Use glossy/jelly aesthetic. High border-radius (rounded-2xl/3xl), white borders with transparency (border-white/50), backdrop-blur, and strong inset highlights to create a moist/shiny look. Use pastel radial gradients for backgrounds (bg-gradient-to-tr from-pink-100 to-blue-100).
    - 'clay': Use soft pastel background colors, large border-radius (rounded-2xl/3xl), and two inner shadows (light top-left, dark bottom-right) to create a puffy 3D clay effect.
    - 'neumorphic': Use a specific off-white or dark gray background. Elements should have no borders but use two shadows: a light one (top-left) and a dark one (bottom-right) to appear extruded.
    - 'glass': Use backdrop-filter: blur, bg-opacity, and white/translucent borders. Ensure the background has a gradient or pattern so the glass effect is visible.
    - 'material': Follow Google Material Design 3. Use shadow-md/lg for elevation, ripple effects on buttons, and surface containers.
    - 'brutal': Use hard black borders (border-2/4), hard offsets (shadow-[4px_4px_0px_black]), and bold typography.
    
    User Request: ${promptText}
    
    Rules:
    - Return ONLY the raw TSX code. 
    - Do not wrap in markdown code blocks like \`\`\`tsx ... \`\`\`. 
    - Ensure all imports (React, lucide-react, framer-motion) are present.
    - Use Tailwind classes for all styling.
    - Ensure the code is production ready and Responsive (Mobile First).
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate the React code for this landing page configuration.`,
            config: {
                systemInstruction: sysInstruction,
            }
        });

        return response.text || "// Error generating code.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "// Error calling Gemini API. Please check your API Key.";
    }
};

export const autoConfigureTheme = async (description: string): Promise<Partial<ThemeConfig> & { components?: string[] }> => {
    const ai = getGeminiClient();
    
    const sysInstruction = `
    You are a UI/UX expert. The user will provide a description OR paste a snippet of CSS/HTML code (e.g. from CodePen or uiverse.io).
    Your task is to analyze the input and extract the best matching theme configuration.
    
    Return a JSON object ONLY. 
    
    Possible Presets: "modern", "glass", "brutal", "ios", "clay", "material", "neumorphic", "macaron"
    
    Logic:
    1. **Color Extraction**: Identify the dominant/primary color. If CSS variables (e.g., --primary, --main-color) are present, use those values.
    2. **Radius Extraction**: Look for 'border-radius'. 
       - 0px -> '0px'
       - 1-6px -> '4px'
       - 8-12px -> '8px'
       - 16-24px -> '16px'
       - >24px -> '24px' (or '99px' if it looks like a pill).
    3. **Style Preset Detection**:
       - 'jelly', 'glossy', 'macaron', 'cute', 'moist' -> 'macaron'
       - 'backdrop-filter', 'blur', 'glass' -> 'glass'
       - Multiple 'box-shadow' (light & dark), 'neumorphism' -> 'neumorphic'
       - 'inset' shadows, 'clay' -> 'clay'
       - 'border: 2px solid black', 'box-shadow: 4px 4px 0px' -> 'brutal'
       - 'apple', 'ios', 'system-ui' -> 'ios'
       - 'material', 'elevation', 'md-' -> 'material'
       - Default -> 'modern'
    4. **Dark Mode**: Check for 'background-color: #000', 'bg-slate-900', or dark hex codes.
    
    Schema:
    {
        "primaryColor": "hex string",
        "stylePreset": "preset_name",
        "borderRadius": "0px" | "4px" | "8px" | "16px" | "24px" | "99px",
        "darkMode": boolean,
        "recommendedComponents": ["header", "hero", "features", "pricing", "footer"]
    }
    
    Examples:
    - Input: ".btn { background: #ff0055; border-radius: 30px; box-shadow: 5px 5px 0px black; border: 2px solid black; }"
      -> {"primaryColor": "#ff0055", "borderRadius": "99px", "stylePreset": "brutal", "darkMode": false}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: description,
            config: {
                systemInstruction: sysInstruction,
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text || "{}";
        const json = JSON.parse(text);
        return {
            primaryColor: json.primaryColor,
            stylePreset: json.stylePreset,
            borderRadius: json.borderRadius,
            darkMode: json.darkMode,
            components: json.recommendedComponents
        };
    } catch (error) {
        console.error("Auto-config error:", error);
        return {};
    }
};