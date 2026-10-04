import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { WorkflowService } from './workflow.service';

@ApiTags('workflows')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('workflows')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Get('definitions')
  @ApiOperation({ summary: 'Get workflow definitions by entity type' })
  getDefinitions(@Query('entityType') entityType?: string) {
    return this.workflowService.getDefinitions(entityType);
  }

  @Post('definitions')
  @ApiOperation({ summary: 'Create workflow definition' })
  createDefinition(
    @Body()
    data: {
      name: string;
      module: string;
      description?: string;
      config?: any;
      steps?: any[];
    },
  ) {
    return this.workflowService.createDefinition(data);
  }

  @Get('instances')
  @ApiOperation({ summary: 'Get pending approvals for current user' })
  getPendingApprovals(
    @Query('userId') userId: string,
    @Query('roleId') roleId: string,
  ) {
    return this.workflowService.getPendingApprovals(userId, roleId);
  }

  @Post('start')
  @ApiOperation({ summary: 'Start a new workflow instance' })
  startWorkflow(
    @Body()
    data: {
      definitionId: string;
      entityType: string;
      entityId: string;
      context: Record<string, any>;
    },
    @Request() req: any,
  ) {
    return this.workflowService.startWorkflow(
      data.definitionId,
      data.entityType,
      data.entityId,
      data.context,
      req.user?.userId || 'system',
    );
  }

  @Get('instances/:id')
  @ApiOperation({ summary: 'Get workflow instance by ID' })
  getInstance(@Param('id') id: string) {
    return this.workflowService.getInstance(id);
  }

  @Get('entity/:entityType/:entityId')
  @ApiOperation({ summary: 'Get workflow instances for an entity' })
  getByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.workflowService.getInstancesByEntity(entityType, entityId);
  }

  @Post('instances/:id/transition')
  @ApiOperation({ summary: 'Execute workflow transition' })
  executeTransition(
    @Param('id') id: string,
    @Body()
    body: {
      action: 'approve' | 'reject' | 'delegate' | 'skip' | 'return';
      comment?: string;
      delegatedToUserId?: string;
      delegatedToRoleId?: string;
    },
    @Request() req: any,
  ) {
    return this.workflowService.executeTransition(
      id,
      body.action,
      req.user?.userId || 'system',
      {
        comment: body.comment,
        delegatedToUserId: body.delegatedToUserId,
        delegatedToRoleId: body.delegatedToRoleId,
      },
    );
  }
}
