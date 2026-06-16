import { IsIn, IsOptional } from 'class-validator';

export const LANGUAGES = [
  'English',
  'Hindi',
  'Bengali',
  'Tamil',
  'Telugu',
  'Marathi',
  'Gujarati',
  'Kannada',
  'Malayalam',
  'Punjabi',
] as const;

export const GEMINI_MODELS = ['gemini-3.1-pro-preview', 'gemini-3-pro-preview', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'] as const;
export const TEMPERATURES = ['0.1', '0.2'] as const;

export class ExtractTextDto {
  @IsIn(LANGUAGES)
  language!: (typeof LANGUAGES)[number];

  @IsOptional()
  @IsIn(GEMINI_MODELS)
  model?: (typeof GEMINI_MODELS)[number];

  @IsOptional()
  @IsIn(TEMPERATURES)
  temperature?: (typeof TEMPERATURES)[number];
}
