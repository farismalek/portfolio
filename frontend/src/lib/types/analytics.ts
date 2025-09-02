export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
  pointBackgroundColor?: string;
  pointBorderColor?: string;
  pointHoverBackgroundColor?: string;
  pointHoverBorderColor?: string;
}

export type ChartType =
  | 'bar'
  | 'line'
  | 'pie'
  | 'doughnut'
  | 'radar'
  | 'polarArea'
  | 'bubble'
  | 'scatter';

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'right' | 'bottom' | 'left';
    };
    tooltip?: {
      enabled?: boolean;
    };
    title?: {
      display?: boolean;
      text?: string;
    };
  };
  scales?: {
    x?: {
      grid?: {
        display?: boolean;
      };
      ticks?: {
        autoSkip?: boolean;
        maxRotation?: number;
      };
      title?: {
        display?: boolean;
        text?: string;
      };
    };
    y?: {
      beginAtZero?: boolean;
      grid?: {
        display?: boolean;
      };
      title?: {
        display?: boolean;
        text?: string;
      };
    };
  };
}

export interface AnalyticsWidgetProps {
  title: string;
  description?: string;
  loading?: boolean;
  error?: string | null;
  fullWidth?: boolean;
}

export interface KpiCardProps {
  title: string;
  value: number | string;
  previousValue?: number | string;
  percentChange?: number;
  icon?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  format?: 'number' | 'currency' | 'percent' | 'time';
  loading?: boolean;
}

export interface DataTableProps<T> {
  data: T[];
  columns: {
    key: keyof T;
    title: string;
    align?: 'left' | 'center' | 'right';
    format?: (value: any) => string;
    sortable?: boolean;
  }[];
  loading?: boolean;
  error?: string | null;
}

export interface ReportDefinition {
  id: string;
  name: string;
  description?: string;
  type: 'portfolio' | 'profile' | 'job' | 'engagement' | 'monetization' | 'custom';
  schedule?: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastRun?: string;
  metrics: string[];
  filters?: Record<string, any>;
  visualization?: {
    type: ChartType;
    options?: ChartOptions;
  };
  recipients?: string[];
  format?: 'pdf' | 'csv' | 'excel';
}