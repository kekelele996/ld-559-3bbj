import { PrismaClient, Gender, InsuranceStatus, PetSpecies, PolicyType, UserRole, VaccineStatus, VisitType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('PetCare123', 10);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@petcare.test' },
    update: {},
    create: { email: 'owner@petcare.test', password, name: '林一一', role: UserRole.PET_OWNER },
  });
  const vet = await prisma.user.upsert({
    where: { email: 'vet@petcare.test' },
    update: {},
    create: { email: 'vet@petcare.test', password, name: '周医生', role: UserRole.VET },
  });
  await prisma.user.upsert({
    where: { email: 'admin@petcare.test' },
    update: {},
    create: { email: 'admin@petcare.test', password, name: '平台管理员', role: UserRole.ADMIN },
  });
  const clinic = await prisma.clinic.create({ data: { name: '安心宠物医院', address: '上海市徐汇区健康路 12 号', phone: '021-38506' } });
  const pet = await prisma.pet.create({
    data: {
      ownerId: owner.id,
      name: '豆包',
      species: PetSpecies.DOG,
      breed: '柯基',
      gender: Gender.MALE,
      birthDate: new Date('2021-03-12'),
      weight: 11.8,
      microchipNo: 'MC-559-001',
      allergies: '青霉素',
      medicalHistory: '幼年期肠胃敏感，需定期复查。',
    },
  });
  const visit = await prisma.medicalRecord.create({
    data: {
      petId: pet.id,
      vetId: vet.id,
      clinicId: clinic.id,
      visitDate: new Date(),
      type: VisitType.CHECKUP,
      diagnosis: '年度体检，体况良好',
      treatment: '建议控制体重并增加运动',
      prescription: '益生菌 7 日',
      cost: 328,
      nextVisitDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 90),
      attachments: [],
    },
  });
  // 把「益生菌 7 日」处方接成结构化用药安排：每次剂量与每日总量按体重核算。
  await prisma.medicationPlan.create({
    data: {
      medicalRecordId: visit.id,
      petId: pet.id,
      vetId: vet.id,
      drugName: '益生菌',
      startDate: new Date(),
      endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
      timesPerDay: 2,
      dosePerKg: 0.1,
      dosePerTime: Math.round(pet.weight * 0.1 * 100) / 100,
      dailyDose: Math.round(pet.weight * 0.1 * 2 * 100) / 100,
    },
  });
  await prisma.vaccineRecord.create({
    data: {
      petId: pet.id,
      vaccineName: '狂犬疫苗',
      batchNo: 'RV-2026-06',
      nextDueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6),
      vetId: vet.id,
      status: VaccineStatus.PENDING,
    },
  });
  await prisma.insurancePolicy.create({
    data: {
      petId: pet.id,
      provider: 'PawShield',
      planType: PolicyType.STANDARD,
      premium: 1299,
      coverage: 30000,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      status: InsuranceStatus.ACTIVE,
    },
  });
}

main().finally(async () => prisma.$disconnect());
