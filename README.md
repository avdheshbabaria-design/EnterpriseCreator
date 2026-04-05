# Enterprise Creative Suite

An enterprise-grade creative generation engine designed to transform brand descriptions into cohesive, high-impact visual and narrative assets. Powered by Google's Gemini models, this suite ensures your brand's identity is consistently reflected across every medium.

## 🚀 Key Features

### 1. Brand Identity Setup
Start by defining your brand's core essence. The suite generates:
- **Professional Logos**: AI-generated vector-style brand marks.
- **Color Palettes**: Harmonious color systems that reflect your brand's tone.
- **Typography**: Curated font pairings for headings and body copy.
- **Brand Pillars**: Core values that drive all generated content.

### 2. The Five Creative Gems
- **🖼️ Visual Concept**: Generate high-quality SVG poster layouts and raster images.
- **🎬 Video Promo**: Create cinematic video concepts and high-fidelity video clips using Veo models.
- **✍️ Brand Narrative**: Craft compelling brand stories with integrated custom SVG graphics.
- **📊 Presentation**: Build professional slideshows with AI-generated content and imagery.
- **📣 Campaign**: Orchestrate multi-channel marketing campaigns with a single prompt.

### 3. AI-Powered Asset Library
Upload your existing brand assets and let the system analyze them:
- **Visual Analysis**: Automatically extracts theme, tone, mood, and style from images.
- **Thematic Pinning**: Extracted guidelines are injected into the AI's system instructions to ensure all new content "pins down" your brand's specific aesthetic.
- **Management**: Easily select or deselect assets to influence the creative direction of your projects.

## 🛠️ Technical Stack

- **Framework**: React 18+ with Vite
- **AI Engine**: Google Gemini API (`gemini-3-flash-preview`, `veo-3.1-fast-generate-preview`, etc.)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Motion (formerly Framer Motion)
- **Data Visualization**: D3.js & Recharts (where applicable)

## 📖 How to Use

1. **Setup Your Brand**: Enter your brand name, industry, and a brief description. The AI will generate your initial brand guidelines.
2. **Populate the Asset Library**: Upload logos, product shots, or mood board images. The AI will analyze their visual style.
3. **Select Your Gem**: Choose the type of creative asset you want to generate.
4. **Prompt & Generate**: Enter a specific prompt (e.g., "A summer launch campaign for our eco-friendly sneakers").
5. **Refine & Export**: Download your generated SVGs, PNGs, videos, or narratives directly.

## 🔑 Environment Variables

To run this application, you need to configure the following:

```env
# .env.example
GEMINI_API_KEY=your_google_ai_studio_api_key
```

---

*Built with precision and craft using Google AI Studio.*
