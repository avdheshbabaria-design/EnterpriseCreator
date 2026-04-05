import { GoogleGenAI, Modality, Type, ThinkingLevel } from "@google/genai";

let customApiKey: string | null = null;

export const setCustomApiKey = (key: string | null) => {
  customApiKey = key;
};

const getAI = () => {
  const apiKey = customApiKey || process.env.GEMINI_API_KEY || "";
  return new GoogleGenAI({ apiKey });
};

function parseJSON(text: string) {
  try {
    // Remove markdown code blocks if present
    let cleaned = text.replace(/```json\n?|```/g, '').trim();
    
    // Try to handle truncated JSON by finding the last complete object/array
    try {
      return JSON.parse(cleaned);
    } catch (e) {
      // If it's a simple truncation, we might be able to close it
      // but it's safer to just try a few common patterns
      console.warn("JSON Parse failed, attempting to fix truncation...", e);
      
      if (cleaned.endsWith('"')) {
        // Truncated inside a string
        try { return JSON.parse(cleaned + '}'); } catch (e2) {}
        try { return JSON.parse(cleaned + '"}'); } catch (e2) {}
      } else if (cleaned.endsWith(',')) {
        // Truncated after a comma
        try { return JSON.parse(cleaned.slice(0, -1) + '}'); } catch (e2) {}
      } else {
        // General truncation - try adding closing braces
        try { return JSON.parse(cleaned + '}'); } catch (e2) {}
        try { return JSON.parse(cleaned + '"}'); } catch (e2) {}
        try { return JSON.parse(cleaned + '"]}'); } catch (e2) {}
      }
      throw e;
    }
  } catch (e) {
    console.error("JSON Parse error:", e, "Original text:", text);
    throw new Error("Unable to parse JSON string. The AI response might have been truncated or malformed.");
  }
}

