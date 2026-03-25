import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SeederOptions } from 'typeorm-extension';

export const createTypeOrmConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions & SeederOptions> => ({
  type: 'postgres',
  host: configService.get('DB_HOST'),
  port: parseInt(configService.get('DB_PORT') || '5432', 10),
  username: configService.get('DB_USERNAME'),
  password: configService.get('DB_PASSWORD'),
  database: configService.get('DB_DATABASE'),
  entities: ['dist/database/postgres/entities/**/*.entity.js'],
  synchronize: configService.get('DB_SYNCHRONIZE') === 'true',
  logging: configService.get('DB_LOGGER') === 'true',
  // seeds: [SpecialtySeeder, LabTestSeeder],
  // cache: {
  //   type: 'ioredis',
  //   options: {
  //     host: configService.get('REDIS_HOSTNAME', 'localhost'),
  //     port: configService.get<number>('REDIS_PORT', 6379),
  //     password: configService.get('REDIS_PASSWORD', ''),
  //     keyPrefix: 'typeorm_cache:',
  //   },
  //   duration: 60000,
  //   ignoreErrors: true,
  // },
});
