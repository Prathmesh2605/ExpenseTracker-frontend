import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import {
  Expense,
  ExpenseCreateRequest,
  ExpenseUpdateRequest,
  ExpenseFilters,
  ExpenseSummary,
  Category,
  CategoryBreakdown,
  MonthlyTotal
} from '../models/expense.model';

/**
 * Mock service for testing the expense tracker UI without a backend
 * Use this for development and testing purposes only
 */
@Injectable({
  providedIn: 'root'
})
export class MockExpenseService {
  private categories: Category[] = [
    { id: '1', name: 'Food & Dining', icon: 'restaurant', color: '#FF5722' },
    { id: '2', name: 'Transportation', icon: 'directions_car', color: '#2196F3' },
    { id: '3', name: 'Shopping', icon: 'shopping_cart', color: '#9C27B0' },
    { id: '4', name: 'Entertainment', icon: 'movie', color: '#FFC107' },
    { id: '5', name: 'Utilities', icon: 'power', color: '#4CAF50' }
  ];

  private expenses: Expense[] = [
    {
      id: '1',
      title: 'Grocery Shopping',
      amount: 85.75,
      date: new Date(2025, 2, 15),
      categoryId: '1',
      category: this.categories[0],
      description: 'Weekly grocery shopping',
      userId: 'user1',
      createdAt: new Date(2025, 2, 15),
      updatedAt: new Date(2025, 2, 15)
    },
    {
      id: '2',
      title: 'Gas',
      amount: 45.50,
      date: new Date(2025, 2, 14),
      categoryId: '2',
      category: this.categories[1],
      description: 'Filled up the tank',
      userId: 'user1',
      createdAt: new Date(2025, 2, 14),
      updatedAt: new Date(2025, 2, 14)
    },
    {
      id: '3',
      title: 'Movie Tickets',
      amount: 32.00,
      date: new Date(2025, 2, 10),
      categoryId: '4',
      category: this.categories[3],
      description: 'Weekend movie',
      userId: 'user1',
      createdAt: new Date(2025, 2, 10),
      updatedAt: new Date(2025, 2, 10)
    },
    {
      id: '4',
      title: 'Electricity Bill',
      amount: 120.35,
      date: new Date(2025, 2, 5),
      categoryId: '5',
      category: this.categories[4],
      description: 'Monthly electricity bill',
      userId: 'user1',
      createdAt: new Date(2025, 2, 5),
      updatedAt: new Date(2025, 2, 5)
    },
    {
      id: '5',
      title: 'New Shoes',
      amount: 89.99,
      date: new Date(2025, 2, 3),
      categoryId: '3',
      category: this.categories[2],
      description: 'Running shoes',
      userId: 'user1',
      createdAt: new Date(2025, 2, 3),
      updatedAt: new Date(2025, 2, 3)
    },
    {
      id: '6',
      title: 'Dinner Out',
      amount: 65.20,
      date: new Date(2025, 1, 28),
      categoryId: '1',
      category: this.categories[0],
      description: 'Dinner with friends',
      userId: 'user1',
      createdAt: new Date(2025, 1, 28),
      updatedAt: new Date(2025, 1, 28)
    },
    {
      id: '7',
      title: 'Uber Ride',
      amount: 22.50,
      date: new Date(2025, 1, 25),
      categoryId: '2',
      category: this.categories[1],
      description: 'Ride to airport',
      userId: 'user1',
      createdAt: new Date(2025, 1, 25),
      updatedAt: new Date(2025, 1, 25)
    },
    {
      id: '8',
      title: 'Internet Bill',
      amount: 75.00,
      date: new Date(2025, 1, 20),
      categoryId: '5',
      category: this.categories[4],
      description: 'Monthly internet bill',
      userId: 'user1',
      createdAt: new Date(2025, 1, 20),
      updatedAt: new Date(2025, 1, 20)
    }
  ];

  constructor() { }

  // Expense CRUD operations
  getExpenses(filters: ExpenseFilters): Observable<Expense[]> {
    let filteredExpenses = [...this.expenses];
    
    // Apply filters
    if (filters.startDate) {
      filteredExpenses = filteredExpenses.filter(e => new Date(e.date) >= filters.startDate!);
    }
    if (filters.endDate) {
      filteredExpenses = filteredExpenses.filter(e => new Date(e.date) <= filters.endDate!);
    }
    if (filters.categoryIds?.length) {
      filteredExpenses = filteredExpenses.filter(e => filters.categoryIds!.includes(e.categoryId));
    }
    if (filters.minAmount) {
      filteredExpenses = filteredExpenses.filter(e => e.amount >= filters.minAmount!);
    }
    if (filters.maxAmount) {
      filteredExpenses = filteredExpenses.filter(e => e.amount <= filters.maxAmount!);
    }
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filteredExpenses = filteredExpenses.filter(e => 
        e.title.toLowerCase().includes(term) || 
        e.description?.toLowerCase().includes(term)
      );
    }

