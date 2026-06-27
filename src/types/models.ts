import type { IntegrationConnection } from './integrations';
import type {
  ExternalFormConnection,
  ExternalFormSubmission,
  FormActivityNotification,
} from './externalForms';

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

export type LeadStatus =
  | 'new'
  | 'in_progress'
  | 'contacted'
  | 'proposal_sent'
  | 'closed'
  | 'not_relevant';

export type LeadSourceChannel =
  | 'facebook'
  | 'instagram'
  | 'website'
  | 'whatsapp'
  | 'tiktok'
  | 'google'
  | 'referral'
  | 'repeat'
  | 'other';

export type LeadExternalProvider = 'meta' | 'website' | 'whatsapp' | 'manual' | 'sheet';

export interface LeadFormAnswer {
  field: string;
  value: string;
}

export interface LeadStatusHistoryEntry {
  status: LeadStatus;
  at: string;
  note?: string;
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid';

export type WorkConcept = 'single_event' | 'session_pack' | 'recurring_group' | 'project';

/** @deprecated נשמר לתאימות — השתמשו ב-workModels */
export type PrimaryWorkModel = WorkConcept | 'mixed';

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
  /** שם מלא */
  name: string;
  phone?: string;
  email?: string;
  source: LeadSourceChannel;
  notes: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt?: string;
  serviceInterest?: string;
  externalProvider?: LeadExternalProvider;
  externalLeadId?: string;
  externalFormId?: string;
  externalFormName?: string;
  externalPageId?: string;
  externalPageName?: string;
  externalCampaignId?: string;
  externalCampaignName?: string;
  externalAdId?: string;
  externalAdName?: string;
  formAnswers?: LeadFormAnswer[];
  statusHistory?: LeadStatusHistoryEntry[];
  rawPayload?: unknown;
  /** @deprecated השתמשו ב-convertedToEventId */
  eventId?: string;
  convertedToEventId?: string;
  convertedToCardId?: string;
  convertedToProjectId?: string;
  convertedToClassId?: string;
  convertedToCustomerId?: string;
}

export type InvoicePaymentStatus = 'none' | 'pending' | 'paid' | 'failed' | 'cancelled';

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
  provider?: string;
  providerDocumentId?: string;
  providerInvoiceNumber?: string;
  officialPdfUrl?: string;
  paymentUrl?: string;
  paymentTransactionId?: string;
  paymentStatus?: InvoicePaymentStatus;
  providerSyncedAt?: string;
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
  /** קונסeptי העבודה שהמשתמש בחר — קובעים דשבורד ו«חדש» */
  workModels?: WorkConcept[];
  /** @deprecated — ממופה ל-workModels בטעינה */
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
  source?: 'manual' | 'external_form';
  externalFormConnectionId?: string;
  externalSubmissionId?: string;
  externalFormProvider?: string;
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
  integrationConnections: IntegrationConnection[];
  externalFormConnections: ExternalFormConnection[];
  externalFormSubmissions: ExternalFormSubmission[];
  formNotifications: FormActivityNotification[];
}
