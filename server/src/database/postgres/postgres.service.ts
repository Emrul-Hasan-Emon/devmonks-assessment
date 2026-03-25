import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bookmark } from './entities/bookmark/bookmark.entity';
import { StorySummary } from './entities/story-summary/story-summary.entity';

@Injectable()
export class PostgresService implements OnApplicationBootstrap {
  bookmark: Repository<Bookmark>;
  storySummary: Repository<StorySummary>;
  constructor(
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
    @InjectRepository(StorySummary)
    private readonly storySummaryRepository: Repository<StorySummary>,
  ) {}

  onApplicationBootstrap() {
    this.bookmark = this.bookmarkRepository;
    this.storySummary = this.storySummaryRepository;
  }
}
