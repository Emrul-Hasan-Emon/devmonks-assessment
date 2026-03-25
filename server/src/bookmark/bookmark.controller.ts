import { Body, Controller, Get, Post } from '@nestjs/common';
import {
  SearchPagination,
  SearchPaginationParams,
} from 'src/common/decorator/pagination.decorator';
import { BookmarkService } from './bookmark.service';
import { AddBookmarkDto } from './dto/add-bookmark.dto';

@Controller({
  path: 'api/bookmark',
  version: '1',
})
export class BookmarkController {
  constructor(private readonly bookmarkService: BookmarkService) {}

  @Post()
  async addBookmark(@Body() payload: AddBookmarkDto) {
    return this.bookmarkService.addBookmark(payload);
  }

  @Get()
  async listBookmarks(@SearchPaginationParams() pagination: SearchPagination) {
    return this.bookmarkService.listBookmarks(pagination);
  }
}
