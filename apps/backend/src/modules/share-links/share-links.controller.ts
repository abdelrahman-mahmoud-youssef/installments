import { Body, Controller, Post } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateShareLinkDto } from './dto/create-share-link.dto';
import { ShareLinksService } from './share-links.service';

@Controller('share-links')
export class ShareLinksController {
  constructor(private readonly shareLinksService: ShareLinksService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateShareLinkDto) {
    return this.shareLinksService.getOrCreate(user.tenantId, dto.targetPath);
  }
}
