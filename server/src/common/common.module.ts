import { Global, Module } from '@nestjs/common';
import { FileUploadService } from './services/file-upload.service';
import { HttpClientService } from './services/http-client.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
    imports: [HttpModule],
    providers: [FileUploadService, HttpClientService],
    exports: [FileUploadService, HttpClientService],
})
export class CommonModule {}
