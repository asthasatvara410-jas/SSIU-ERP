import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GrantBudgetService {
  constructor(private readonly prisma: PrismaService) {}

  async setBudget(grantId: string, category: string, allocatedAmount: number, tenantId: string) {
    return this.prisma.grantBudget.create({
      data: {
        tenantId,
        grantId,
        category,
        allocatedAmount,
        revisedAmount: allocatedAmount,
      },
    });
  }

  async getBudgetSummary(grantId: string, tenantId: string) {
    const [budgets, expenses] = await Promise.all([
      this.prisma.grantBudget.findMany({ where: { grantId, tenantId } }),
      this.prisma.grantExpense.findMany({ where: { grantId, tenantId, verificationStatus: 'VERIFIED' } }),
    ]);

    const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    return {
      totalAllocated,
      totalSpent,
      remaining: Math.max(0, totalAllocated - totalSpent),
      utilizationPercentage: totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0,
      categories: budgets.map(b => {
        const spent = expenses.filter(e => e.category === b.category).reduce((s, e) => s + e.amount, 0);
        return {
          category: b.category,
          allocated: b.allocatedAmount,
          spent,
          remaining: Math.max(0, b.allocatedAmount - spent),
          percentage: b.allocatedAmount > 0 ? (spent / b.allocatedAmount) * 100 : 0,
        };
      }),
    };
  }
}
