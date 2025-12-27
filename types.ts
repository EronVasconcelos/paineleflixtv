
export type ClientStatus = 'active' | 'blocked' | 'expired' | 'pending';
export type PaymentStatus = 'paid' | 'pending';

export interface Package {
  id: string;
  name: string;
  price: number;
  cost: number;
  months: number;
}

export interface MessageTemplate {
  id: string;
  title: string;
  body: string;
}

export interface ScheduledMessage {
  id: string;
  clientId: string;
  templateId: string;
  startDate: string; // ISO string containing date and time
  intervalDays: number; // 0 for one-time, >0 for recurring
  lastSentAt?: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  name: string;
  username: string;
  password?: string;
  status: ClientStatus;
  paymentStatus: PaymentStatus;
  phone: string;
  packageName: string;
  packageId?: string;
  months: number;
  price: number;
  discount: number;
  expenses: number;
  notes: string;
  appName?: string;
  macKey?: string;
  createdAt: string;
  expiresAt: string;
  lastPaymentDate: string;
}

export interface FinancialStats {
  totalRevenue: number;
  totalExpenses: number;
  totalDiscounts: number;
  netBalance: number;
}

export interface DashboardStats {
  activeCount: number;
  blockedCount: number;
  expiredCount: number;
  expiringSoonCount: number;
  totalClients: number;
}
