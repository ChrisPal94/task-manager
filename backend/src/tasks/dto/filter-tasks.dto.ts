import { IsEnum, IsOptional } from 'class-validator';
import { TaskStatus } from '../task.entity';

export class FilterTasksDto {
  @IsOptional()
  @IsEnum(TaskStatus, { message: 'Invalid status filter' })
  status?: TaskStatus;
}
