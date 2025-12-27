
export type Category = 'Food' | 'Travel' | 'Subscriptions' | 'Impulse' | 'Misc' | 'Utilities';

export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  category: Category;
  timestamp: Date;
  isAutoCaptured: boolean;
  notes?: string;
  receiptImage?: string; // Base64 image string
}

export interface LeakageStats {
  todayTotal: number;
  weekTotal: number;
  leakageScore: number; // 0-100 (Higher is more "leaky")
  topCategory: Category;
}

export interface AIInsight {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export type ViewState = 'dashboard' | 'feed' | 'add' | 'insights' | 'settings';

export type Language = 'en' | 'sat' | 'bn' | 'hi';
