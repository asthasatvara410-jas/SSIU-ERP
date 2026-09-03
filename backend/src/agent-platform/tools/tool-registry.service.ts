import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ToolDefinition, ToolKey } from './tool.types';
import { timetableTools } from './definitions/timetable.tools';
import { dmsTools } from './definitions/dms.tools';
import { feesTools } from './definitions/fees.tools';
import { notificationTools } from './definitions/notification.tools';
import { studentTools } from './definitions/student.tools';

@Injectable()
export class ToolRegistryService implements OnModuleInit {
  private readonly logger = new Logger('ToolRegistryService');
  private readonly tools = new Map<string, ToolDefinition>();

  onModuleInit() {
    this.seedDefaultTools();
  }

  seedDefaultTools(): void {
    const all = [
      ...timetableTools,
      ...dmsTools,
      ...feesTools,
      ...notificationTools,
      ...studentTools,
    ];

    for (const tool of all) {
      this.registerTool(tool);
    }
  }

  registerTool(tool: ToolDefinition): void {
    if (this.tools.has(tool.key)) {
      throw new Error(`Duplicate tool registration rejected: Tool key '${tool.key}' already registered.`);
    }

    this.tools.set(tool.key, tool);
    this.logger.log(`Registered agent tool: '${tool.key}' [v${tool.version}, ${tool.riskLevel} risk, ${tool.status}]`);
  }

  unregisterTool(toolKey: ToolKey): boolean {
    return this.tools.delete(toolKey);
  }

  getTool(toolKey: ToolKey): ToolDefinition | undefined {
    return this.tools.get(toolKey);
  }

  hasTool(toolKey: ToolKey): boolean {
    return this.tools.has(toolKey);
  }

  listTools(category?: string): ToolDefinition[] {
    const list = Array.from(this.tools.values());
    if (!category) return list;
    return list.filter(t => t.category === category);
  }

  enableTool(toolKey: ToolKey): boolean {
    const tool = this.tools.get(toolKey);
    if (!tool) return false;
    tool.status = 'ACTIVE';
    return true;
  }

  disableTool(toolKey: ToolKey): boolean {
    const tool = this.tools.get(toolKey);
    if (!tool) return false;
    tool.status = 'DISABLED';
    return true;
  }
}