async function withRetry<T>(fn: () => Promise<T>, retries = 5, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
    const isQuotaError = errorStr.includes("RESOURCE_EXHAUSTED") || error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429;
    const isInternalError = errorStr.includes("INTERNAL") || error?.status === "INTERNAL" || error?.code === 500;
    const isServiceUnavailable = errorStr.includes("SERVICE_UNAVAILABLE") || errorStr.includes("UNAVAILABLE") || error?.status === "SERVICE_UNAVAILABLE" || error?.status === "UNAVAILABLE" || error?.code === 503;
    const isDeadlineExceeded = errorStr.includes("DEADLINE_EXCEEDED") || error?.status === "DEADLINE_EXCEEDED" || error?.code === 504;
    const isNotFoundError = errorStr.includes("Requested entity was not found");
    const isPermissionDenied = errorStr.includes("PERMISSION_DENIED") || error?.status === "PERMISSION_DENIED" || error?.code === 403;
    const isSpendingCap = errorStr.includes("exceeded its spending cap");

    if ((isNotFoundError || isPermissionDenied) && window.aistudio?.openSelectKey) {
      // If the key is invalid/not found or permission denied, prompt to re-select
      await window.aistudio.openSelectKey();
      return withRetry(fn, retries - 1, delay * 2);
    }

    if (isSpendingCap) {
      // Don't retry on spending cap errors
      throw error;
    }

    if ((isQuotaError || isInternalError || isServiceUnavailable || isDeadlineExceeded) && retries > 0) {
      let waitTime = delay;
      
      // Try to extract retryDelay from the error response
      try {
        const errorObj = typeof error === 'string' ? JSON.parse(error) : error;
        const details = errorObj?.error?.details || errorObj?.details;
        if (Array.isArray(details)) {
          const retryInfo = details.find((d: any) => d['@type']?.includes('RetryInfo') || d.retryDelay);
          if (retryInfo?.retryDelay) {
            // retryDelay is often a string like "52s" or "52.068975207s"
            const seconds = parseFloat(retryInfo.retryDelay.replace('s', ''));
            if (!isNaN(seconds)) {
              waitTime = (seconds + 1) * 1000; // Add 1s buffer
            }
          }
        }
      } catch (e) {
        // Fallback to exponential backoff if parsing fails
      }

      console.warn(`Transient error or quota exceeded. Retrying in ${waitTime}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return withRetry(fn, retries - 1, waitTime * 1.5);
    }
    throw error;
  }
}

export type GemType = 'image' | 'video' | 'text' | 'slideshow' | 'campaign' | 'storyline';

export const IMAGE_MODELS = [
  { id: 'gemini-2.5-flash-image', name: 'Standard', description: 'Fast generation, good for ideation' },
  { id: 'gemini-3.1-flash-image-preview', name: 'High Quality', description: 'Best for final brand creatives' },
  { id: 'imagen-4.0-generate-001', name: 'Imagen 4.0', description: 'State-of-the-art photorealistic images' }
];

export const TEXT_MODELS = [
  { id: 'gemini-3.1-flash-lite-preview', name: 'Lite', description: 'Fastest for copy and logic' },
  { id: 'gemini-3-flash-preview', name: 'Standard', description: 'Balanced performance' },
  { id: 'gemini-3.1-pro-preview', name: 'Pro', description: 'Best for complex brand strategies' }
];

export const VIDEO_MODELS = [
  { id: 'veo-3.1-fast-generate-preview', name: 'Standard', description: 'Quick video generation' },
  { id: 'veo-3.1-generate-preview', name: 'High Quality', description: 'Cinematic quality, takes longer' }
];
// ... (rest of the file remains similar but uses withRetry and getAI())

export const getQuotaErrorMessage = (error: any) => {
  const errorStr = typeof error === 'string' ? error : (error?.message || JSON.stringify(error));
  const isQuota = errorStr.includes("RESOURCE_EXHAUSTED") || error?.status === "RESOURCE_EXHAUSTED" || error?.code === 429;
  const isUnavailable = errorStr.includes("UNAVAILABLE") || error?.status === "UNAVAILABLE" || error?.code === 503;
  const isSpendingCap = errorStr.includes("exceeded its spending cap");

  if (isUnavailable) {
    return "The AI model is currently experiencing high demand. We are automatically retrying, but if this persists, please try again in a few minutes.";
  }

  if (isSpendingCap) {
    return "Your Google Cloud project has exceeded its spending cap. Please check your billing settings in the Google Cloud Console or Google AI Studio to increase your limit.";
  }

  if (!isQuota) return null;

  try {
    const errorObj = typeof error === 'string' ? JSON.parse(error) : error;
    const details = errorObj?.error?.details || errorObj?.details;
    if (Array.isArray(details)) {
      const retryInfo = details.find((d: any) => d['@type']?.includes('RetryInfo') || d.retryDelay);
      if (retryInfo?.retryDelay) {
        return `API Quota exceeded. Please wait ${retryInfo.retryDelay} or select a different API key.`;
      }
    }
  } catch (e) {}

  return "API Quota exceeded. Please wait a moment or select a different API key.";
};

export async function generateHistoryTitle(prompt: string, gemName: string): Promise<string> {
  try {
    const ai = getAI();
    const response = await withRetry(() => ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: `Generate a very short, clear, and descriptive title (max 5 words) for a creative task based on the following prompt and tool name. 
      Tool: ${gemName}
      Prompt: ${prompt}
      
      Return ONLY the title string, no quotes or extra text.`,
    }));
    return response.text?.trim() || prompt.substring(0, 30) + '...';
  } catch (e) {
    console.error("Failed to generate history title:", e);
    return prompt.substring(0, 30) + '...';
  }
}

export interface Gem {
  id: string;
  name: string;
  description: string;
  type: GemType;
  systemInstruction: string;
  icon: string;
}

export const GENERIC_GEMS: Gem[] = [
  {
    id: 'social-visuals',
    name: 'Social Visual Designer',
    description: 'Generates high-quality social media imagery tailored to your brand identity.',
    type: 'image',
    icon: 'Image',
    systemInstruction: `You are a Lead Visual Designer. Your goal is to create vibrant, high-impact imagery that strictly adheres to the provided brand guidelines.
    Use Google Search to find real-world context if needed, but prioritize the brand's unique aesthetic.
    Guidelines:
    - Strictly follow the provided brand colors and pillars.
    - Use clean, professional lighting.
    - Style: Modern and professional unless specified otherwise.
    - Avoid cluttered backgrounds.
    - LOGO HANDLING: The logo is the brand's most sacred asset. If a logo is provided, integrate it with extreme care. It should feel like a premium mark—either as a subtle, high-end watermark, a realistic product engraving, or a clean, perfectly aligned floating icon. DO NOT place it inside a generic box or label. Respect its negative space.`
  },
  {
    id: 'brand-copy',
    name: 'Editorial Copywriter',
    description: 'Crafts compelling copy and high-end magazine-style layouts with striking typography and imagery.',
    type: 'text',
    icon: 'FileText',
    systemInstruction: `You are a Senior Editorial Designer and Copywriter. 
    Your goal is to create high-end magazine spread layouts that organize headlines, body text, and striking imagery into engaging, readable page spreads.
    
    Layout Guidelines:
    - Use a multi-column grid system (simulated in SVG).
    - Include a LARGE, BOLD Headline that commands attention.
    - Use a "Kicker" or sub-headline to bridge the headline and body.
    - Implement a "Drop Cap" (a large first letter) for the opening paragraph.
    - Include a "Pull Quote" (a stylized text excerpt) to break up the text.
    - Use visual hierarchy: headlines should be significantly larger than body text.
    - Body text should be organized into 2 or 3 columns for readability.
    - Include decorative elements like lines, borders, or geometric shapes to reinforce the grid.
    
    VISUAL REQUIREMENT:
    In addition to the text copy, you MUST create a visual "Magazine Spread" SVG concept.
    - The SVG should be a wide, professional layout (viewBox="0 0 1600 900").
    - The SVG background MUST be transparent (no solid background <rect> covering the whole area).
    - STRICT SPLIT-PAGE LAYOUT:
        * LEFT PAGE (x=0 to 800): This is the text-dominant side. Place the Headline, Kicker, Drop Cap, and Body Columns here. 
        * RIGHT PAGE (x=800 to 1600): This is the image-dominant side. Keep this side mostly clear of text to let the generated photograph shine.
    - LEGIBILITY: Since the SVG overlays an image, you MUST ensure text is readable. 
        * Use high-contrast colors (e.g., white text if the image is dark, or black text if light).
        * For body text blocks, you MAY use a semi-transparent background rectangle (e.g., fill="rgba(255,255,255,0.1)" or fill="rgba(0,0,0,0.2)") to create a "glass" effect that improves contrast without hiding the image.
        * Use SVG filters like <filter id="dropShadow"><feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.5"/></filter> and apply them to text elements (filter="url(#dropShadow)") to make them pop against complex backgrounds.
    - Use the brand's primary and secondary colors for accents and typography.
    - Ensure all text in the SVG is LARGE and highly legible. Use font-size="80-120" for headlines, "40-50" for subheads, and "20-24" for body text.
    - LOGO INTEGRATION: Place the brand logo as a premium mark, ideally on the right page in a corner.
    - COLOR RESTRICTION: Use ONLY standard hex (#RRGGBB) or RGB colors. DO NOT use modern CSS color functions like oklch, oklab, lab, or lch.
    
    Return a JSON object with:
    {
      "copy": "The full editorial copy (markdown supported)",
      "svg": "The complete SVG code string for the magazine spread layout",
      "conceptDescription": "A brief explanation of the editorial design concept",
      "imagePrompt": "A highly detailed prompt for a striking, high-quality photograph or graphic that will serve as the focal point of this magazine spread. This image will fill the entire background of the spread, so describe a composition that works well with a split layout (e.g., the main subject is on the right side)."
    }`
  },
  {
    id: 'product-promo',
    name: 'Video Promo Producer',
    description: 'Creates short, engaging video promos for product launches or brand awareness.',
    type: 'video',
    icon: 'Video',
    systemInstruction: `You are a Creative Director for Video Production.
    You specialize in creating short (5-7 seconds), high-impact promotional videos.
    Guidelines:
    - Focus heavily on hyper-realistic 3D product shots or lifestyle scenes.
    - Emphasize smooth, deliberate camera movements.
    - Visuals should be crisp, modern, and premium.
    - Themes should align with the brand's core pillars.`
  },
  {
    id: 'brand-agent',
    name: 'Campaign Architect',
    description: 'Develops comprehensive, multi-channel campaign strategies and generates 3 key campaign images.',
    type: 'campaign',
    icon: 'Target',
    systemInstruction: `You are a Chief Strategy Officer.
    Your role is to conceptualize high-impact, multi-channel marketing campaigns.
    When given a product or brief, you must provide:
    1. Core Insight: A deep understanding of the consumer's need.
    2. The Big Idea: A catchy, overarching campaign theme.
    3. Execution Strategy: How this plays out across Digital, TVC, and Print.
    
    VISUAL REQUIREMENT:
    Instead of an SVG, you MUST provide exactly 3 highly detailed image prompts that represent the key visual moments of this campaign. These prompts will be sent to an image generation model.
    - Make the prompts descriptive, specifying lighting, composition, subject, and mood.
    - Ensure they align perfectly with the brand guidelines.
    
    Return a JSON object with:
    {
      "copy": "The full strategy text (markdown supported)",
      "imagePrompts": ["prompt 1", "prompt 2", "prompt 3"]
    }`
  },
  {
    id: 'slideshow-maker',
    name: 'Corporate Slideshow Maker',
    description: 'Creates professional, design-driven corporate presentation slides one at a time.',
    type: 'slideshow',
    icon: 'Presentation',
    systemInstruction: `You are a Head of Corporate Communications.
    You specialize in creating high-impact, professional presentation slides.
    Guidelines:
    - Each generation should produce exactly ONE professional slide.
    - Tone: Aligned with brand guidelines.
    - Visuals: Clean, corporate, using brand colors.
    - Content: Data-driven, concise, and persuasive.
    - LOGO INTEGRATION: Ensure the brand logo is mentioned or conceptually integrated into the slide design.`
  },
  {
    id: 'storyline-gen',
    name: 'Storyline Generator',
    description: 'Generates a 6-8 image progressive storyline based on your prompt.',
    type: 'storyline',
    icon: 'BookOpen',
    systemInstruction: `You are a Master Storyteller and Visual Narrative Artist.
    Your goal is to take a prompt and expand it into a compelling 6-8 image progressive storyline.
    
    Guidelines:
    - Break the story into EXACTLY 6 to 8 distinct, logical chapters or scenes.
    - Each scene should have a clear visual prompt that describes the setting, characters, and action.
    - Ensure a consistent visual style across all images.
    - The narrative should have a clear beginning, middle, and end.
    
    Return a JSON object with:
    {
      "storyTitle": "A catchy title for the story",
      "scenes": [
        {
          "chapterTitle": "Title for this scene",
          "narrative": "A short sentence describing what happens in this scene",
          "imagePrompt": "A highly detailed visual prompt for this specific scene"
        }
      ]
    }`
  }
];

export interface BrandGuidelines {
  name: string;
  industry: string;
  tone: string;
  pillars: string[];
  colors: string[];
  typography: { primary: string; secondary: string };
  logo?: string; // base64
}

export interface AssetAnalysis {
  theme: string;
  tone: string;
  colors: string[];
  style: string;
  composition: string;
  mood: string;
}

async function getSupportedLogoData(logoData: string): Promise<{ mimeType: string, data: string } | null> {
  const mimeTypeMatch = logoData.match(/^data:(image\/[a-z+]+);base64,/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/png";
  const base64Data = logoData.includes(',') ? logoData.split(',')[1] : logoData;

  if (mimeType === 'image/svg+xml') {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width || 512;
        canvas.height = img.height || 512;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngDataUrl = canvas.toDataURL('image/png');
          resolve({
            mimeType: 'image/png',
            data: pngDataUrl.split(',')[1]
          });
        } else {
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = logoData;
    });
  }

  return { mimeType, data: base64Data };
}

