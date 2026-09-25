import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRole } from '../../constants/enums';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MedicationRepository {
  constructor(private readonly prisma: PrismaService) {}

  private scope(user: { sub: string; role: UserRole }): Prisma.MedicationPlanWhereInput {
    if (user.role === UserRole.VET) return { vetId: user.sub };
    if (user.role === UserRole.PET_OWNER) return { pet: { ownerId: user.sub } };
    return {};
  }

  findMany(user: { sub: string; role: UserRole }, petId?: string, medicalRecordId?: string) {
    const where: Prisma.MedicationPlanWhereInput = {
      ...this.scope(user),
      ...(petId ? { petId } : {}),
      ...(medicalRecordId ? { medicalRecordId } : {}),
    };
    return this.prisma.medicationPlan.findMany({
      where,
      include: { pet: true, vet: true, medicalRecord: true, logs: { orderBy: [{ scheduledDate: 'asc' }, { doseIndex: 'asc' }] } },
      orderBy: { startDate: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.medicationPlan.findUnique({
      where: { id },
      include: { pet: true, medicalRecord: true, logs: true },
    });
  }

  findByRecordAndDrug(medicalRecordId: string, drugName: string) {
    return this.prisma.medicationPlan.findUnique({
      where: { medicalRecordId_drugName: { medicalRecordId, drugName } },
    });
  }

  findMedicalRecord(medicalRecordId: string) {
    return this.prisma.medicalRecord.findUnique({
      where: { id: medicalRecordId },
      include: { pet: true },
    });
  }

  create(data: Prisma.MedicationPlanUncheckedCreateInput) {
    return this.prisma.medicationPlan.create({ data });
  }

  update(id: string, data: Prisma.MedicationPlanUncheckedUpdateInput) {
    return this.prisma.medicationPlan.update({ where: { id }, data });
  }

  findLog(planId: string, scheduledDate: Date, doseIndex: number) {
    return this.prisma.medicationLog.findUnique({
      where: { planId_scheduledDate_doseIndex: { planId, scheduledDate, doseIndex } },
    });
  }

  countLogs(planId: string, scheduledDate: Date) {
    return this.prisma.medicationLog.count({ where: { planId, scheduledDate } });
  }

  createLog(data: Prisma.MedicationLogUncheckedCreateInput) {
    return this.prisma.medicationLog.create({ data });
  }
}
