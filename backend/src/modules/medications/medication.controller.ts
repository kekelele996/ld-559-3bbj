import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuditLog } from '../../middleware/audit-log';
import { AuthGuard } from '../auth/auth.guard';
import { ConfirmMedicationDto, CreateMedicationPlanDto, UpdateMedicationPlanDto } from './medication.dto';
import { MedicationService } from './medication.service';

@Controller('medications')
@UseGuards(AuthGuard)
export class MedicationController {
  constructor(private readonly service: MedicationService) {}

  @Get()
  async list(
    @Req() req: any,
    @Query('petId') petId?: string,
    @Query('medicalRecordId') medicalRecordId?: string,
  ) {
    return { code: 0, message: 'ok', data: await this.service.list(req.user, petId, medicalRecordId) };
  }

  @Get('pets/:petId/today')
  async today(@Req() req: any, @Param('petId') petId: string) {
    return { code: 0, message: 'ok', data: await this.service.todayForPet(req.user, petId) };
  }

  @Post()
  @AuditLog('登记用药安排')
  async create(@Req() req: any, @Body() dto: CreateMedicationPlanDto) {
    const result = await this.service.create(req.user, dto);
    return {
      code: 0,
      message: result.duplicated ? '该就诊记录下已存在同名用药安排，已保留原安排' : 'ok',
      data: result.plan,
      duplicated: result.duplicated,
    };
  }

  @Patch(':id')
  @AuditLog('调整用药疗程')
  async update(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateMedicationPlanDto) {
    const result = await this.service.update(req.user, id, dto);
    return { code: 0, message: 'ok', data: result.plan };
  }

  @Post(':id/confirm')
  @AuditLog('确认服药打卡')
  async confirm(@Req() req: any, @Param('id') id: string, @Body() dto: ConfirmMedicationDto) {
    const result = await this.service.confirm(req.user, id, dto);
    return {
      code: 0,
      message: result.alreadyConfirmed ? '本次服药已确认，无需重复打卡' : 'ok',
      data: result,
    };
  }
}
