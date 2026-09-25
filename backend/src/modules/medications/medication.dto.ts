import { IsDateString, IsInt, IsNumber, IsString, Max, Min } from 'class-validator';

export class CreateMedicationPlanDto {
  @IsString() medicalRecordId!: string;
  @IsString() drugName!: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsInt() @Min(1) @Max(10) timesPerDay!: number;
  @IsNumber() @Min(0.0001) dosePerKg!: number;
}

export class UpdateMedicationPlanDto {
  @IsString() drugName!: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsInt() @Min(1) @Max(10) timesPerDay!: number;
  @IsNumber() @Min(0.0001) dosePerKg!: number;
}

export class ConfirmMedicationDto {
  @IsInt() @Min(0) @Max(9) doseIndex!: number;
  @IsDateString() date!: string;
}
