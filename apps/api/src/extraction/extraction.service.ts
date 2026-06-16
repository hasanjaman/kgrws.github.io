import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { ExtractTextDto } from './dto/extract-text.dto';

const BASE_PROMPT = `Task: High-precision transcription of handwritten examination papers.
STRICT TRANSCRIPTION RULES:
NO BULLETS: DO NOT use asterisks (*) or dashes (-). Use only the literal numbering or lettering written in the image (e.g., 1, 2, ক, খ, अ, ब, or a, b).
NO HALLUCINATION: Transcribe ONLY the visible text. Do not invent questions, do not complete sentences, and do not update dates (keep it exactly as written). Use [?] for illegible words.
MCQ LAYOUT: Place all Multiple Choice options on a single horizontal line: (i) Option (ii) Option (iii) Option.
STRUCTURE: Use ### for the School Name and Section Headers. Use --- for horizontal section breaks.
CORRECTIONS: Fix minor spelling typos in the handwriting for clarity, but strictly preserve the original meaning and technical terms.
PRINT-READY LAYOUT: Ensure the output is clean, professional, and formatted like an official examination paper.
NOW, TRANSCRIBE THE ATTACHED IMAGE FOLLOWING THIS EXACT PATTERN USING THE SCRIPT PRESENT IN THE IMAGE:`;

@Injectable()
export class ExtractionService {
  constructor(private readonly config: ConfigService) {}

  async extractFromImages(images: Express.Multer.File[], dto: ExtractTextDto) {
    const ai = this.createClient();
    const model = dto.model ?? this.config.get<string>('GEMINI_MODEL', 'gemini-3.1-pro-preview');
    const temperature = Number(dto.temperature ?? this.config.get<string>('GEMINI_TEMPERATURE', '0.1'));
    const prompt = `${BASE_PROMPT}

You are receiving ${images.length} image(s). Read them together in upload order as pages of the same document unless the content clearly says otherwise.
Return the final printable output in ${dto.language}. Keep original names, question numbers, marks, and section labels accurate.`;

    try {
      const imageParts = images.map((image) => ({
        inlineData: {
          mimeType: image.mimetype,
          data: image.buffer.toString('base64'),
        },
      }));

      const response = await ai.models.generateContent({
        model,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              ...imageParts,
            ],
          },
        ],
        config: {
          temperature,
        },
      });

      const text = response.text?.trim();

      if (!text) {
        throw new InternalServerErrorException('Gemini returned an empty extraction');
      }

      return {
        text,
        language: dto.language,
        model,
        temperature,
        imageCount: images.length,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Unknown Gemini error';
      throw new InternalServerErrorException(`Gemini extraction failed: ${message}`);
    }
  }

  private createClient() {
    const useVertexAi = this.config.get<string>('GOOGLE_GENAI_USE_VERTEXAI', 'false').toLowerCase() === 'true';

    if (useVertexAi) {
      const project = this.config.get<string>('GOOGLE_CLOUD_PROJECT');
      const location = this.config.get<string>('GOOGLE_CLOUD_LOCATION', 'global');

      if (!project) {
        throw new BadRequestException('GOOGLE_CLOUD_PROJECT is missing while GOOGLE_GENAI_USE_VERTEXAI=true');
      }

      return new GoogleGenAI({
        vertexai: true,
        project,
        location,
      });
    }

    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new BadRequestException('GEMINI_API_KEY is missing in the API environment');
    }

    return new GoogleGenAI({ apiKey });
  }
}
