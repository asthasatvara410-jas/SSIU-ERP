import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateInstituteDto {
  @IsNotEmpty({ message: 'Institute code is required.' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Institute name is required.' })
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  shortName?: string;

  @IsNotEmpty({ message: 'University ID is required.' })
  @IsString()
  universityId: string;
}
