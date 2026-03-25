import { Controller, Get, Param } from '@nestjs/common';
import {
  SearchPagination,
  SearchPaginationParams,
} from 'src/common/decorator/pagination.decorator';
import { StoryService } from './story.service';
import { SummaryService } from './summary.service';

@Controller({
  path: 'api/story',
  version: '1',
})
export class StoryController {
  constructor(
    private readonly storyService: StoryService,
    private readonly summaryService: SummaryService,
  ) {}

  @Get('top-stories')
  async getTopStories(@SearchPaginationParams() pagination: SearchPagination) {
    return this.storyService.getTopStories(pagination);
  }

  @Get('best-stories')
  async getBestStories(@SearchPaginationParams() pagination: SearchPagination) {
    return this.storyService.getBestStories(pagination);
  }

  @Get('new-stories')
  async getNewStories(@SearchPaginationParams() pagination: SearchPagination) {
    return this.storyService.getNewStories(pagination);
  }

  @Get('story-details/:id')
  async getTopStoryDetails(@Param('id') id: number) {
    return this.storyService.getStoryDetail(id);
  }

  @Get('summary/:id')
  async summarizeComments(@Param('id') id: number) {
    return this.summaryService.summarizeStoryComments(id);
  }
}