export async function analyzeAsset(imageData: string): Promise<AssetAnalysis> {
  const ai = getAI();
  const supportedAsset = await getSupportedLogoData(imageData);
  if (!supportedAsset) throw new Error("Unsupported image format");

  const prompt = `Analyze this image and extract its core visual brand identity elements. 
  Return a JSON object with the following fields:
  - theme: The overarching theme (e.g., "Minimalist Tech", "Organic Luxury")
  - tone: The emotional tone (e.g., "Professional", "Playful", "Sophisticated")
  - colors: An array of the 3-5 most prominent hex colors
  - style: The artistic style (e.g., "Flat Vector", "Photorealistic", "3D Render")
  - composition: How elements are arranged (e.g., "Centered", "Rule of Thirds", "Dynamic")
  - mood: The feeling it evokes (e.g., "Calm", "Energetic", "Trustworthy")
  
  STRICT RULES:
  1. Return ONLY valid JSON.
  2. Be concise.
  3. Ensure hex colors are accurate.`;

  const response = await withRetry(() => ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview',
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: supportedAsset.mimeType, data: supportedAsset.data } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          theme: { type: Type.STRING },
          tone: { type: Type.STRING },
          colors: { type: Type.ARRAY, items: { type: Type.STRING } },
          style: { type: Type.STRING },
          composition: { type: Type.STRING },
          mood: { type: Type.STRING }
        },
        required: ["theme", "tone", "colors", "style", "composition", "mood"]
      }
    }
  }));

  return parseJSON(response.text);
}

