import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  DashboardSummary,
  CreateTransactionDto,
  UpdateTransactionDto,
  Category,
  QuickExpense,
  CreateQuickExpenseDto,
} from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/dashboard/summary`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/dashboard/categories`);
  }

  getQuickExpenses(): Observable<QuickExpense[]> {
    return this.http.get<QuickExpense[]>(`${this.apiUrl}/dashboard/quick-expenses`);
  }

  createQuickExpense(dto: CreateQuickExpenseDto): Observable<QuickExpense> {
    return this.http.post<QuickExpense>(`${this.apiUrl}/dashboard/quick-expenses`, dto);
  }

  createTransaction(dto: CreateTransactionDto): Observable<any> {
    return this.http.post(`${this.apiUrl}/dashboard/transactions`, dto);
  }

  updateTransaction(id: string | number, dto: UpdateTransactionDto): Observable<any> {
    return this.http.patch(`${this.apiUrl}/dashboard/transactions/${id}`, dto);
  }

  deleteTransaction(id: string | number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/dashboard/transactions/${id}`);
  }
}

