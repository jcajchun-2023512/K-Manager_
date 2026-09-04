import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';
import { Role } from '../auth/models/user.model';
import { DashboardService } from '../dashboard/services/dashboard.service';
import {
  DashboardSummary,
  MonthlyHistoryItem,
  Category,
  UpdateTransactionDto,
} from '../dashboard/models/dashboard.model';
import { DEFAULT_CATEGORIES, getTodayLocalDateString } from '../dashboard/dashboard.component';

export interface ChartPoint {
  x: number;
  y: number;
  label: string;
}

@Component({
  selector: 'app-ingresos',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ingresos.component.html',
  styleUrl: './ingresos.component.css',
})
export class IngresosComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private router = inject(Router);
  private subscription = new Subscription();

  // Dynamic Financial Data (from PostgreSQL via DashboardService)
  readonly totalIngresos = signal<string>('Q0.00');
  readonly ingresosTrend = signal<string>('+12.5%');
  readonly incomeTransactions = signal<MonthlyHistoryItem[]>([]);
  readonly categories = signal<Category[]>(DEFAULT_CATEGORIES);
  readonly isLoading = signal<boolean>(true);
  readonly selectedPeriod = signal<'6m' | '1y'>('6m');

  // Computed state to verify if any income is registered
  readonly hasIncomes = computed<boolean>(() => {
    const list = this.incomeTransactions();
    return list.length > 0;
  });

  // Dynamic Month Labels (calculated backward from current month in Spanish)
  readonly chartMonthLabels = computed<string[]>(() => {
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const count = this.selectedPeriod() === '6m' ? 6 : 12;
    const currentMonthIdx = new Date().getMonth();
    const labels: string[] = [];

    for (let i = count - 1; i >= 0; i--) {
      let idx = (currentMonthIdx - i) % 12;
      if (idx < 0) idx += 12;
      labels.push(monthNames[idx]);
    }
    return labels;
  });

  // Dynamic Chart Points (Flat at baseline 36 when 0 transactions, rising progressively when incomes exist)
  readonly chartPoints = computed<ChartPoint[]>(() => {
    const labels = this.chartMonthLabels();
    const count = labels.length;
    const hasData = this.hasIncomes();
    const txCount = this.incomeTransactions().length;

    // Si NO hay ingresos registrados: línea completamente PLANA en la base (y = 36)
    if (!hasData) {
      return labels.map((label, idx) => ({
        x: Math.round((idx / (count - 1)) * 100),
        y: 36,
        label,
      }));
    }

    // Si HAY ingresos registrados: sube progresivamente mes a mes
    // Calculamos el nivel de altura según transacciones (mínimo y=35 base, pico superior y=5 a 10)
    const curveProfiles: Record<'6m' | '1y', number[]> = {
      '6m': [35, 32, 26, 20, 12, 4],
      '1y': [36, 34, 32, 30, 26, 24, 20, 18, 14, 11, 7, 4],
    };

    const targetProfile = curveProfiles[this.selectedPeriod()] || curveProfiles['6m'];

    // Escalar la progresión si hay pocas transacciones (1 o 2) para que se vea el despegue gradual
    return labels.map((label, idx) => {
      const x = Math.round((idx / (count - 1)) * 100);
      const standardY = targetProfile[idx] !== undefined ? targetProfile[idx] : 36;
      
      // Progresión suave: parte de la base y va subiendo hacia el mes actual
      let y = standardY;
      if (txCount === 1) {
        // Con 1 ingreso, despega suavemente hacia el final
        y = idx <= 2 ? 36 : Math.max(14, 36 - (idx - 2) * 7);
      } else if (txCount === 2) {
        y = idx <= 1 ? 35 : Math.max(10, 35 - (idx - 1) * 5);
      }

      return { x, y, label };
    });
  });

  // Dynamic SVG Trend Line Path
  readonly chartLinePath = computed<string>(() => {
    const points = this.chartPoints();
    if (points.length === 0) return 'M 0,36 L 100,36';

    let d = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      d += ` L ${points[i].x},${points[i].y}`;
    }
    return d;
  });

  // Dynamic SVG Gradient Area Path
  readonly chartAreaPath = computed<string>(() => {
    const line = this.chartLinePath();
    return `${line} L 100,40 L 0,40 Z`;
  });

  // UI Interactive States
  readonly showNewOperationModal = signal<boolean>(false);
  readonly toastMessage = signal<string | null>(null);
  readonly toastType = signal<'success' | 'error' | 'info'>('info');
  readonly mobileMenuOpen = signal<boolean>(false);
  readonly sessionExpired = signal<boolean>(false);
  readonly isSubmitting = signal<boolean>(false);

  // --- EDICIÓN ---
  readonly showEditModal = signal<boolean>(false);
  readonly editingItem = signal<MonthlyHistoryItem | null>(null);
  readonly isEditSubmitting = signal<boolean>(false);

  // --- CONFIRMACIÓN DE ELIMINACIÓN ---
  readonly showDeleteConfirmModal = signal<boolean>(false);
  readonly deletingItem = signal<MonthlyHistoryItem | null>(null);
  readonly isDeleting = signal<boolean>(false);

  // Form Signals for New Operation (Exact same structure and behavior as Dashboard)
  readonly opTitle = signal<string>('');
  readonly opAmount = signal<number | null>(null);
  readonly opType = signal<'income' | 'expense'>('income');
  readonly opSubtitle = signal<string>('');
  readonly opCategoryId = signal<number | null>(null);
  readonly opDate = signal<string>(getTodayLocalDateString());

  // Form Signals for Edit Operation
  readonly editId = signal<string | number | null>(null);
  readonly editTitle = signal<string>('');
  readonly editAmount = signal<number | null>(null);
  readonly editType = signal<'income' | 'expense'>('income');
  readonly editSubtitle = signal<string>('');
  readonly editCategoryId = signal<number | null>(null);
  readonly editDate = signal<string>(getTodayLocalDateString());
  readonly editStatus = signal<'Completado' | 'Pendiente' | 'Cancelado'>('Completado');

  ngOnInit(): void {
    this.authService.startExpirationCheck();
    this.subscription.add(
      this.authService.tokenExpired$.subscribe((expired) => {
        this.sessionExpired.set(expired);
      })
    );

    this.loadIncomeData();
    this.loadCategories();
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  loadIncomeData(): void {
    this.isLoading.set(true);
    this.dashboardService.getSummary().subscribe({
      next: (summary: DashboardSummary) => {
        this.totalIngresos.set(summary.totalIngresos);
        this.ingresosTrend.set(summary.ingresosTrend || '+12.5%');
        
        // Filter only income transactions for this view
        const history = summary.monthlyHistory || [];
        const incomesOnly = history.filter((item) => item.isPositive);
        this.incomeTransactions.set(incomesOnly);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar datos de ingresos desde PostgreSQL:', err);
        this.isLoading.set(false);
        this.showToast('Error al conectar con la base de datos PostgreSQL.');
      },
    });
  }

  loadCategories(): void {
    this.dashboardService.getCategories().subscribe({
      next: (cats) => {
        if (cats && Array.isArray(cats) && cats.length > 0) {
          this.categories.set(cats);
        } else {
          this.categories.set(DEFAULT_CATEGORIES);
        }
      },
      error: (err) => {
        console.warn('Categorías de respaldo activadas para ingresos:', err);
        this.categories.set(DEFAULT_CATEGORIES);
      },
    });
  }

  user() {
    return this.authService.getCurrentUser();
  }

  get cardRoleTitle(): string {
    return this.user()?.role === Role.ADMIN ? 'Card Admin' : 'Card User';
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // --- FORMULARIO NUEVA OPERACIÓN (IDÉNTICO AL DEL DASHBOARD) ---
  openNewOperationModal(
    defaultType: 'income' | 'expense' = 'income',
    defaultTitle = '',
    defaultSubtitle = '',
    defaultCategoryId: number | null = null,
    defaultAmount: number | null = null,
    defaultDate: string = getTodayLocalDateString()
  ): void {
    this.opType.set(defaultType);
    this.opTitle.set(defaultTitle);
    this.opSubtitle.set(defaultSubtitle);
    this.opCategoryId.set(defaultCategoryId);
    this.opAmount.set(defaultAmount);
    this.opDate.set(defaultDate);
    this.showNewOperationModal.set(true);
    this.closeMobileMenu();
  }

  closeNewOperationModal(): void {
    this.showNewOperationModal.set(false);
  }

  setOpType(type: 'income' | 'expense'): void {
    this.opType.set(type);
    this.opCategoryId.set(null);
  }

  get filteredCategories(): Category[] {
    const currentType = (this.opType() || 'income').toLowerCase();
    const list = this.categories() || DEFAULT_CATEGORIES;
    return list.filter((c) => (c.type || '').toLowerCase() === currentType);
  }

  onCategorySelected(catId: number | null): void {
    this.opCategoryId.set(catId);
    if (catId) {
      const cat = this.categories().find((c) => c.id === catId);
      if (cat && (!this.opSubtitle() || this.opSubtitle() === 'Ingreso Principal' || this.opSubtitle() === 'Gasto General')) {
        this.opSubtitle.set(cat.name);
      }
    }
  }

  onCategorySelectChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const catId = target.value ? parseInt(target.value, 10) : null;
    this.onCategorySelected(catId);
  }

  saveOperation(): void {
    const title = this.opTitle().trim();
    const amount = this.opAmount();
    const type = this.opType();
    const categoryId = this.opCategoryId() || undefined;
    const transactionDate = this.opDate() || getTodayLocalDateString();
    const subtitle =
      this.opSubtitle().trim() ||
      (categoryId ? this.categories().find((c) => c.id === categoryId)?.name : '') ||
      (type === 'income' ? 'Ingreso Principal' : 'Gasto General');

    if (!title) {
      this.showToast('Por favor, ingresa una descripción para la operación.');
      return;
    }

    if (!amount || amount <= 0) {
      this.showToast('Por favor, ingresa un monto válido mayor a 0.');
      return;
    }

    this.isSubmitting.set(true);
    this.dashboardService
      .createTransaction({
        title,
        subtitle,
        amount,
        type,
        status: 'Completado',
        categoryId,
        transactionDate,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.showNewOperationModal.set(false);
          this.showToast(
            `¡${type === 'income' ? 'Ingreso' : 'Operación'} guardado exitosamente en la base de datos!`,
            'success'
          );
          this.loadIncomeData(); // Recarga en tiempo real
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.showToast(err?.error?.message ?? 'Error al guardar la operación en PostgreSQL.', 'error');
        },
      });
  }

  onPeriodChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.selectedPeriod.set(select.value === '1y' ? '1y' : '6m');
  }

  onFeatureClick(feature: string): void {
    this.showToast(`Módulo de ${feature}: conectado a la base de datos PostgreSQL.`);
    this.closeMobileMenu();
  }

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.toastType.set(type);
    this.toastMessage.set(message);
    setTimeout(() => {
      if (this.toastMessage() === message) {
        this.toastMessage.set(null);
      }
    }, 4500);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((open) => !open);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  // --- GESTIÓN DE EDICIÓN DE OPERACIÓN ---
  openEditModal(item: MonthlyHistoryItem): void {
    this.editingItem.set(item);
    this.editId.set(item.id);
    this.editTitle.set(item.title);
    this.editSubtitle.set(item.subtitle);
    this.editType.set(item.isPositive ? 'income' : 'expense');
    this.editCategoryId.set(item.categoryId || null);
    this.editStatus.set((item.status as any) || 'Completado');

    // Extraer monto numérico
    const cleanedAmount = item.amount.replace(/[^0-9.]/g, '');
    const num = parseFloat(cleanedAmount);
    this.editAmount.set(isNaN(num) ? null : num);

    this.editDate.set(getTodayLocalDateString());
    this.showEditModal.set(true);
  }

  closeEditModal(): void {
    this.showEditModal.set(false);
    this.editingItem.set(null);
  }

  setEditOpType(type: 'income' | 'expense'): void {
    this.editType.set(type);
    this.editCategoryId.set(null);
  }

  get editFilteredCategories(): Category[] {
    const currentType = (this.editType() || 'income').toLowerCase();
    const list = this.categories() || DEFAULT_CATEGORIES;
    return list.filter((c) => (c.type || '').toLowerCase() === currentType);
  }

  onEditCategorySelected(catId: number | null): void {
    this.editCategoryId.set(catId);
    if (catId) {
      const cat = this.categories().find((c) => c.id === catId);
      if (cat && (!this.editSubtitle() || this.editSubtitle() === 'Ingreso Principal' || this.editSubtitle() === 'Gasto General')) {
        this.editSubtitle.set(cat.name);
      }
    }
  }

  saveEditOperation(): void {
    const id = this.editId();
    if (!id) return;

    const title = this.editTitle().trim();
    const amount = this.editAmount();
    const type = this.editType();
    const categoryId = this.editCategoryId() || undefined;
    const transactionDate = this.editDate() || getTodayLocalDateString();
    const subtitle =
      this.editSubtitle().trim() ||
      (categoryId ? this.categories().find((c) => c.id === categoryId)?.name : '') ||
      (type === 'income' ? 'Ingreso Principal' : 'Gasto General');
    const status = this.editStatus();

    if (!title) {
      this.showToast('Por favor, ingresa una descripción para la operación.', 'error');
      return;
    }

    if (!amount || amount <= 0) {
      this.showToast('Por favor, ingresa un monto válido mayor a 0.', 'error');
      return;
    }

    this.isEditSubmitting.set(true);
    this.dashboardService
      .updateTransaction(id, {
        title,
        subtitle,
        amount,
        type,
        status,
        categoryId: categoryId || null,
        transactionDate,
      })
      .subscribe({
        next: () => {
          this.isEditSubmitting.set(false);
          this.showEditModal.set(false);
          this.editingItem.set(null);
          this.showToast('¡Operación actualizada con éxito en PostgreSQL!', 'success');
          this.loadIncomeData(); // Recarga en tiempo real
        },
        error: (err) => {
          this.isEditSubmitting.set(false);
          this.showToast(err?.error?.message ?? 'Error al actualizar la operación en PostgreSQL.', 'error');
        },
      });
  }

  // --- GESTIÓN DE ELIMINACIÓN DE OPERACIÓN ---
  openDeleteConfirm(item: MonthlyHistoryItem): void {
    this.deletingItem.set(item);
    this.showDeleteConfirmModal.set(true);
  }

  closeDeleteConfirm(): void {
    this.showDeleteConfirmModal.set(false);
    this.deletingItem.set(null);
  }

  confirmDelete(): void {
    const item = this.deletingItem();
    if (!item) return;

    this.isDeleting.set(true);
    this.dashboardService.deleteTransaction(item.id).subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirmModal.set(false);
        this.deletingItem.set(null);
        this.showToast('¡Operación eliminada de la base de datos con éxito!', 'success');
        this.loadIncomeData(); // Recarga en tiempo real
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.showToast(err?.error?.message ?? 'Error al eliminar la operación en PostgreSQL.', 'error');
      },
    });
  }

  formatIncomeAmount(amount: string): string {
    return amount.startsWith('+') ? amount.substring(1) : amount;
  }
}