import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { join } from 'node:path';
import { ExtractionModule } from './extraction/extraction.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(process.cwd(), 'apps', 'api', '.env'),
        join(process.cwd(), '.env'),
        '.env',
      ],
    }),
    ExtractionModule,
  ],
})
export class AppModule {}
