export interface Expense {
  id: string;
  amount: number;
  description: string;
  date: Date;
  type: 'Income' | 'Expense';
  currency: string;
  categoryId: string;
  categoryName: string;
  isRecurring: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface ExpenseCreateRequest {
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  type: 'Income' | 'Expense';
  currency: string;
  isRecurring: boolean;
  notes?: string;
  recurrencePattern?: string;
  receipt?: File;
}

export interface ExpenseUpdateRequest extends ExpenseCreateRequest {
  id: string;
}

export interface ExpenseFilters {
  startDate?: Date | string;
  endDate?: Date | string;
  categoryIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  description?: string;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ExpenseSummary {
  totalIncomeAmount: number;
  totalExpenseAmount: number;
  totalCount: number;
  averageIncomeAmount: number;
  averageExpenseAmount: number;
  monthlyTotals: MonthlyTotal[];
  categoryBreakdown: CategoryBreakdown[];
  categorySummaries: CategorySummary[];
  recentExpenses: Expense[];
}

export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  totalAmount: number;
  count: number;
  percentage: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
}

export interface MonthlyTotal {
  month: number;
  year: number;
  amount: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
