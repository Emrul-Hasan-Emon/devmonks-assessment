import { Module } from '@nestjs/common';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { SummaryService } from './summary.service';

@Module({
  controllers: [StoryController],
  providers: [StoryService, SummaryService],
})
export class StoryModule {}
