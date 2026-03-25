import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { Bookmark } from './entities/bookmark/bookmark.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Bookmark])],
  providers: [PostgresService],
  exports: [PostgresService],
})
export class MysqlModule {}