export async function generateBrandIdentity(
  description: string,
  context?: { logo?: string, colors?: string, tone?: string }
): Promise<BrandGuidelines> {
  const ai = getAI();
  
  let prompt = `You are a Brand Identity Expert. Based on this brand description/name: "${description}", generate a comprehensive brand identity.

STRICT RULES:
1. Return ONLY a valid JSON object.
2. Do NOT include any conversational text, thinking process, or internal monologue inside the JSON values.
3. Keep all string values concise and professional.
4. Ensure the JSON is perfectly formatted and parseable.`;
  
  if (context?.colors) {
    prompt += `\n\nIMPORTANT: The user has provided specific brand colors: ${context.colors}. You MUST incorporate these colors into the generated identity.`;
  }
  
  if (context?.tone) {
    prompt += `\n\nIMPORTANT: The user has provided a specific brand tone: "${context.tone}". You MUST align the generated identity with this tone.`;
  }

  prompt += `\n\nReturn a JSON object with this exact structure:
    {
      "name": "Brand Name",
      "industry": "Industry",
      "tone": "Brand Tone (e.g., Professional, Playful, Minimalist)",
      "pillars": ["3-4 core brand pillars"],
      "colors": ["#HEXCODE1", "#HEXCODE2"], // Generate exactly 2 to 4 core brand hex colors. Do not generate more than 4.
      "typography": {
        "primary": "Font for headings",
        "secondary": "Font for body"
      }
    }`;

  const parts: any[] = [{ text: prompt }];

  if (context?.logo) {
    const supportedLogo = await getSupportedLogoData(context.logo);
    if (supportedLogo) {
      parts.push({
        inlineData: {
          mimeType: supportedLogo.mimeType,
          data: supportedLogo.data
        }
      });
      parts[0].text += "\n\nI have also attached the brand's logo image. Analyze it to inform the color palette and overall aesthetic.";
    }
  }

  const response = await withRetry(() => ai.models.generateContent({
    model: 'gemini-3.1-flash-lite-preview',
    contents: { parts },
    config: {
      systemInstruction: "You are a Brand Identity Expert. Your task is to generate a concise, professional brand identity in JSON format. You MUST NOT include any internal monologue, thinking process, or conversational text. Return ONLY the JSON object. Keep all values extremely concise and avoid any repetitive or nonsensical strings.",
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          industry: { type: Type.STRING },
          tone: { type: Type.STRING },
          pillars: { type: Type.ARRAY, items: { type: Type.STRING } },
          colors: { 
            type: Type.ARRAY, 
            maxItems: 4,
            items: { type: Type.STRING } 
          },
          logoDescription: { 
            type: Type.STRING,
            description: "A detailed description of the brand's visual mark/logo, including its symbolic meaning and geometric structure."
          },
          typography: {
            type: Type.OBJECT,
            properties: {
              primary: { type: Type.STRING },
              secondary: { type: Type.STRING }
            }
          }
        },
        required: ["name", "industry", "tone", "pillars", "colors", "typography", "logoDescription"]
      }
    }
  }));

  const guidelines = parseJSON(response.text);

  if (context?.logo) {
    guidelines.logo = context.logo;
  } else {
    try {
      // Generate a high-quality, professional logo
      const logoResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview', // Use higher quality model for logo
        contents: {
          parts: [
            {
              text: `Create an iconic, world-class professional logo for a brand named "${guidelines.name}".
              Industry: ${guidelines.industry}. 
              Tone: ${guidelines.tone}. 
              Brand Pillars: ${guidelines.pillars.join(', ')}.
              
              DESIGN REQUIREMENTS:
              - Style: Minimalist, geometric, and timeless. Think of iconic marks like Apple, Nike, or Starbucks.
              - Composition: A clean, high-contrast silhouette. Use negative space creatively.
              - Colors: Primarily use ${guidelines.colors[0]} and ${guidelines.colors[1] || 'black'}.
              - Background: Solid, pure white background (#FFFFFF).
              - Format: Vector-style art with sharp edges and no gradients or shadows.
              - Focus: The mark should be simple enough to be recognizable at any size.`,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      }));

      for (const part of logoResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          guidelines.logo = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (e) {
      console.error("Failed to generate logo:", e);
    }
  }

  return guidelines;
}

async function appendAssetsToParts(parts: any[], assets?: any[]) {
  if (assets && assets.length > 0) {
    const analyses = assets.filter(a => a.analysis).map(a => a.analysis);
    if (analyses.length > 0) {
      parts[0].text += `\n\nVISUAL THEME & TONE GUIDELINES (Extracted from Assets):
      - Themes: ${[...new Set(analyses.map(a => a.theme))].join(', ')}
      - Tones: ${[...new Set(analyses.map(a => a.tone))].join(', ')}
      - Moods: ${[...new Set(analyses.map(a => a.mood))].join(', ')}
      - Styles: ${[...new Set(analyses.map(a => a.style))].join(', ')}
      - Prominent Colors: ${[...new Set(analyses.flatMap(a => a.colors))].join(', ')}
      
      Please strictly adhere to these visual guidelines to ensure consistency across all brand creatives.`;
    }

    parts[0].text += `\n\nADDITIONAL BRAND ASSETS: The user has provided ${assets.length} additional brand assets (images). Please use them as visual references or incorporate them into the creative where appropriate.`;
    for (const asset of assets) {
      const supportedAsset = await getSupportedLogoData(asset.data);
      if (supportedAsset) {
        parts.push({
          inlineData: {
            mimeType: supportedAsset.mimeType,
            data: supportedAsset.data
          }
        });
      }
    }
  }
}

export async function generateCreative(gem: Gem, prompt: string, config?: { 
  aspectRatio?: string; 
  guidelines?: BrandGuidelines; 
  model?: string;
  logicModel?: string;
  videoDuration?: string;
  videoShotType?: string;
  imageStyle?: string;
  assets?: any[];
}) {
  const guidelinesContext = config?.guidelines ? `
    Current Brand Guidelines for ${config.guidelines.name} (${config.guidelines.industry}):
    - Tone: ${config.guidelines.tone}
    - Pillars: ${config.guidelines.pillars.join(', ')}
    - Primary Colors: ${config.guidelines.colors.join(', ')}
    - Typography: ${config.guidelines.typography.primary} (Headings), ${config.guidelines.typography.secondary} (Body)
  ` : '';

  if (gem.type === 'image') {
    const styleInstruction = config?.imageStyle ? `\n\nVisual Style: ${config.imageStyle}` : '';
    const parts: any[] = [{ text: `${gem.systemInstruction}\n${guidelinesContext}${styleInstruction}\n\nPrompt: ${prompt}` }];
    
    await appendAssetsToParts(parts, config?.assets);
    if (config?.guidelines?.logo) {
      const supportedLogo = await getSupportedLogoData(config.guidelines.logo);
      if (supportedLogo) {
        parts.push({
          inlineData: {
            mimeType: supportedLogo.mimeType,
            data: supportedLogo.data
          }
        });
        parts[0].text += "\n\nIMPORTANT: Use the provided logo image as the definitive brand mark. Incorporate it into the creative EXACTLY ONCE. The logo MUST be a clean, transparent overlay with NO background box, border, or container. It should blend naturally into the scene as if it were part of the environment or a high-end watermark. ABSOLUTELY NO grey, white, or colored background squares around the logo.";
      }
    }

    const ai = getAI();
    const modelId = config?.model || 'gemini-2.5-flash-image';
    const supportsSearch = modelId === 'gemini-3.1-flash-image-preview' || modelId === 'gemini-3-pro-image-preview';
    const supportsImageSize = supportsSearch;
    
    const imageConfig: any = {
      aspectRatio: (config?.aspectRatio as any) || "1:1"
    };
    if (supportsImageSize) {
      imageConfig.imageSize = "1K";
    }

    const tools: any[] = [];
    if (supportsSearch) {
      const searchTypes: any = { webSearch: {} };
      if (modelId === 'gemini-3.1-flash-image-preview') {
        searchTypes.imageSearch = {};
      }
      tools.push({ googleSearch: { searchTypes } });
    }
    
    const response = await withRetry(() => ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        imageConfig,
        tools: tools.length > 0 ? tools : undefined,
      }
    }));
    
    const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
    if (imagePart?.inlineData) {
      return { 
        type: 'image', 
        data: `data:image/png;base64,${imagePart.inlineData.data}`,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      };
    }
    throw new Error("No image generated");
  } 
  
  if (gem.type === 'campaign') {
    const ai = getAI();
    const logicModelId = 'gemini-3.1-flash-lite-preview';
    const imageModelId = config?.model || 'gemini-2.5-flash-image';
    const parts: any[] = [{ text: `${gem.systemInstruction}\n${guidelinesContext}\n\nPrompt: ${prompt}` }];
    
    await appendAssetsToParts(parts);

    const response = await withRetry(() => ai.models.generateContent({
      model: logicModelId,
      contents: { parts },
      config: {
        systemInstruction: `${gem.systemInstruction}\n\nSTRICT RULES: Your task is to generate a concise, professional marketing campaign in JSON format. You MUST NOT include any internal monologue, thinking process, or conversational text. Return ONLY the JSON object. Keep all values extremely concise and avoid any repetitive or nonsensical strings.`,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            copy: { type: Type.STRING },
            imagePrompts: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["copy", "imagePrompts"]
        },
        tools: [{ googleSearch: {} }]
      }
    }));

    const result = parseJSON(response.text);
    
    if (!result.imagePrompts || !Array.isArray(result.imagePrompts)) {
      throw new Error("Failed to generate image prompts for campaign.");
    }

    const imagePromises = result.imagePrompts.slice(0, 3).map(async (imgPrompt: string) => {
      try {
        const imageResult = await generateImage(imgPrompt, config?.guidelines, "16:9", imageModelId, config?.assets);
        return imageResult.url;
      } catch (e) {
        console.error("Failed to generate one of the campaign images:", e);
      }
      return null;
    });

    const images = await Promise.all(imagePromises);

    return {
      type: 'campaign',
      data: {
        copy: result.copy,
        images: images.filter(Boolean)
      },
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  }
  
  if (gem.type === 'text') {
    const ai = getAI();
    const modelId = config?.model || 'gemini-3.1-flash-lite-preview';
    const parts: any[] = [{ text: `${gem.systemInstruction}\n${guidelinesContext}\n\nPrompt: ${prompt}` }];
    
    if (config?.guidelines?.logo) {
      const supportedLogo = await getSupportedLogoData(config.guidelines.logo);
      if (supportedLogo) {
        parts.push({
          inlineData: {
            mimeType: supportedLogo.mimeType,
            data: supportedLogo.data
          }
        });
        parts[0].text += "\n\nIMPORTANT: Use the provided logo image as the definitive brand mark. In your generated SVG, represent this logo accurately using SVG paths/shapes or include a clear placeholder for it. Ensure it is well-positioned and blends with the brand aesthetics. Place it as a clear, well-positioned element with a transparent background—DO NOT place it inside a box, label, or rounded rectangle.";
      }
    }

    await appendAssetsToParts(parts, config?.assets);

    const response = await withRetry(() => ai.models.generateContent({
      model: modelId,
      contents: { parts },
      config: {
        systemInstruction: `${gem.systemInstruction}\n\nSTRICT RULES: Your task is to generate a concise, professional brand narrative and SVG in JSON format. You MUST NOT include any internal monologue, thinking process, or conversational text. Return ONLY the JSON object. Keep all values extremely concise and avoid any repetitive or nonsensical strings. COLOR RESTRICTION: Use ONLY standard hex (#RRGGBB) or RGB colors in the SVG. DO NOT use oklch, oklab, lab, or lch.`,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            copy: { type: Type.STRING },
            svg: { type: Type.STRING },
            conceptDescription: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["copy", "svg", "conceptDescription", "imagePrompt"]
        },
        tools: [{ googleSearch: {} }]
      }
    }));

    try {
      const result = parseJSON(response.text);
      return { 
        type: 'text', 
        data: result.copy,
        svg: result.svg,
        conceptDescription: result.conceptDescription,
        imagePrompt: result.imagePrompt,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata 
      };
    } catch (e) {
      console.error("Failed to parse narrative JSON:", e);
      return { 
        type: 'text', 
        data: response.text, 
        groundingMetadata: response.candidates?.[0]?.groundingMetadata 
      };
    }
  }

  if (gem.type === 'video') {
    // Veo implementation
    const ai = getAI();
    const modelId = config?.model || 'veo-3.1-fast-generate-preview';
    const logicModelId = config?.logicModel || 'gemini-3.1-flash-lite-preview';
    
    // Step 1: Generate the detailed video concept
    const durationInstruction = config?.videoDuration ? `\nDuration: ${config.videoDuration}` : '';
    const shotTypeInstruction = config?.videoShotType ? `\nShot Type: ${config.videoShotType}` : '';
    
    const parts: any[] = [{ text: `You are a Creative Director for Video Production.
      The user wants a video promo for their brand: ${config?.guidelines?.name}.
      Veo models generate high-quality videos.
      We need to make this visual COUNT by being subtle, elegant, and highly impactful.
      ${durationInstruction}
      ${shotTypeInstruction}
      
      Create a highly detailed visual prompt for the Veo video model. Focus on clean cinematography, hyper-realistic 3D product shots, sophisticated lighting, and smooth camera movements.
      CRITICAL: Avoid cluttered, chaotic, or over-the-top VFX. Keep the composition minimal, premium, and focused entirely on the product's essence. Less is more.
      CRITICAL: The visual prompt MUST describe the brand logo appearing naturally on the product packaging. Do NOT describe it as a floating overlay if it's already on the product. Avoid visual redundancy. The logo MUST be a clean, transparent overlay with NO background box, border, or container. It should blend naturally into the scene as if it were part of the environment or a high-end watermark. ABSOLUTELY NO grey, white, or colored background squares around the logo.
      Also provide a 1-line voice-over (VO) and a music style recommendation that fits this video.
      
      ${guidelinesContext}
      
      User Prompt: ${prompt}
      
      Return a JSON object with the following structure:
      {
        "visualPrompt": "The highly detailed prompt to feed to the Veo model (max 800 chars)",
        "voiceOver": "A short, punchy 1-line voice over",
        "musicStyle": "Description of the music style (e.g., 'Subtle acoustic, elegant ambient')",
        "cinematographyNotes": "Brief notes on the camera work, lighting, and subtle VFX"
      }` }];

    await appendAssetsToParts(parts, config?.assets);

    const conceptResponse = await withRetry(() => ai.models.generateContent({
      model: logicModelId,
      contents: { parts },
      config: {
        systemInstruction: `${gem.systemInstruction}\n\nSTRICT RULES: Your task is to generate a concise, professional video concept in JSON format. You MUST NOT include any internal monologue, thinking process, or conversational text. Return ONLY the JSON object. Keep all values extremely concise and avoid any repetitive or nonsensical strings.`,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            visualPrompt: { type: Type.STRING },
            voiceOver: { type: Type.STRING },
            musicStyle: { type: Type.STRING },
            cinematographyNotes: { type: Type.STRING }
          },
          required: ["visualPrompt", "voiceOver", "musicStyle", "cinematographyNotes"]
        }
      }
    }));

    let concept;
    try {
      concept = parseJSON(conceptResponse.text);
    } catch (e) {
      console.error("Failed to parse video concept:", e);
      concept = {
        visualPrompt: prompt,
        voiceOver: "",
        musicStyle: "",
        cinematographyNotes: ""
      };
    }

    // Step 2: Call Veo with the detailed visual prompt
    let operation = await withRetry(() => ai.models.generateVideos({
      model: modelId,
      prompt: concept.visualPrompt,
      config: {
        numberOfVideos: 1,
        resolution: modelId === 'veo-3.1-generate-preview' ? '1080p' : '720p',
        aspectRatio: (config?.aspectRatio as any) || '16:9'
      }
    }));

    return { type: 'video_op', operationId: operation.name, operation, concept };
  }

  if (gem.type === 'slideshow') {
    const ai = getAI();
    const logicModelId = 'gemini-3.1-flash-lite-preview';
    const parts: any[] = [{ text: `Generate a single professional corporate presentation slide based on this prompt: ${prompt}.
      ${guidelinesContext}
      Use Google Search to find real facts, figures, and details relevant to the brand.
      Provide:
      - title: A short, punchy heading.
      - content: 2-3 bullet points.
      - imagePrompt: A detailed prompt to generate a corporate background image for this slide.
      Return as a JSON object.` }];

    if (config?.guidelines?.logo) {
      const supportedLogo = await getSupportedLogoData(config.guidelines.logo);
      if (supportedLogo) {
        parts.push({
          inlineData: {
            mimeType: supportedLogo.mimeType,
            data: supportedLogo.data
          }
        });
        parts[0].text += "\n\nIMPORTANT: Use the provided logo image as the definitive brand mark. Ensure it is integrated into the presentation design conceptually. The logo MUST be a clean, transparent overlay with NO background box, border, or container. It should be well-positioned and blend seamlessly—ABSOLUTELY NO grey, white, or colored background squares around the logo.";
      }
    }

    await appendAssetsToParts(parts, config?.assets);

    const response = await withRetry(() => ai.models.generateContent({
      model: logicModelId,
      contents: { parts },
      config: {
        systemInstruction: `${gem.systemInstruction}\n\nSTRICT RULES: Your task is to generate a concise, professional presentation slide in JSON format. You MUST NOT include any internal monologue, thinking process, or conversational text. Return ONLY the JSON object. Keep all values extremely concise and avoid any repetitive or nonsensical strings.`,
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.ARRAY, items: { type: Type.STRING } },
            imagePrompt: { type: Type.STRING }
          },
          required: ["title", "content", "imagePrompt"]
        },
        tools: [{ googleSearch: {} }]
      }
    }));

    try {
      const slide = parseJSON(response.text);
      return { 
        type: 'slideshow', 
        data: [slide], // Return as an array with one item for compatibility
        groundingMetadata: response.candidates?.[0]?.groundingMetadata 
      };
    } catch (e) {
      console.error("Failed to parse slideshow:", e);
      throw new Error("Failed to generate slide structure.");
    }
  }

  if (gem.type === 'storyline') {
    const ai = getAI();
    const logicModelId = 'gemini-3.1-flash-lite-preview';
    const parts: any[] = [{ text: `Generate a 6-8 image progressive storyline based on this prompt: ${prompt}.
      ${guidelinesContext}
      Provide a storyTitle and a list of scenes, each with a chapterTitle, narrative, and a detailed imagePrompt.
      Return as a JSON object.` }];

    const response = await withRetry(() => ai.models.generateContent({
      model: logicModelId,
      contents: { parts },
      config: {
        systemInstruction: `${gem.systemInstruction}\n\nSTRICT RULES: Your task is to generate a concise, professional storyline in JSON format. You MUST NOT include any internal monologue, thinking process, or conversational text. Return ONLY the JSON object.`,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            storyTitle: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  chapterTitle: { type: Type.STRING },
                  narrative: { type: Type.STRING },
                  imagePrompt: { type: Type.STRING }
                },
                required: ["chapterTitle", "narrative", "imagePrompt"]
              }
            }
          },
          required: ["storyTitle", "scenes"]
        }
      }
    }));

    try {
      const storyline = parseJSON(response.text);
      return { 
        type: 'storyline', 
        data: storyline,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata 
      };
    } catch (e) {
      console.error("Failed to parse storyline:", e);
      throw new Error("Failed to generate storyline structure.");
    }
  }
}

