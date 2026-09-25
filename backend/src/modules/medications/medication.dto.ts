import { IsDateString, IsInt, IsOptional, IsPositive, IsString, Max } from 'class-validator';

export class CreateMedicationDto {
  @IsString() petId!: string;
  @IsString() recordId!: string;
  @IsString() drugName!: string;
  @IsDateString() startDate!: string;
  @IsDateString() endDate!: string;
  @IsInt() @Max(20) timesPerDay!: number;
  @IsPositive() dosePerKg!: number;
}

export class UpdateMedicationDto extends CreateMedicationDto {}

export class ConfirmDoseDto {
  @IsInt() doseOrder!: number;
  @IsOptional() @IsDateString() doseDate?: string;
}
