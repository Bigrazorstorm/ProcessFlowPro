export class UserResponseDto {
  id!: string;
  email!: string;
  name!: string;
  role!: string;
  capacityPointsLimit!: number;
  isActive!: boolean;
  primarySubstituteId?: string;
  secondarySubstituteId?: string;
  createdAt!: Date;
  updatedAt!: Date;
}
