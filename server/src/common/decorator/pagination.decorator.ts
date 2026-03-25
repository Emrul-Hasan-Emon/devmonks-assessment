import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Request } from 'express';

export interface SearchPagination {
  page: number;
  size: number;
  limit: number;
  offset: number;
}

export const SearchPaginationParams = createParamDecorator(
  (data, ctx: ExecutionContext): SearchPagination => {
    const req: Request = ctx.switchToHttp().getRequest();
    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 10;

    // check if page and size are valid
    if (isNaN(page) || page < 0 || isNaN(page) || size < 0) {
      throw new BadRequestException('Invalid pagination params');
    }
    // do not allow to fetch large slices of the dataset
    if (size > 100) {
      throw new BadRequestException(
        'Invalid pagination params: Max size is 100',
      );
    }

    // calculate pagination parameters
    // calculate pagination parameters
    const limit = size;
    const offset = page * limit;
    return { page, size, limit, offset };
  },
);

export function hasNext(count: number, pagination: SearchPagination) {
  return count > (pagination.page + 1) * pagination.size;
}

export function getSearchPaginateData(
  data: any,
  count: number,
  pagination: SearchPagination,
) {
  return {
    pagination: {
      totalItems: count,
      page: pagination.page,
      size: pagination.size,
      hasNext: hasNext(count, pagination),
    },
    data: data,
  };
}
