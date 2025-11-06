import { Module } from '@nestjs/common';
import { I18nModule as NestI18nModule, AcceptLanguageResolver, QueryResolver, HeaderResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    NestI18nModule.forRoot({
      fallbackLanguage: 'pt-BR',
      loaderOptions: {
        path: path.join(__dirname, '../i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] }, // ?lang=pt-BR
        AcceptLanguageResolver, // Accept-Language header
        new HeaderResolver(['x-lang']), // x-lang header
      ],
    }),
  ],
})
export class I18nModule {}
