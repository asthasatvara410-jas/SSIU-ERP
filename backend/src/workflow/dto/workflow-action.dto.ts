import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';

export class WorkflowActionDto {
  @IsNotEmpty({ message: 'Action is required.' })
  @IsIn([
    'SUBMIT',
    'VERIFY',
    'FORWARD',
    'RECOMMEND',
    'APPROVE',
    'REJECT',
    'RETURN',
    'ASSIGN',
    'PROCESS',
    'COMPLETE',
    'PUBLISH',
    'CANCEL',
  ])
  action: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  attachmentUrl?: string;

  @IsOptional()
  @IsString()
  targetAssigneeRoleId?: string;
}
