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

export type PrimaryWorkModel =
  | 'single_event'
  | 'session_pack'
  | 'recurring_group'
  | 'project'
  | 'mixed';

export type EngagementKind = 'project' | 'session_pack' | 'recurring_group';

export type EngagementStatus = 'active' | 'completed' | 'paused';

export type MilestoneStatus = 'pending' | 'done' | 'paid';

export interface GroupMember {
  id: string;
  studentName: string;
  parentName?: string;
  phone?: string;
  email?: string;
}

export interface Engagement {
  id: string;
  businessId: string;
  userId: string;
  kind: EngagementKind;
  title: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  status: EngagementStatus;
  startDate: string;
  endDate?: string;
  notes: string;
  createdAt: string;
  /** כרטיסייה */
  totalSessions?: number;
  usedSessions?: number;
  packAmount?: number;
  packExpiresAt?: string;
  /** חוג קבוע */
  weekday?: number;
  lessonTime?: string;
  members?: GroupMember[];
  pricePerStudent?: number;
}

export interface Milestone {
  id: string;
  engagementId: string;
  businessId: string;
  name: string;
  amount: number;
  dueDate?: string;
  status: MilestoneStatus;
  notes: string;
  invoiceId?: string;
  sortOrder: number;
}

export interface EngagementSession {
  id: string;
  engagementId: string;
  businessId: string;
  date: string;
  notes: string;
  revenue: number;
  attendedMemberIds?: string[];
}

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
  engagementId?: string;
  milestoneId?: string;
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
  /** מזהה preset מ-onboarding — לקategorias */
  presetId?: string;
  /** איך העסק עובד בעיקר — משפיע על דשבורד ו«חדש» */
  primaryWorkModel?: PrimaryWorkModel;
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
  engagements: Engagement[];
  milestones: Milestone[];
  engagementSessions: EngagementSession[];
}
