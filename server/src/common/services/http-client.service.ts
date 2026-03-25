import { HttpService } from '@nestjs/axios';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { HTTP_FAILED } from 'src/common/utils/response-message.util';

@Injectable()
export class HttpClientService {
  constructor(private httpService: HttpService) {}

  async post<T>(
    url: string,
    body: any,
    headers?: Record<string, any>,
  ): Promise<T> {
    try {
      const response = await lastValueFrom(
        this.httpService.post<T>(url, body, {
          headers: this.getFilteredHeaders(headers),
        }),
      );
      return response.data;
    } catch (error) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data || HTTP_FAILED;
      throw new HttpException(message, status);
    }
  }

  async get<T>(
    url: string,
    params?: Record<string, any>,
    headers?: Record<string, string | string[]>,
  ): Promise<T> {
    try {
      const response = await lastValueFrom(
        this.httpService.get<T>(url, {
          params,
          headers: this.getFilteredHeaders(headers),
        }),
      );
      return response.data;
    } catch (error) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data || HTTP_FAILED;
      throw new HttpException(message, status);
    }
  }

  async delete<T>(
    url: string,
    headers?: Record<string, string | string[]>,
  ): Promise<T> {
    try {
      const response = await lastValueFrom(
        this.httpService.delete<T>(url, {
          headers: this.getFilteredHeaders(headers),
        }),
      );
      return response.data;
    } catch (error) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data || HTTP_FAILED;
      throw new HttpException(message, status);
    }
  }

  async update<T>(
    url: string,
    body: any,
    headers?: Record<string, string | string[]>,
  ): Promise<T> {
    try {
      const response = await lastValueFrom(
        this.httpService.patch<T>(url, body, {
          headers: this.getFilteredHeaders(headers),
        }),
      );
      return response.data;
    } catch (error) {
      const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
      const message = error.response?.data || HTTP_FAILED;
      throw new HttpException(message, status);
    }
  }

  private getFilteredHeaders(
    headers: Record<string, string | string[]>,
  ): Record<string, string> {
    const necessaryHeaders: Record<string, string> = {};
    if (!headers) {
      return necessaryHeaders;
    }

    const headersToInclude = [
      'authorization',
      'accept',
      // Add other headers
    ];

    for (const header of headersToInclude) {
      if (headers[header]) {
        // Handle cases where header might be string or string[]
        necessaryHeaders[header] = Array.isArray(headers[header])
          ? (headers[header] as string[]).join(', ')
          : (headers[header] as string);
      }
    }

    return necessaryHeaders;
  }
}