export async function generateImage(prompt: string, guidelines?: BrandGuidelines, aspectRatio: string = "16:9", model?: string, assets?: any[]) {
  const guidelinesContext = guidelines ? `
    Current Brand Guidelines for ${guidelines.name}:
    - Pillars: ${guidelines.pillars.join(', ')}
    - Primary Colors: ${guidelines.colors.join(', ')}
    - Typography: ${guidelines.typography.primary} (Headings), ${guidelines.typography.secondary} (Body)
  ` : '';

  const parts: any[] = [{ text: `You are a Lead Visual Designer. Create a high-quality, professional corporate background image.\n${guidelinesContext}\n\nPrompt: ${prompt}` }];
  
  if (guidelines?.logo) {
    const supportedLogo = await getSupportedLogoData(guidelines.logo);
    if (supportedLogo) {
      parts.push({
        inlineData: {
          mimeType: supportedLogo.mimeType,
          data: supportedLogo.data
        }
      });
      parts[0].text += "\n\nIMPORTANT: Use the provided logo image as the definitive brand mark. Incorporate it into the creative EXACTLY ONCE. The logo MUST be a clean, transparent overlay with NO background box, border, or container. It should blend naturally into the scene as if it were part of the environment or a high-end watermark. ABSOLUTELY NO grey, white, or colored background squares around the logo.";
    }
  }

  await appendAssetsToParts(parts, assets);

  const ai = getAI();
  const modelId = model || 'gemini-2.5-flash-image';
  const isImagen = modelId.startsWith('imagen-');

  if (isImagen) {
    const response = await withRetry(() => ai.models.generateImages({
      model: modelId,
      prompt: `You are a Lead Visual Designer. Create a high-quality, professional corporate background image.\n${guidelinesContext}\n\nPrompt: ${prompt}\n\nIMPORTANT: The image MUST be clean and professional. ABSOLUTELY NO text, labels, or boxy borders around the brand elements.`,
      config: {
        numberOfImages: 1,
        aspectRatio: (aspectRatio as any) || "16:9",
        outputMimeType: 'image/jpeg'
      }
    }));

    if (response.generatedImages?.[0]?.image?.imageBytes) {
      return {
        url: `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`
      };
    }
    throw new Error("No image generated by Imagen");
  }

  const supportsSearch = modelId === 'gemini-3.1-flash-image-preview' || modelId === 'gemini-3-pro-image-preview';
  const supportsImageSize = supportsSearch;
  
  const imageConfig: any = {
    aspectRatio: (aspectRatio as any) || "16:9"
  };
  if (supportsImageSize) {
    imageConfig.imageSize = "1K";
  }

  const tools: any[] = [];
  if (supportsSearch) {
    const searchTypes: any = { webSearch: {} };
    if (modelId === 'gemini-3.1-flash-image-preview') {
      searchTypes.imageSearch = {};
    }
    tools.push({ googleSearch: { searchTypes } });
  }

  const response = await withRetry(() => ai.models.generateContent({
    model: modelId,
    contents: { parts },
    config: {
      imageConfig,
      tools: tools.length > 0 ? tools : undefined,
    }
  }));
  
  const imagePart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
  if (imagePart?.inlineData) {
    return { 
      url: `data:image/png;base64,${imagePart.inlineData.data}`,
      groundingMetadata: response.candidates?.[0]?.groundingMetadata
    };
  }
  throw new Error("No image generated");
}

