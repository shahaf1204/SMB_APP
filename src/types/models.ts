export type ValueType = 'text' | 'number' | 'date' | 'duration';
export type MetricRole = 'revenue' | 'expense' | 'neutral';

export type PeriodFilter =
  | 'thisMonth'
  | 'lastMonth'
  | 'nextMonth'
  | 'last7'
  | 'last30'
  | 'ytd'
  | 'allTime'
  | 'allFuture';

export type ChartMetric = 'revenue' | 'expense' | 'profit';

export type LeadStatus = 'new' | 'contacted' | 'quoted' | 'won' | 'lost';

export type LeadSourceChannel =
  | 'facebook'
  | 'instagram'
  | 'tiktok'
  | 'google'
  | 'whatsapp'
  | 'referral'
  | 'repeat'
  | 'other';

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export interface EventTemplate {
  id: string;
  businessId: string;
  name: string;
  title: string;
  location: string;
  notes: string;
  categoryDefaults: Record<string, string>;
}

export interface Task {
  id: string;
  businessId: string;
  title: string;
  dueDate: string;
  done: boolean;
  doneAt?: string;
  createdAt: string;
}

export interface Lead {
  id: string;
  businessId: string;
  userId: string;
  name: string;
  phone?: string;
  email?: string;
  source: LeadSourceChannel;
  notes: string;
  status: LeadStatus;
  createdAt: string;
  eventId?: string;
}

export interface Invoice {
  id: string;
  businessId: string;
  userId: string;
  eventId?: string;
  invoiceNumber: number;
  clientName: string;
  clientEmail?: string;
  amount: number;
  issuedAt: string;
  dueDate: string;
  status: InvoiceStatus;
  notes: string;
}

export interface UserSession {
  id: string;
  displayName: string;
  email?: string;
}

export interface Business {
  id: string;
  name: string;
  userId: string;
  businessType: string;
  isGeneric: boolean;
  businessTypeFromList: boolean;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  valueType: ValueType;
  metricRole: MetricRole;
  isActive: boolean;
}

export interface Event {
  id: string;
  businessId: string;
  userId: string;
  title: string;
  eventDate: string;
  location: string;
  notes: string;
  clientEmail?: string;
  clientPhone?: string;
}

export interface EventValue {
  id: string;
  eventId: string;
  categoryId: string;
  businessId: string;
  userId: string;
  valueNumber?: number;
  valueText?: string;
  valueDate?: string;
  valueDuration?: number;
  revenueValue?: number;
  expenseValue?: number;
  metricRole: MetricRole;
}

export interface AppState {
  user: UserSession | null;
  business: Business | null;
  categories: Category[];
  events: Event[];
  eventValues: EventValue[];
  leads: Lead[];
  invoices: Invoice[];
  nextInvoiceNumber: number;
  eventTemplates: EventTemplate[];
  tasks: Task[];
  dismissedAutoTasks: string[];
}
