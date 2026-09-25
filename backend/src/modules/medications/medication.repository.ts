import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../constants/enums';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MedicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findMany(user: { sub: string; role: UserRole }, petId?: string) {
    const where: Prisma.MedicationScheduleWhereInput = {
      ...(user.role === UserRole.PET_OWNER ? { pet: { ownerId: user.sub } } : {}),
      ...(user.role === UserRole.VET ? { record: { vetId: user.sub } } : {}),
      ...(petId ? { petId } : {}),
    };
    return this.prisma.medicationSchedule.findMany({
      where,
      include: { pet: true, record: { include: { clinic: true } }, doseLogs: { orderBy: { doseOrder: 'asc' } } },
      orderBy: [{ startDate: 'asc' }, { drugName: 'asc' }],
    });
  }

  findById(id: string) {
    return this.prisma.medicationSchedule.findUnique({
      where: { id },
      include: { pet: true, record: true, doseLogs: true },
    });
  }

  findByRecordAndDrug(recordId: string, drugName: string) {
    return this.prisma.medicationSchedule.findUnique({
      where: { recordId_drugName: { recordId, drugName } },
    });
  }

  findContext(recordId: string, petId: string) {
    return this.prisma.medicalRecord.findUnique({
      where: { id: recordId },
      include: { pet: true },
    });
  }

  create(data: Prisma.MedicationScheduleUncheckedCreateInput) {
    return this.prisma.medicationSchedule.create({ data });
  }

  update(id: string, data: Prisma.MedicationScheduleUncheckedUpdateInput) {
    return this.prisma.medicationSchedule.update({ where: { id }, data });
  }

  upsertDoseLog(data: { scheduleId: string; doseDate: Date; doseOrder: number }) {
    return this.prisma.medicationDoseLog.upsert({
      where: { scheduleId_doseDate_doseOrder: data },
      create: data,
      update: {},
    });
  }
}
