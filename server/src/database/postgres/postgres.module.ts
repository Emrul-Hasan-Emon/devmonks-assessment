import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresService } from 'src/database/postgres/postgres.service';
import { Bookmark } from './entities/bookmark/bookmark.entity';
import { StorySummary } from './entities/story-summary/story-summary.entity';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Bookmark, StorySummary])],
  providers: [PostgresService],
  exports: [PostgresService],
})
export class MysqlModule {}
