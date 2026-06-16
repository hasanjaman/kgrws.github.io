import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ExtractTextDto, GEMINI_MODELS, LANGUAGES, TEMPERATURES } from './dto/extract-text.dto';
import { ExtractionService } from './extraction.service';

@Controller()
export class ExtractionController {
  constructor(private readonly extractionService: ExtractionService) {}

  @Get('health')
  health() {
    return {
      ok: true,
      service: 'image-question-extractor-api',
      languages: LANGUAGES,
      models: GEMINI_MODELS,
      temperatures: TEMPERATURES,
    };
  }

  @Post('extract')
  @UseInterceptors(
    FilesInterceptor('image', 10, {
      storage: memoryStorage(),
      limits: {
        fileSize: 12 * 1024 * 1024,
        files: 10,
      },
      fileFilter: (_request, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(new BadRequestException('Only image files are supported'), false);
          return;
        }
        callback(null, true);
      },
    }),
  )
  extract(@UploadedFiles() images: Express.Multer.File[], @Body() body: ExtractTextDto) {
    if (!images?.length) {
      throw new BadRequestException('At least one image is required');
    }

    return this.extractionService.extractFromImages(images, body);
  }
}
