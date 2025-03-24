import { Component, type OnInit, ViewChild } from "@angular/core"
import { ExpenseService } from "../../../core/services/expense.service"
import { ExpenseSummary, Expense, CategoryBreakdown, MonthlyTotal } from "../../../core/models/expense.model"
import { ChartConfiguration, ChartOptions, Chart } from "chart.js"
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
  currentDateRange: "week" | "month" | "quarter" | "halfYear" | "year" = "halfYear";
  
  // Category color mapping
  categoryColorMap = new Map<string, string>();
  
  // Color palette for charts (typed as string array)
  colorPalette: string[] = [
    "#6366f1", // Indigo
    "#8b5cf6", // Violet
    "#ec4899", // Pink
    "#ef4444", // Red
    "#f97316", // Orange
    "#eab308", // Yellow
    "#22c55e", // Green
    "#14b8a6", // Teal
    "#0ea5e9", // Sky
    "#6366f1", // Indigo (repeat)
    "#8b5cf6", // Violet (repeat)
    "#ec4899", // Pink (repeat)
  ];

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
          callback: (value) => {
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value as number);
          }
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
          title: (items) => {
            return items[0].label;
          },
          label: (context) => {
            const value = context.raw as number;
            return new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2
            }).format(value);
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeOutQuart'
    }
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
                // Use type assertion for backgroundColor
                const backgroundColor = typeof dataset.backgroundColor === 'object' && 
                  Array.isArray(dataset.backgroundColor) ? 
                  dataset.backgroundColor[i] as string : 
                  '#6366f1';
                
                // Format the label with amount
                const formattedValue = new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }).format(value);
                
                return {
                  text: `${label} (${formattedValue})`,
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
            const formattedValue = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2
            }).format(value);
            
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
      duration: 1000,
      easing: 'easeOutQuart'
    }
  }

  constructor(
    private expenseService: ExpenseService,
    private router: Router
  ) {}

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
    switch (this.currentDateRange) {
      case "week":
        return "Last 7 days"
      case "month":
        return "Last 30 days"
      case "quarter":
        return "Last 3 months"
      case "halfYear":
        return "Last 6 months"
      case "year":
        return "Last 12 months"
      default:
        return "Last 6 months"
    }
  }

  getCategoryIcon(icon: string | undefined): string {
    // Map Material icons to FontAwesome icons
    const iconMap: { [key: string]: string } = {
      restaurant: "utensils",
      directions_car: "car",
      shopping_cart: "shopping-cart",
      movie: "film",
      power: "bolt",
      category: "tag",
      home: "home",
      flight: "plane",
      hotel: "hotel",
      school: "graduation-cap",
      medical_services: "medkit",
      sports_esports: "gamepad",
      fitness_center: "dumbbell",
      pets: "paw",
      card_giftcard: "gift",
    }

    return icon ? iconMap[icon] || "tag" : "tag"
  }

  viewAllExpenses(): void {
    this.router.navigate(['/expenses']);
  }

  navigateToExpensesByCategory(categoryName: string): void {
    // Navigate to expenses filtered by category
    this.router.navigate(['/expenses'], { 
      queryParams: { category: categoryName } 
    });
  }

  navigateToExpensesByMonth(monthYear: string): void {
    // Parse month from format like "Jan 2023"
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
      case "week":
        startDate.setDate(endDate.getDate() - 7)
        break
      case "month":
        startDate.setDate(endDate.getDate() - 30)
        break
      case "quarter":
        startDate.setMonth(endDate.getMonth() - 3)
        break
      case "halfYear":
        startDate.setMonth(endDate.getMonth() - 6)
        break
      case "year":
        startDate.setFullYear(endDate.getFullYear() - 1)
        break
    }

    return { startDate, endDate }
  }

  private loadDashboardData(): void {
    this.isLoading = true;
    const { startDate, endDate } = this.getDateRangeForFilter();

    // Reset charts to initial state
    this.resetChartData();

    // Load expense summary
    this.expenseService.getExpenseSummary(startDate, endDate).subscribe({
      next: (summary) => {
        this.isLoading = false;
        this.summary = summary;

        // Check if there's data
        if (!summary) {
          return;
        }

        // Transform categorySummaries to categoryBreakdown format if needed
        if (!summary.categoryBreakdown && summary.categorySummaries?.length) {
          summary.categoryBreakdown = summary.categorySummaries.map(cat => ({
            categoryId: cat.categoryId,
            categoryName: cat.categoryName,
            amount: cat.totalAmount,
            percentage: cat.percentage
          }));
        }

        // Create mock monthlyTotals if missing (for demo purposes)
        if (!summary.monthlyTotals || summary.monthlyTotals.length === 0) {
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          // Create 6 months of mock data
          summary.monthlyTotals = [];
          for (let i = 5; i >= 0; i--) {
            const month = (currentMonth - i + 12) % 12 + 1; // Ensure month is 1-12
            const year = currentMonth - i < 0 ? currentYear - 1 : currentYear;
            
            // Generate a random amount that adds up to total
            const amount = summary.totalAmount / 6 * (0.8 + Math.random() * 0.4);
            
            summary.monthlyTotals.push({
              month,
              year,
              amount
            });
          }
        }

        // Update monthly chart data
        if (summary.monthlyTotals?.length) {
          this.updateMonthlyChart(summary.monthlyTotals);
        } else {
          console.warn('No monthly totals data available');
        }

        // Update category chart data
        if (summary.categoryBreakdown?.length) {
          this.updateCategoryChart(summary.categoryBreakdown);
        } else {
          console.warn('No category breakdown data available');
        }

        // Load recent expenses
        this.loadRecentExpenses(startDate, endDate);
      },
      error: (error) => {
        console.error("Error loading dashboard data:", error);
        this.isLoading = false;
      }
    });
  }

  private updateMonthlyChart(monthlyTotals: MonthlyTotal[] | undefined): void {
    if (!monthlyTotals?.length) {
      console.warn('No monthly totals data to chart');
      // Set a placeholder "No Data" label
      this.monthlyChartData.labels = ['No Data'];
      this.monthlyChartData.datasets[0].data = [0];
      
      // Force update if chart exists
      setTimeout(() => {
        if (this.chart?.chart) {
          this.chart.chart.update();
        }
      });
      return;
    }
    
    // Sort monthly totals by date
    const sortedMonthlyTotals = [...monthlyTotals].sort((a, b) => {
      return new Date(a.year, a.month - 1).getTime() - new Date(b.year, b.month - 1).getTime();
    });
    
    // Fill in gaps for months with no data
    const filledMonthlyTotals = this.fillMissingMonths(sortedMonthlyTotals);
    
    this.monthlyChartData.labels = filledMonthlyTotals.map((m) =>
      new Date(m.year, m.month - 1).toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    );
    this.monthlyChartData.datasets[0].data = filledMonthlyTotals.map((m) => m.amount);
    
    // Create gradient colors based on expense amount
    const maxAmount = Math.max(...filledMonthlyTotals.map(m => m.amount));
    const backgroundColors: string[] = filledMonthlyTotals.map((m) => {
      // Use color intensity based on percentage of max amount
      const colorIndex = Math.min(Math.floor((m.amount / maxAmount) * this.colorPalette.length), this.colorPalette.length - 1);
      // Safely access the color palette with proper type checking
      return this.colorPalette[colorIndex] || this.colorPalette[0];
    });
    
    this.monthlyChartData.datasets[0].backgroundColor = backgroundColors;
    
    // Update hover colors
    this.monthlyChartData.datasets[0].hoverBackgroundColor = backgroundColors.map(color => this.adjustColorBrightness(color, -15));
    
    // Update chart if it exists
    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
      } else {
        console.warn('Monthly chart reference not available for update');
      }
    });
  }

  private fillMissingMonths(monthlyTotals: MonthlyTotal[]): MonthlyTotal[] {
    if (monthlyTotals.length <= 1) return monthlyTotals;
    
    const result: MonthlyTotal[] = [];
    const firstMonth = monthlyTotals[0];
    const lastMonth = monthlyTotals[monthlyTotals.length - 1];
    
    let currentDate = new Date(firstMonth.year, firstMonth.month - 1, 1);
    const endDate = new Date(lastMonth.year, lastMonth.month - 1, 1);
    
    // Create a map for quick lookup
    const monthMap = new Map<string, MonthlyTotal>();
    monthlyTotals.forEach(m => {
      const key = `${m.year}-${m.month}`;
      monthMap.set(key, m);
    });
    
    // Fill in all months between first and last
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const key = `${year}-${month}`;
      
      if (monthMap.has(key)) {
        result.push(monthMap.get(key)!);
      } else {
        // Add a zero entry for missing months
        result.push({
          month,
          year,
          amount: 0
        });
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return result;
  }

  private updateCategoryChart(categoryBreakdown: CategoryBreakdown[] | undefined): void {
    if (!categoryBreakdown?.length) {
      console.warn('No category breakdown data to chart');
      // Set a placeholder "No Data" label
      this.categoryChartData.labels = ['No Data'];
      this.categoryChartData.datasets[0].data = [0];
      this.categoryChartData.datasets[0].backgroundColor = [this.colorPalette[0]];
      
      // Force update if chart exists
      setTimeout(() => {
        if (this.chart?.chart) {
          this.chart.chart.update();
        }
      });
      return;
    }
    
    // Sort categories by amount (descending)
    const sortedCategories = [...categoryBreakdown].sort((a, b) => b.amount - a.amount);
    
    // Take top 7 categories and group the rest as "Others"
    const topCategories = sortedCategories.slice(0, 7);
    const otherCategories = sortedCategories.slice(7);
    
    // Assign consistent colors to categories
    topCategories.forEach((category, index) => {
      if (!this.categoryColorMap.has(category.categoryName)) {
        this.categoryColorMap.set(category.categoryName, this.colorPalette[index % this.colorPalette.length]);
      }
    });
    
    let labels = topCategories.map(c => c.categoryName || 'Uncategorized');
    let data = topCategories.map(c => c.amount);
    let colors = topCategories.map(c => this.categoryColorMap.get(c.categoryName) || this.colorPalette[0]);
    
    if (otherCategories.length > 0) {
      const othersTotal = otherCategories.reduce((sum, cat) => sum + cat.amount, 0);
      labels.push('Others');
      data.push(othersTotal);
      colors.push('#9ca3af'); // Gray for "Others"
    }
    
    this.categoryChartData.labels = labels;
    this.categoryChartData.datasets[0].data = data;
    this.categoryChartData.datasets[0].backgroundColor = colors;
    
    // Update chart if it exists
    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
      } else {
        console.warn('Category chart reference not available for update');
      }
    });
  }

  private loadRecentExpenses(startDate: Date, endDate: Date): void {
    this.expenseService.getExpenses({
      startDate,
      endDate,
      pageSize: 5,
      page: 1,
      sortBy: 'date',
      sortDirection: 'desc'
    }).subscribe({
      next: (response: PaginatedResponse<Expense>) => {
        this.recentExpenses = response.items;
        this.totalExpenses = response.totalCount;
        this.currentPage = response.pageNumber;
        this.isLoading = false;
      },
      error: (error) => {
        console.error("Error loading recent expenses:", error);
        this.isLoading = false;
      }
    });
  }

  private resetChartData(): void {
    // Reset category chart
    this.categoryChartData.labels = ['No Data'];
    this.categoryChartData.datasets[0].data = [0];
    this.categoryChartData.datasets[0].backgroundColor = [this.colorPalette[0]];
    
    // Reset monthly chart
    this.monthlyChartData.labels = [];
    this.monthlyChartData.datasets[0].data = [0];
    
    // Force chart update if available
    setTimeout(() => {
      if (this.chart?.chart) {
        this.chart.chart.update();
      }
    }, 0);
  }

  // Helper method to adjust color brightness
  private adjustColorBrightness(hex: string, percent: number): string {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);

    // Adjust brightness
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  // Type-safe handler for category chart click
  onCategoryChartClick(event: any): void {
    if (event && event.active && event.active.length > 0) {
      const index = event.active[0]?.index;
      if (index !== undefined && this.categoryChartData.labels && this.categoryChartData.labels[index]) {
        const category = this.categoryChartData.labels[index] as string;
        this.navigateToExpensesByCategory(category);
      }
    }
  }

  // Type-safe handler for monthly chart click
  onMonthlyChartClick(event: any): void {
    if (event && event.active && event.active.length > 0) {
      const index = event.active[0]?.index;
      if (index !== undefined && this.monthlyChartData.labels && this.monthlyChartData.labels[index]) {
        const month = this.monthlyChartData.labels[index] as string;
        this.navigateToExpensesByMonth(month);
      }
    }
  }
}
