
export type ClientStatus = 'active' | 'blocked' | 'expired' | 'pending';
export type PaymentStatus = 'paid' | 'pending';

export interface UserProfile {
  id: string;
  email: string;
  trial_ends_at: string; // ISO Date
  subscription_ends_at: string | null; // ISO Date
  plan_type: string | null;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
  monthsPaid: number;
  method: string;
}

export interface CreditTransaction {
  id: string;
  date: string;
  amount: number; // Quantidade de créditos
  cost: number;   // Valor pago em R$
}

export interface Server {
  id: string;
  user_id?: string;
  name: string;
  url: string;
  credits: number;
  transactions: CreditTransaction[];
}

export interface Package {
  id: string;
  user_id?: string;
  name: string;
  price: number;
  cost: number;
  months: number;
}

export interface MessageTemplate {
  id: string;
  user_id?: string;
  title: string;
  body: string;
}

export interface MessageRule {
  id: string;
  user_id?: string;
  type: 'before' | 'on_day' | 'after';
  days: number; // Se type for 'on_day', days será ignorado ou 0
  time: string;
  templateId: string;
  isActive: boolean;
}

export interface Client {
  id: string;
  user_id?: string;
  name: string;
  username: string;
  password?: string;
  status: ClientStatus;
  paymentStatus: PaymentStatus;
  phone: string;
  packageName: string;
  packageId?: string;
  price: number;
  expenses: number;
  notes: string;
  appName?: string;
  macKey?: string;
  createdAt: string;
  expiresAt: string;
  paymentHistory: PaymentRecord[];
  totalPaid: number;
}
