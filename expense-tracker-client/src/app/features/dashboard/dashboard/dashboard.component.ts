import { Component, type OnInit, ViewChild, ChangeDetectorRef, ElementRef, HostListener } from "@angular/core"
import { ExpenseService } from "../../../core/services/expense.service"
import { ExpenseSummary, Expense, CategoryBreakdown, MonthlyTotal } from "../../../core/models/expense.model"
import { ChartConfiguration } from "chart.js"
import { BaseChartDirective } from "ng2-charts"
import { Router } from "@angular/router"

interface PaginatedResponse<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

// Category mappings
const CATEGORY_ICON_MAP: Record<string, string> = {
  'default': 'tag',
  '46396d68-5708-4bc9-b04e-629047ac1162': 'car', // Transportation
  'bca3f16d-8ec9-43a2-868f-19c58a7ef3c0': 'film', // Entertainment
  '53107c29-360f-4ed8-b2fd-1ebfa74c0214': 'bolt', // Utilities
  'f8fd6e59-e4c0-44aa-80df-9bbaebb2078a': 'medkit', // Healthcare
  'b5e67758-4fe3-4788-8bd6-6593d1b3ac03': 'book', // Education
};

const CATEGORY_COLOR_MAP: Record<string, string> = {
  'default': 'bg-secondary',
  '46396d68-5708-4bc9-b04e-629047ac1162': 'bg-info', // Transportation
  'bca3f16d-8ec9-43a2-868f-19c58a7ef3c0': 'bg-purple', // Entertainment
  '53107c29-360f-4ed8-b2fd-1ebfa74c0214': 'bg-warning', // Utilities
  'f8fd6e59-e4c0-44aa-80df-9bbaebb2078a': 'bg-danger', // Healthcare
  'b5e67758-4fe3-4788-8bd6-6593d1b3ac03': 'bg-success', // Education
};

// Color palette for charts
const CHART_COLOR_PALETTE: string[] = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f97316", 
  "#eab308", "#22c55e", "#14b8a6", "#0ea5e9", "#6366f1"
];

// Date range options
const DATE_RANGE_TEXT_MAP: Record<string, string> = {
  "week": "Last 7 days",
  "month": "Last 30 days",
  "quarter": "Last 3 months",
  "halfYear": "Last 6 months", 
  "year": "Last 12 months"
};

// Chart animations
const CHART_ANIMATION = {
  duration: 1000,
  easing: 'easeOutQuart' as const
};

@Component({
  selector: "app-dashboard",
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.scss"],
})
export class DashboardComponent implements OnInit {
  @ViewChild(BaseChartDirective) chart: BaseChartDirective | undefined;
  
  // Dashboard data
  summary: ExpenseSummary | undefined;
  isLoading = true;
  recentExpenses: Expense[] = []
  totalExpenses = 0
  currentPage = 1
  totalPages = 1
  pageSize = 5
  currentDateRange: "week" | "month" | "quarter" | "halfYear" | "year" = "halfYear";
  isDropdownOpen = false;
  
  // Category mapping
  private categoryColorChartMap: {[key: string]: string} = {};

  // Use constants for static data
  readonly colorPalette = CHART_COLOR_PALETTE;

