import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuditLog } from '../../middleware/audit-log';
import { AuthGuard } from '../auth/auth.guard';
import { ConfirmDoseDto, CreateMedicationDto, UpdateMedicationDto } from './medication.dto';
import { MedicationService } from './medication.service';

@Controller('medications')
@UseGuards(AuthGuard)
export class MedicationController {
  constructor(private readonly service: MedicationService) {}

  @Get()
  async list(@Req() req: any, @Query('petId') petId?: string) {
    return { code: 0, message: 'ok', data: await this.service.list(req.user, petId) };
  }

  @Get('progress')
  async progress(@Req() req: any, @Query('petId') petId: string, @Query('date') date?: string) {
    return { code: 0, message: 'ok', data: await this.service.progress(req.user, petId, date) };
  }

  @Post()
  @AuditLog('登记用药安排')
  async create(@Body() dto: CreateMedicationDto) {
    const result = await this.service.create(dto);
    return { code: 0, message: 'ok', data: result };
  }

  @Patch(':id')
  @AuditLog('调整用药疗程')
  async update(@Param('id') id: string, @Body() dto: UpdateMedicationDto) {
    return { code: 0, message: 'ok', data: await this.service.update(id, dto) };
  }

  @Post(':id/confirm')
  @AuditLog('确认用药打卡')
  async confirm(@Param('id') id: string, @Body() dto: ConfirmDoseDto) {
    return { code: 0, message: 'ok', data: await this.service.confirm(id, dto) };
  }
}
