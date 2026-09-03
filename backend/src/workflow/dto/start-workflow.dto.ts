import { IsNotEmpty, IsString, IsOptional, IsIn } from 'class-validator';

export class StartWorkflowDto {
  @IsNotEmpty({ message: 'Workflow definition code is required.' })
  @IsString()
  definitionCode: string;

  @IsNotEmpty({ message: 'Associated entity ID is required.' })
  @IsString()
  entityId: string;

  @IsOptional()
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: string = 'NORMAL';

  @IsOptional()
  @IsString()
  initialComments?: string;
}