  // Chart configurations
  monthlyChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [0],
        backgroundColor: this.colorPalette[0],
        hoverBackgroundColor: this.adjustColorBrightness(this.colorPalette[0], -15),
        borderColor: this.colorPalette[0],
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 'flex',
        maxBarThickness: 35
      },
    ],
  }

  monthlyChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'x',
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: {
            size: 10
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: {
            size: 10
          },
          callback: (value) => this.formatCurrency(value as number, 0)
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        callbacks: {
          title: (items) => items[0].label,
          label: (context) => this.formatCurrency(context.raw as number)
        }
      }
    },
    animation: CHART_ANIMATION
  }

  categoryChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['No Data'],
    datasets: [
      {
        data: [0],
        backgroundColor: this.colorPalette,
        hoverBackgroundColor: this.colorPalette.map(color => this.adjustColorBrightness(color, -15)),
        hoverBorderColor: '#ffffff',
        hoverBorderWidth: 2,
        borderWidth: 1,
        borderColor: '#ffffff'
      },
    ],
  }

  categoryChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 15,
          font: {
            size: 11
          },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels?.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i] as number;
                const backgroundColor = typeof dataset.backgroundColor === 'object' && 
                  Array.isArray(dataset.backgroundColor) ? 
                  dataset.backgroundColor[i] as string : 
                  '#6366f1';
                
                return {
                  text: `${label} (${this.formatCurrency(value, 0)})`,
                  fillStyle: backgroundColor,
                  strokeStyle: '#fff',
                  lineWidth: 1,
                  hidden: false,
                  index: i
                };
              });
            }
            return [];
          }
        }
      },
      tooltip: {
        enabled: true,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw as number;
            const formattedValue = this.formatCurrency(value);
            
            const dataset = context.dataset;
            const total = dataset.data.reduce((sum: number, val: number) => sum + val, 0);
            const percentage = Math.round((value / total) * 100);
            
            return `${label}: ${formattedValue} (${percentage}%)`;
          }
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      ...CHART_ANIMATION
    }
  }

  constructor(
    private expenseService: ExpenseService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {
  }

  getCategoryIcon(categoryId: string | undefined): string {
    return !categoryId ? CATEGORY_ICON_MAP['default'] : (CATEGORY_ICON_MAP[categoryId] || CATEGORY_ICON_MAP['default']);
  }

  getCategoryColorClass(categoryId: string | undefined): string {
    return !categoryId ? CATEGORY_COLOR_MAP['default'] : (CATEGORY_COLOR_MAP[categoryId] || CATEGORY_COLOR_MAP['default']);
  }

  ngOnInit(): void {
    this.resetChartData();
    this.loadDashboardData()
  }

  getMonthlyAverage(): number {
    if (!this.summary?.monthlyTotals?.length) return 0
    const total = this.summary.monthlyTotals.reduce((sum, month) => sum + month.amount, 0)
    return total / this.summary.monthlyTotals.length
  }

  setDateRange(range: "week" | "month" | "quarter" | "halfYear" | "year"): void {
    this.currentDateRange = range
    this.loadDashboardData()
  }

  getDateRangeText(): string {
    return DATE_RANGE_TEXT_MAP[this.currentDateRange] || DATE_RANGE_TEXT_MAP["halfYear"];
  }

  viewAllExpenses(): void {
    this.router.navigate(['/expenses']);
  }

  navigateToExpensesByCategory(categoryName: string): void {
    this.router.navigate(['/expenses'], { 
      queryParams: { category: categoryName } 
    });
  }

  navigateToExpensesByMonth(monthYear: string): void {
    const parts = monthYear.split(' ');
    if (parts.length === 2) {
      const month = this.getMonthNumber(parts[0]);
      const year = parseInt(parts[1]);
      
      if (!isNaN(month) && !isNaN(year)) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0); // Last day of month
        
        this.router.navigate(['/expenses'], { 
          queryParams: { 
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
          } 
        });
      }
    }
  }

  private getMonthNumber(monthAbbr: string): number {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(monthAbbr) + 1;
  }

  private getDateRangeForFilter(): { startDate: Date; endDate: Date } {
    const endDate = new Date()
    const startDate = new Date()

    switch (this.currentDateRange) {
      case "week": startDate.setDate(endDate.getDate() - 7); break
      case "month": startDate.setDate(endDate.getDate() - 30); break
      case "quarter": startDate.setMonth(endDate.getMonth() - 3); break
      case "halfYear": startDate.setMonth(endDate.getMonth() - 6); break
      case "year": startDate.setFullYear(endDate.getFullYear() - 1); break
    }

    return { startDate, endDate }
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    const { startDate, endDate } = this.getDateRangeForFilter();

    this.resetChartData();

    this.expenseService.getExpenseSummary(startDate, endDate).subscribe({
      next: (summary) => {
        this.isLoading = false;
        this.summary = summary;

        if (!summary) return;

        if (!summary.categoryBreakdown && summary.categorySummaries?.length) {
          summary.categoryBreakdown = summary.categorySummaries.map(cat => ({
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            amount: cat.totalAmount,
            percentage: cat.percentage
          }));
        }

        if (summary.monthlyTotals?.length) {
          this.updateMonthlyChart(summary.monthlyTotals);
        }

        if (summary.categoryBreakdown?.length) {
          this.updateCategoryChart(summary.categoryBreakdown);
        }

        this.loadRecentExpenses(startDate, endDate);
      },
      error: (error) => {
        this.isLoading = false;
      }
    });
  }

  private updateMonthlyChart(monthlyTotals: MonthlyTotal[] | undefined): void {
    if (!monthlyTotals?.length) {
      this.setNoDataChart(this.monthlyChartData);
      return;
    }
    
    const sortedMonthlyTotals = [...monthlyTotals].sort((a, b) => 
      new Date(a.year, a.month - 1).getTime() - new Date(b.year, b.month - 1).getTime()
    );
    
    const filledMonthlyTotals = this.fillMissingMonths(sortedMonthlyTotals);
    
    this.monthlyChartData.labels = filledMonthlyTotals.map((m) =>
      new Date(m.year, m.month - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    );
    this.monthlyChartData.datasets[0].data = filledMonthlyTotals.map((m) => m.amount);
    
    const maxAmount = Math.max(...filledMonthlyTotals.map(m => m.amount));
    const backgroundColors: string[] = filledMonthlyTotals.map((m) => {
      const colorIndex = Math.min(Math.floor((m.amount / maxAmount) * this.colorPalette.length), this.colorPalette.length - 1);
      return this.colorPalette[colorIndex] || this.colorPalette[0];
    });
    
    this.monthlyChartData.datasets[0].backgroundColor = backgroundColors;
    this.monthlyChartData.datasets[0].hoverBackgroundColor = backgroundColors.map(color => this.adjustColorBrightness(color, -15));
    
    this.updateChart();
  }

  private fillMissingMonths(monthlyTotals: MonthlyTotal[]): MonthlyTotal[] {
    if (monthlyTotals.length <= 1) return monthlyTotals;
    
    const result: MonthlyTotal[] = [];
    const firstMonth = monthlyTotals[0];
    const lastMonth = monthlyTotals[monthlyTotals.length - 1];
    
    let currentDate = new Date(firstMonth.year, firstMonth.month - 1, 1);
    const endDate = new Date(lastMonth.year, lastMonth.month - 1, 1);
    
    const monthMap = new Map<string, MonthlyTotal>();
    monthlyTotals.forEach(m => {
      monthMap.set(`${m.year}-${m.month}`, m);
    });
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const key = `${year}-${month}`;
      
      if (monthMap.has(key)) {
        result.push(monthMap.get(key)!);
      } else {
        result.push({ month, year, amount: 0 });
      }
      
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return result;
  }

  private updateCategoryChart(categoryBreakdown: CategoryBreakdown[] | undefined): void {
    if (!categoryBreakdown?.length) {
      this.setNoDataChart(this.categoryChartData);
      return;
    }
    
    const sortedCategories = [...categoryBreakdown].sort((a, b) => b.amount - a.amount);
    
    const topCategories = sortedCategories.slice(0, 7);
    const otherCategories = sortedCategories.slice(7);
    
    topCategories.forEach((category, index) => {
      if (!this.categoryColorChartMap[category.categoryId]) {
        this.categoryColorChartMap[category.categoryId] = this.colorPalette[index % this.colorPalette.length];
      }
    });
    
    let labels = topCategories.map(c => c.categoryName);
    let data = topCategories.map(c => c.amount);
    let colors = topCategories.map(c => this.categoryColorChartMap[c.categoryId] || this.colorPalette[0]);
    
    if (otherCategories.length > 0) {
      const othersTotal = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
      labels.push('Other');
      data.push(othersTotal);
      colors.push('#CBD5E1'); // Light gray for 'Other'
    }
    
    this.categoryChartData.labels = labels;
    this.categoryChartData.datasets[0].data = data;
    this.categoryChartData.datasets[0].backgroundColor = colors;
    
    this.updateChart();
  }

  private loadRecentExpenses(startDate: Date, endDate: Date): void {
    this.expenseService.getExpenses({
      startDate,
      endDate,
      pageSize: this.pageSize,
      page: this.currentPage,
      sortBy: 'date',
      sortDirection: 'desc'
    }).subscribe({
      next: (response: PaginatedResponse<Expense>) => {
        this.recentExpenses = response.items;
        this.totalExpenses = response.totalCount;
        this.currentPage = response.pageNumber;
        this.totalPages = response.totalPages;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  changePage(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }
    
    this.currentPage = page;
    const { startDate, endDate } = this.getDateRangeForFilter();
    this.loadRecentExpenses(startDate, endDate);
  }

  getPaginationArray(): number[] {
    const pages: number[] = [];
    const maxPagesToShow = 5;
    
    if (this.totalPages <= maxPagesToShow) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      let startPage = Math.max(1, this.currentPage - Math.floor(maxPagesToShow / 2));
      let endPage = Math.min(this.totalPages, startPage + maxPagesToShow - 1);
      
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  private resetChartData(): void {
    this.setNoDataChart(this.categoryChartData);
    this.setNoDataChart(this.monthlyChartData);
  }

  private setNoDataChart(chartData: ChartConfiguration['data']): void {
    chartData.labels = ['No Data'];
    chartData.datasets[0].data = [0];
    if (Array.isArray(chartData.datasets[0].backgroundColor)) {
      chartData.datasets[0].backgroundColor = [this.colorPalette[0]];
    } else {
      chartData.datasets[0].backgroundColor = this.colorPalette[0];
    }
    this.updateChart();
  }

  private updateChart(): void {
    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
      }
    });
  }

  private formatCurrency(value: number, fractionDigits: number = 2): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits
    }).format(value);
  }

  private adjustColorBrightness(hex: string, percent: number): string {
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const dropdownElement = this.elementRef.nativeElement.querySelector('.dropdown');
    if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
      this.isDropdownOpen = false;
    }
  }

  onCategoryChartClick(event: any): void {
    if (event?.active?.length > 0) {
      const index = event.active[0]?.index;
      if (index !== undefined && this.categoryChartData.labels && this.categoryChartData.labels[index]) {
        const category = this.categoryChartData.labels[index] as string;
        this.navigateToExpensesByCategory(category);
      }
    }
  }

  onMonthlyChartClick(event: any): void {
    if (event?.active?.length > 0) {
      const index = event.active[0]?.index;
      if (index !== undefined && this.monthlyChartData.labels && this.monthlyChartData.labels[index]) {
        const month = this.monthlyChartData.labels[index] as string;
        this.navigateToExpensesByMonth(month);
      }
    }
  }
}