    // Sort
    if (filters.sortBy) {
      const direction = filters.sortDirection === 'asc' ? 1 : -1;
      filteredExpenses.sort((a, b) => {
        if (filters.sortBy === 'date') {
          return direction * (new Date(a.date).getTime() - new Date(b.date).getTime());
        } else if (filters.sortBy === 'amount') {
          return direction * (a.amount - b.amount);
        } else if (filters.sortBy === 'title') {
          return direction * a.title.localeCompare(b.title);
        }
        return 0;
      });
    }

    // Pagination
    if (filters.page !== undefined && filters.pageSize) {
      const start = (filters.page - 1) * filters.pageSize;
      const end = start + filters.pageSize;
      filteredExpenses = filteredExpenses.slice(start, end);
    }

    return of(filteredExpenses).pipe(delay(500)); // Simulate network delay
  }

  getExpenseById(id: string): Observable<Expense> {
    const expense = this.expenses.find(e => e.id === id);
    if (!expense) {
      throw new Error('Expense not found');
    }
    return of(expense).pipe(delay(300));
  }

  createExpense(request: ExpenseCreateRequest): Observable<Expense> {
    const category = this.categories.find(c => c.id === request.categoryId);
    const newExpense: Expense = {
      id: (this.expenses.length + 1).toString(),
      title: request.title,
      amount: request.amount,
      date: request.date,
      categoryId: request.categoryId,
      category: category,
      description: request.description,
      userId: 'user1',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.expenses.push(newExpense);
    return of(newExpense).pipe(delay(500));
  }

  updateExpense(request: ExpenseUpdateRequest): Observable<Expense> {
    const index = this.expenses.findIndex(e => e.id === request.id);
    if (index === -1) {
      throw new Error('Expense not found');
    }
    
    const category = this.categories.find(c => c.id === request.categoryId);
    const updatedExpense: Expense = {
      ...this.expenses[index],
      title: request.title,
      amount: request.amount,
      date: request.date,
      categoryId: request.categoryId,
      category: category,
      description: request.description,
      updatedAt: new Date()
    };
    
    this.expenses[index] = updatedExpense;
    return of(updatedExpense).pipe(delay(500));
  }

  deleteExpense(id: string): Observable<void> {
    const index = this.expenses.findIndex(e => e.id === id);
    if (index === -1) {
      throw new Error('Expense not found');
    }
    this.expenses.splice(index, 1);
    return of(undefined).pipe(delay(500));
  }

  // Category operations
  getCategories(): Observable<Category[]> {
    return of(this.categories).pipe(delay(300));
  }

  // Analytics
  getExpenseSummary(startDate?: Date, endDate?: Date): Observable<ExpenseSummary> {
    let filteredExpenses = [...this.expenses];
    
    if (startDate) {
      filteredExpenses = filteredExpenses.filter(e => new Date(e.date) >= startDate);
    }
    if (endDate) {
      filteredExpenses = filteredExpenses.filter(e => new Date(e.date) <= endDate);
    }

    // Calculate summary statistics
    const amounts = filteredExpenses.map(e => e.amount);
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);
    const averageAmount = totalAmount / (amounts.length || 1);

    // Calculate monthly totals
    const monthlyTotals: MonthlyTotal[] = [];
    const monthMap = new Map<string, number>();

    filteredExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const key = `${date.getFullYear()}-${date.getMonth() + 1}`;
      const currentAmount = monthMap.get(key) || 0;
      monthMap.set(key, currentAmount + expense.amount);
    });

    Array.from(monthMap.entries()).forEach(([key, amount]) => {
      const [year, month] = key.split('-').map(Number);
      monthlyTotals.push({ year, month, amount });
    });

    // Calculate category breakdown
    const categoryBreakdown: CategoryBreakdown[] = [];
    const categoryMap = new Map<string, { amount: number, name: string }>();

    filteredExpenses.forEach(expense => {
      const key = expense.categoryId;
      const current = categoryMap.get(key) || { amount: 0, name: expense.category?.name || 'Unknown' };
      categoryMap.set(key, {
        amount: current.amount + expense.amount,
        name: current.name
      });
    });

    Array.from(categoryMap.entries()).forEach(([categoryId, data]) => {
      categoryBreakdown.push({
        categoryId,
        categoryName: data.name,
        amount: data.amount,
        percentage: (data.amount / totalAmount) * 100
      });
    });

    // Get recent expenses
    const recentExpenses = [...filteredExpenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);

    return of({
      totalAmount,
      totalCount: filteredExpenses.length,
      averageAmount,
      monthlyTotals,
      categoryBreakdown,
      categorySummaries: categoryBreakdown.map(c => ({
        categoryId: c.categoryId,
        categoryName: c.categoryName,
        totalAmount: c.amount,
        count: filteredExpenses.filter(e => e.categoryId === c.categoryId).length,
        percentage: c.percentage
      })),
      recentExpenses
    });
  }
}
