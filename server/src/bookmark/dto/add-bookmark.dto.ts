import { IsNumber } from 'class-validator';

export class AddBookmarkDto {
  @IsNumber()
  storyId: number;
}
