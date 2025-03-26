export interface ExpenseFilter {
  startDate: string | null;
  endDate: string | null;
  categoryIds: number[];
  minAmount: number | null;
  maxAmount: number | null;
  description: string;
  pageIndex: number;
  pageSize: number;
  sortColumn: string;
  sortDirection: string;
}
