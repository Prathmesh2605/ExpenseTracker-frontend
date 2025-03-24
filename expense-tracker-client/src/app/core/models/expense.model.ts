export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: Date;
  categoryId: string;
  category?: Category;
  description?: string;
  receiptUrl?: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface ExpenseCreateRequest {
  title: string;
  amount: number;
  date: Date;
  categoryId: string;
  description?: string;
  receipt?: File;
}

export interface ExpenseUpdateRequest extends ExpenseCreateRequest {
  id: string;
}

export interface ExpenseFilters {
  startDate?: Date;
  endDate?: Date;
  categoryIds?: string[];
  minAmount?: number;
  maxAmount?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface ExpenseSummary {
  totalAmount: number;
  totalCount: number;
  averageAmount: number;
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
