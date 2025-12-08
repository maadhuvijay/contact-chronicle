export interface MonthlyData {
  month: string; // Format: MM-YY
  count: number;
  monthKey: string; // Format: YYYY-MM for sorting
  fullDate: Date; // For peak month formatting
}

