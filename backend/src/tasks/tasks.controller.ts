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
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { TasksService } from './tasks.service'
import { CreateTaskDto } from './dto/create-task.dto'
import { UpdateTaskDto } from './dto/update-task.dto'
import { FilterTasksDto } from './dto/filter-tasks.dto'

@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List all tasks for the current user' })
  findAll(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Query() filters: FilterTasksDto,
  ) {
    return this.tasksService.findAll(user.id, filters.status, filters.page, filters.limit)
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single task by ID' })
  findOne(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.findOne(id, user.id)
  }

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  create(@CurrentUser() user: AuthenticatedRequest['user'], @Body() dto: CreateTaskDto) {
    return this.tasksService.create(dto, user.id)
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing task' })
  update(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, dto, user.id)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  remove(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.remove(id, user.id)
  }
}
