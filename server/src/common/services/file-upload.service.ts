import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3 } from 'aws-sdk';
import axios from 'axios';
import { extname } from 'path';

@Injectable()
export class FileUploadService {
  constructor(private readonly configService: ConfigService) {}

  s3Config = {
    bucket: this.configService.get('s3Config.bucket'),
    region: this.configService.get('s3Config.region'),
    accessKeyId: this.configService.get('s3Config.accessKeyId'),
    secretAccessKey: this.configService.get('s3Config.secretAccessKey'),
  };

  // Initialize the S3 client
  s3 = new S3({
    region: this.s3Config.region,
    credentials: {
      accessKeyId: this.s3Config.accessKeyId,
      secretAccessKey: this.s3Config.secretAccessKey,
    },
  });

  async uploadFiles(
    files: Array<Express.Multer.File>,
    folder: string,
  ): Promise<string[]> {
    const urls = [];
    for (const file of files) {
      const url = await this.uploadFile(file, folder);
      urls.push(url);
    }
    return urls;
  }

  async uploadFile(file: Express.Multer.File | any, folder: string) {
    const { originalname } = file;
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(originalname);
    const name = `${folder}/${file.fieldname}-${uniqueSuffix}${ext}`;
    const result = await this.s3_upload(
      file.buffer,
      this.s3Config.bucket,
      name,
      file.mimetype,
    );
    return result['Location'];
  }

  async uploadFileWithTemplateAndId(
    file: Express.Multer.File | any,
    templateName: string,
    id: string,
    folder: string,
  ) {
    const name = `${folder}/${templateName}-${id}.pdf`;

    const existingFile = await this.s3
      .headObject({ Bucket: this.s3Config.bucket, Key: name })
      .promise()
      .catch(() => null);
    if (existingFile) {
      await this.s3
        .deleteObject({ Bucket: this.s3Config.bucket, Key: name })
        .promise();
    }

    const result = await this.s3_upload(
      file.buffer,
      this.s3Config.bucket,
      name,
      file.mimetype,
    );
    return result['Location'];
  }

  async uploadFileFromUrl(url: string, folder: string) {
    // Fetch the file from the URL
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
    });

    // Create a mock file object to pass into your existing upload function
    const file = {
      buffer: Buffer.from(response.data, 'binary'),
      originalname: url.split('/').pop(), // Extract filename from the URL
      mimetype: response.headers['content-type'],
      fieldname: 'file', // Set the field name
    };

    // Call your existing uploadFile function
    const fileUrl = await this.uploadFile(file, folder);

    return {
      url: fileUrl,
      fieldname: 'file',
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.buffer.length,
    };
  }

  async removedFile(url: string) {
    try {
      // Extract the key by removing the URL prefix
      const key = url.split('.com/')[1];
      return await this.s3
        .deleteObject({ Bucket: this.s3Config.bucket, Key: key })
        .promise();
    } catch (e) {
      console.log('error-deleting-image', e);
    }
  }

  async s3_upload(file, bucket, name, mimetype) {
    const params = {
      Bucket: bucket,
      Key: String(name),
      Body: file,
      ACL: 'public-read',
      ContentType: mimetype,
    };

    try {
      return await this.s3.upload(params).promise();
    } catch (e) {
      console.log('error-uploading-image', e);
    }
  }
}
