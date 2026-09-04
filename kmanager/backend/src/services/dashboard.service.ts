import { transactionRepository } from '@repositories/transaction.repository';
import {
  DashboardSummary,
  Transaction,
  CreateTransactionDto,
  UpdateTransactionDto,
  Category,
  QuickExpense,
  CreateQuickExpenseDto,
} from '@models/transaction.model';

export class DashboardService {
  async getDashboardSummary(userId: number): Promise<DashboardSummary> {
    const totals = await transactionRepository.getTotalsByUserId(userId);
    const savingGoal = await transactionRepository.getSavingGoalByUserId(userId);
    const recentTransactions = await transactionRepository.findByUserId(userId, 10);
    const quickExpenses = await transactionRepository.getQuickExpensesByUserId(userId);

    const netSavings = Math.max(0, totals.totalIncome - totals.totalExpense);
    const savingPercentage =
      totals.totalIncome > 0
        ? Math.min(100, Math.max(0, Math.round((netSavings / totals.totalIncome) * 100)))
        : 0;

    const formattedHistory = recentTransactions.map((t) => {
      const isPositive = t.type === 'income';

      // Ícono preferido: de la categoría vinculada, o fallback inteligente
      let icon = t.categoryIcon;
      if (!icon) {
        icon = isPositive
          ? 'account_balance'
          : t.title.toLowerCase().includes('alquiler') || t.title.toLowerCase().includes('hogar')
          ? 'home'
          : t.title.toLowerCase().includes('luz')
          ? 'bolt'
          : t.title.toLowerCase().includes('agua')
          ? 'water_drop'
          : t.title.toLowerCase().includes('internet')
          ? 'wifi'
          : t.title.toLowerCase().includes('tarjeta')
          ? 'credit_card'
          : 'shopping_cart';
      }

      // Color preferido: de la categoría vinculada, o fallback inteligente
      const color = t.categoryColor || (isPositive ? 'emerald' : icon === 'home' ? 'blue' : 'rose');

      const colorMap: Record<string, string> = {
        emerald: 'bg-emerald-500/20 text-emerald-400',
        blue: 'bg-blue-500/20 text-blue-400',
        rose: 'bg-rose-500/20 text-rose-400',
        yellow: 'bg-yellow-500/20 text-yellow-400',
        cyan: 'bg-cyan-500/20 text-cyan-400',
        purple: 'bg-purple-500/20 text-purple-400',
        amber: 'bg-amber-500/20 text-amber-400',
      };

      const iconBg = colorMap[color] || 'bg-emerald-500/20 text-emerald-400';

      const statusClass =
        t.status === 'Completado'
          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
          : t.status === 'Pendiente'
          ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
          : 'bg-rose-500/10 text-rose-400 border-rose-500/20';

      return {
        id: String(t.id),
        title: t.title,
        subtitle: t.subtitle || t.categoryName || (isPositive ? 'Ingreso Principal' : 'Gasto General'),
        date: t.transactionDate,
        status: t.status,
        statusClass,
        amount: `${isPositive ? '+' : '-'}Q${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        isPositive,
        icon,
        iconBg,
        categoryId: t.categoryId,
      };
    });

    return {
      totalIngresos: `Q${totals.totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      totalEgresos: `Q${totals.totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      ingresosTrend: '+12.5% este mes',
      porcentajeAhorro: savingPercentage,
      ahorradoMes: `Q${netSavings.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      quickExpenses,
      monthlyHistory: formattedHistory,
    };
  }

  async getTransactions(userId: number): Promise<Transaction[]> {
    return transactionRepository.findByUserId(userId);
  }

  async createTransaction(userId: number, dto: CreateTransactionDto): Promise<Transaction> {
    if (!dto.title || !dto.amount || !dto.type) {
      throw new Error('Los campos title, amount y type son obligatorios');
    }
    if (dto.amount <= 0) {
      throw new Error('El monto debe ser un valor positivo mayor a 0');
    }
    return transactionRepository.create(userId, dto);
  }

  async updateTransaction(userId: number, id: number, dto: UpdateTransactionDto): Promise<Transaction> {
    if (dto.amount !== undefined && dto.amount <= 0) {
      throw new Error('El monto debe ser un valor positivo mayor a 0');
    }
    const updated = await transactionRepository.update(id, userId, dto);
    if (!updated) {
      throw new Error('Transacción no encontrada o sin permisos para editarla');
    }
    return updated;
  }

  async deleteTransaction(userId: number, id: number): Promise<boolean> {
    return transactionRepository.delete(id, userId);
  }

  async getCategories(): Promise<Category[]> {
    return transactionRepository.getCategories();
  }

  async getQuickExpenses(userId: number): Promise<QuickExpense[]> {
    return transactionRepository.getQuickExpensesByUserId(userId);
  }

  async createQuickExpense(userId: number, dto: CreateQuickExpenseDto): Promise<QuickExpense> {
    if (!dto.title || !dto.title.trim()) {
      throw new Error('El nombre o título del egreso fijo es obligatorio');
    }
    return transactionRepository.createQuickExpense(userId, {
      title: dto.title.trim(),
      categoryId: dto.categoryId,
      icon: dto.icon || 'shopping_bag',
      color: dto.color || 'rose',
      defaultAmount: dto.defaultAmount || 0,
    });
  }
}

export const dashboardService = new DashboardService();

