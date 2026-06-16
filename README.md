# Image Question Extractor

Next.js + NestJS project for extracting handwritten question paper text from images with Gemini.

## Apps

- `apps/web`: Next.js frontend with User and Admin sections.
- `apps/api`: NestJS backend that sends the uploaded image and extraction prompt to Gemini.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the backend env example and add your Gemini API key:

```bash
copy apps\api\.env.example apps\api\.env
```

3. Run both apps in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

Frontend: http://localhost:3000

Backend: http://localhost:4000

## Gemini Settings

The API defaults to `gemini-3.1-pro-preview` and temperature `0.1`. The Admin section can switch between:

- `gemini-3.1-pro-preview`
- `gemini-3-pro-preview`
- `gemini-2.5-flash`
- `gemini-2.5-pro`
- `gemini-2.0-flash`

To use Google Cloud credits through Vertex AI instead of AI Studio API-key free tier quota, set:

```env
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=your_google_cloud_project_id
GOOGLE_CLOUD_LOCATION=global
```

Supported temperature presets are `0.1` and `0.2`.
