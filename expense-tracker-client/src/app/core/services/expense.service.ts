import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Expense,
  ExpenseCreateRequest,
  ExpenseUpdateRequest,
  ExpenseFilters,
  ExpenseSummary,
  Category,
  PaginatedResponse
} from '../models/expense.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ExpenseService {
  private readonly apiUrl = `${environment.apiUrl}/api`;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeaders(): HttpHeaders {
    // Get the token from AuthService instead of directly from localStorage
    const token = this.authService.getStoredToken();
    
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Expense CRUD operations
  getExpenses(filters: ExpenseFilters): Observable<PaginatedResponse<Expense>> {
    let params = new HttpParams();
    
    if (filters.startDate) {
      params = params.set('startDate', filters.startDate.toISOString());
    }
    if (filters.endDate) {
      params = params.set('endDate', filters.endDate.toISOString());
    }
    if (filters.categoryIds?.length) {
      filters.categoryIds.forEach(id => {
        params = params.append('categoryIds', id);
      });
    }
    if (filters.page) {
      params = params.set('pageNumber', filters.page.toString());
    }
    if (filters.pageSize) {
      params = params.set('pageSize', filters.pageSize.toString());
    }
    if (filters.sortBy) {
      params = params.set('sortBy', filters.sortBy);
    }
    if (filters.sortDirection) {
      params = params.set('sortDirection', filters.sortDirection);
    }

    return this.http.get<PaginatedResponse<Expense>>(`${this.apiUrl}/expenses`, {
      headers: this.getAuthHeaders(),
      params
    });
  }

  getExpenseById(id: string): Observable<Expense> {
    const headers = this.getAuthHeaders();

    return this.http.get<Expense>(`${this.apiUrl}/expenses/${id}`, { headers });
  }

  createExpense(request: ExpenseCreateRequest): Observable<Expense> {
    const formData = new FormData();
    formData.append('description', request.description);
    formData.append('amount', request.amount.toString());
    formData.append('date', request.date.toISOString());
    formData.append('categoryId', request.categoryId);
    
    if (request.note) {
      formData.append('note', request.note);
    }
    if (request.receipt) {
      formData.append('receipt', request.receipt);
    }

    const headers = this.getAuthHeaders();

    return this.http.post<Expense>(`${this.apiUrl}/expenses`, formData, { headers });
  }

  updateExpense(request: ExpenseUpdateRequest): Observable<Expense> {
    const formData = new FormData();
    formData.append('description', request.description);
    formData.append('amount', request.amount.toString());
    formData.append('date', request.date.toISOString());
    formData.append('categoryId', request.categoryId);
    
    if (request.note) {
      formData.append('note', request.note);
    }
    if (request.receipt) {
      formData.append('receipt', request.receipt);
    }

    const headers = this.getAuthHeaders();

    return this.http.put<Expense>(`${this.apiUrl}/expenses/${request.id}`, formData, { headers });
  }

  deleteExpense(id: string): Observable<void> {
    const headers = this.getAuthHeaders();

    return this.http.delete<void>(`${this.apiUrl}/expenses/${id}`, { headers });
  }

  // Category operations
  getCategories(): Observable<Category[]> {
    const headers = this.getAuthHeaders();

    return this.http.get<Category[]>(`${this.apiUrl}/categories`, { headers });
  }

  // Analytics
  getExpenseSummary(startDate?: Date, endDate?: Date): Observable<ExpenseSummary> {
    let params = new HttpParams();
    
    if (startDate) {
      params = params.set('startDate', startDate.toISOString());
    }
    if (endDate) {
      params = params.set('endDate', endDate.toISOString());
    }

    const headers = this.getAuthHeaders();

    return this.http.get<ExpenseSummary>(`${this.apiUrl}/reports/summary`, { 
      params,
      headers
    });
  }
}