function pcmToWav(base64Pcm: string, sampleRate: number = 24000): string {
  const binaryString = atob(base64Pcm);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const wavHeader = new ArrayBuffer(44);
  const view = new DataView(wavHeader);

  // RIFF identifier
  view.setUint32(0, 0x52494646, false); // "RIFF"
  // file length
  view.setUint32(4, 36 + len, true);
  // RIFF type
  view.setUint32(8, 0x57415645, false); // "WAVE"
  // format chunk identifier
  view.setUint32(12, 0x666d7420, false); // "fmt "
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, 1, true);
  // channel count
  view.setUint16(22, 1, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * 2, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, 2, true);
  // bits per sample
  view.setUint16(34, 16, true);
  // data chunk identifier
  view.setUint32(36, 0x64617461, false); // "data"
  // data chunk length
  view.setUint32(40, len, true);

  const blob = new Blob([wavHeader, bytes], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

export async function generateTTS(text: string, voice: string = 'Kore', emotion: string = 'Professional') {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say in a natural, ${emotion} accent: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice as any },
        },
      },
    },
  }));

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (base64Audio) {
    return pcmToWav(base64Audio);
  }
  throw new Error("Failed to generate audio");
}

export async function pollVideo(operation: any) {
  const ai = getAI();
  return await withRetry(() => ai.operations.getVideosOperation({ operation }));
}
