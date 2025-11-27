# Sensei

**Sensei** is an interactive AI-powered tutor that turns any text into an engaging audio lesson. It uses advanced LLMs to structure content into digestible "nodes" of scripts and interactive questions, and employs Text-to-Speech (TTS) to deliver a lifelike learning experience.

## Features

- **Interactive Learning**: Converts static text into a dynamic lesson with scripts and check-for-understanding questions.
- **Difficulty Selection**: Choose your preferred explanation style:
  - **ELI5**: Simple analogies and language for beginners.
  - **Common**: Standard explanation for general audiences.
  - **Professional**: Technical depth and terminology for experts.
- **Dual TTS Engine**:
  - **Cloud (Minimax)**: High-quality, ultra-realistic voice generation (requires API key).
  - **Local (WebGPU)**: Privacy-focused, offline-capable TTS running entirely in your browser using [Supertonic-TTS-WebGPU](https://huggingface.co/onnx-community/Supertonic-TTS-ONNX).
- **Modern UI**: A beautiful, responsive interface featuring glassmorphism design.
- **Library**: Save and revisit your generated lessons.

## Getting Started

### Prerequisites

- Node.js 18+ installed.
- API Keys for:
  - **Google Gemini** (for content generation and evaluation).
  - **Minimax** (optional, for cloud TTS).

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/sensei.git
   cd sensei
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Configuration

1. Click the **Settings** (gear icon) in the top right corner.
2. Enter your **Gemini API Key**.
3. Select your **TTS Provider**:
   - **Minimax API**: Requires a Minimax API Key.
   - **Local (WebGPU)**: Runs locally.

### Using Local TTS

If you select **Local (WebGPU)**:
1. In the Settings panel, you will see a "Local Model (Supertonic)" section.
2. Click **Download & Initialize Model**.
3. Wait for the download (~300MB) to complete.
4. Once ready, all subsequent audio (scripts and feedback) will be generated locally.

### Creating a Lesson

1. Paste any text, article, or topic into the input box on the home page.
2. Click the **Generate** button (arrow icon).
3. Select your desired **Difficulty Level**.
4. Sensei will generate the lesson and start the interactive player.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
