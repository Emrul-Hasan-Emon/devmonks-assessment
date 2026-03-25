import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostgresService } from 'src/database/postgres/postgres.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([])],
  providers: [PostgresService],
  exports: [PostgresService],
})
export class MysqlModule {}
