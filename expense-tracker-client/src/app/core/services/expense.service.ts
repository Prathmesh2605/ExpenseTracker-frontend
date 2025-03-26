import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
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
    // Create a request body object that matches the backend API expectations
    const requestBody = {
      pageNumber: filters.page || 1,
      pageSize: filters.pageSize || 10,
      sortBy: filters.sortBy || 'date',
      sortDirection: filters.sortDirection || 'desc',
      categoryIds: filters.categoryIds?.map(id => id) || [],
      startDate: filters.startDate ? new Date(filters.startDate).toISOString() : null,
      endDate: filters.endDate ? new Date(filters.endDate).toISOString() : null,
      minAmount: filters.minAmount || null,
      maxAmount: filters.maxAmount || null,
      searchTerm: filters.searchTerm || filters.description || null
    };

    return this.http.post<PaginatedResponse<Expense>>(`${this.apiUrl}/expenses`, requestBody, {
      headers: this.getAuthHeaders()
    });
  }

  getExpenseById(id: string): Observable<Expense> {
    const headers = this.getAuthHeaders();

    return this.http.get<Expense>(`${this.apiUrl}/expenses/${id}`, { headers });
  }

  createExpense(request: ExpenseCreateRequest): Observable<Expense> {
    return this.http.post<Expense>(`${this.apiUrl}/expenses/create`, request, {
      headers: this.getAuthHeaders()
    });
  }

  updateExpense(request: ExpenseUpdateRequest): Observable<Expense> {
    const headers = this.getAuthHeaders();
    return this.http.put<Expense>(`${this.apiUrl}/expenses/${request.id}`, request, { headers });
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
      params = params.set('startDate', new Date(startDate).toISOString());
    }
    if (endDate) {
      params = params.set('endDate', new Date(endDate).toISOString());
    }

    const headers = this.getAuthHeaders();

    return this.http.get<ExpenseSummary>(`${this.apiUrl}/reports/summary`, { 
      params,
      headers
    });
  }
}
