import { Controller, Get, Query } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  getReports(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.getReports(user.tenantId, query);
  }
}
