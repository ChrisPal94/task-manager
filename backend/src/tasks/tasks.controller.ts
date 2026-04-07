import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { FilterTasksDto } from './dto/filter-tasks.dto';

@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findAll(@Req() req: any, @Query() filters: FilterTasksDto) {
    return this.tasksService.findAll((req as AuthenticatedRequest).user.id, filters.status);
  }

  @Get(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  findOne(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.findOne(id, (req as AuthenticatedRequest).user.id);
  }

  @Post()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  create(@Req() req: any, @Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto, (req as AuthenticatedRequest).user.id);
  }

  @Put(':id')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  update(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto, (req as AuthenticatedRequest).user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  remove(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.tasksService.remove(id, (req as AuthenticatedRequest).user.id);
  }
}
