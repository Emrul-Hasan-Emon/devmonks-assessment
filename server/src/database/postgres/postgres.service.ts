import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark/bookmark.entity';

@Injectable()
export class PostgresService implements OnApplicationBootstrap {
  bookmark: Repository<Bookmark>;
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
  ) {}

  onApplicationBootstrap() {
    this.bookmark = this.bookmarkRepository;
  }
}
