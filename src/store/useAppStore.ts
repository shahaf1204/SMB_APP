import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { findAccountSnapshot, flushAccountSnapshot } from '../lib/accountArchive';
import {
  ensureAccountInRegistry,
  findAccountByEmail,
  registerAccount,
  updateAccountDisplayName,
} from '../lib/accountsRegistry';
import { suggestWorkModelsFromPreset, normalizeBusiness } from '../lib/workModel';
import { cloudSignOut } from '../lib/cloudSync';
import { normalizeLeads } from '../lib/crm/leadNormalize';
import { pushLeadStatusToCloud } from '../lib/crm/leadsSync';
import { isSupabaseConfigured } from '../lib/supabase';
import { clearAppStorage, safeJsonStorage, STORAGE_KEY } from '../lib/safeStorage';
import {
  buildCategoriesFromPreset,
  buildGenericCategories,
  BUSINESS_TYPE_PRESETS,
} from '../data/businessTypePresets';
import { CUSTOMER_SOURCE_CATEGORY_NAME } from '../data/leadSources';
import { buildEventValuesFromInputs } from '../lib/eventForm';
import {
  nextCategorySortOrder,
  normalizeCategorySortOrders,
  sortCategories,
} from '../lib/categories';
import {
  importEventsIntoState,
  type HistoricalEventRow,
} from '../lib/historicalImport';
import { createId } from '../lib/ids';
import { createEventValuesForEvent } from '../lib/events';
import type {
  AppState,
  Business,
  Category,
  Engagement,
  EngagementSession,
  Event,
  EventTemplate,
  EventValue,
  GroupMember,
  Invoice,
  PaymentTransaction,
  Lead,
  LeadStatus,
  Milestone,
  ExpenseTrackingMode,
  MonthlyExpense,
  WorkConcept,
  Task,
} from '../types/models';
import type { IntegrationConnection, IntegrationLog } from '../types/integrations';
import { applyWebhookPaymentUpdate } from '../lib/integrations/service';
import { normalizeIntegrationConnection } from '../types/integrations';
import type {
  ExternalFormConnection,
  ExternalFormSubmission,
  NormalizedFormPayload,
} from '../types/externalForms';
import {
  prepareActivityFromFormSubmission,
  logAutomationError,
} from '../lib/externalForms/formAutomationService';
import { normalizeSubmission } from '../lib/externalForms/connectionWebhook';
import { registerExternalFormConnection } from '../lib/externalForms/clientApi';
import { buildFormActivityNotification } from '../lib/externalForms/formActivityNotification';
import { logPipelineStage } from '../lib/externalForms/pipelineDebug';
import { getExternalFormProvider } from '../formsProviders';

interface AppActions {
  register: (
    displayName: string,
    email: string,
  ) => { ok: true } | { ok: false; reason: 'invalid' | 'exists' };
  loginExisting: (
    email: string,
    displayName?: string,
  ) => { ok: true } | { ok: false; reason: 'invalid' | 'not_found' };
  login: (displayName: string, email?: string) => void;
  logout: () => void;
  createBusiness: (params: {
    name: string;
    businessType: string;
    isGeneric: boolean;
    businessTypeFromList: boolean;
    presetId?: string;
    workModels?: WorkConcept[];
    /** @deprecated */
    primaryWorkModel?: WorkConcept | 'mixed';
  }) => void;
  updateWorkModels: (models: WorkConcept[]) => void;
  updateExpenseTrackingMode: (mode: ExpenseTrackingMode) => void;
  addMonthlyExpense: (
    expense: Omit<MonthlyExpense, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>,
  ) => void;
  updateMonthlyExpense: (
    id: string,
    patch: Partial<Pick<MonthlyExpense, 'month' | 'category' | 'amount' | 'notes'>>,
  ) => void;
  deleteMonthlyExpense: (id: string) => void;
  ensureCustomerSourceCategory: () => void;
  addCategory: (category: Omit<Category, 'id' | 'businessId' | 'isActive' | 'sortOrder'> & { isActive?: boolean; sortOrder?: number }) => void;
  deleteCategory: (id: string) => void;
  reorderCategories: (orderedActiveIds: string[]) => void;
  moveCategory: (categoryId: string, direction: 'up' | 'down') => void;
  addEvent: (
    event: Omit<Event, 'id' | 'businessId' | 'userId'>,
    values: EventValue[],
  ) => string;
  updateEvent: (
    id: string,
    event: Omit<Event, 'id' | 'businessId' | 'userId'>,
    categoryInputs: Record<string, string>,
  ) => void;
  deleteEvent: (id: string) => void;
  addLead: (
    lead: Omit<Lead, 'id' | 'businessId' | 'userId' | 'createdAt' | 'status'> & {
      createdAt?: string;
      id?: string;
      status?: LeadStatus;
    },
  ) => void;
  upsertCloudLead: (lead: Lead, isNew: boolean) => void;
  updateLead: (id: string, patch: Partial<Lead>) => void;
  setLeadStatus: (id: string, status: LeadStatus, note?: string) => void;
  linkLeadToEvent: (leadId: string, eventId: string) => void;
  createInvoice: (params: {
    clientName: string;
    clientEmail?: string;
    amount: number;
    eventId?: string;
    engagementId?: string;
    milestoneId?: string;
    notes?: string;
  }) => string;
  createEngagement: (
    engagement: Omit<Engagement, 'id' | 'businessId' | 'userId' | 'createdAt' | 'status' | 'usedSessions'>,
  ) => string;
  updateEngagement: (id: string, patch: Partial<Omit<Engagement, 'id' | 'businessId' | 'userId'>>) => void;
  completeEngagement: (id: string) => void;
  addMilestone: (
    engagementId: string,
    milestone: Omit<Milestone, 'id' | 'engagementId' | 'businessId' | 'status' | 'sortOrder'>,
  ) => string;
  updateMilestone: (
    id: string,
    patch: Partial<Pick<Milestone, 'name' | 'amount' | 'dueDate' | 'status' | 'notes' | 'invoiceId'>>,
  ) => void;
  deleteMilestone: (id: string) => void;
  createMilestoneInvoice: (milestoneId: string) => string;
  logEngagementSession: (
    engagementId: string,
    session: Omit<EngagementSession, 'id' | 'engagementId' | 'businessId'>,
  ) => string;
  addGroupMember: (engagementId: string, member: Omit<GroupMember, 'id'>) => void;
  removeGroupMember: (engagementId: string, memberId: string) => void;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => void;
  updateInvoice: (
    id: string,
    patch: Partial<
      Pick<
        Invoice,
        | 'clientEmail'
        | 'notes'
        | 'status'
        | 'externalProvider'
        | 'externalInvoiceId'
        | 'externalDocumentNumber'
        | 'externalPdfUrl'
        | 'paymentStatus'
        | 'paymentLink'
        | 'paymentTransactionId'
        | 'paidAt'
        | 'syncStatus'
        | 'syncError'
        | 'provider'
        | 'providerDocumentId'
        | 'providerInvoiceNumber'
        | 'officialPdfUrl'
        | 'paymentUrl'
        | 'providerSyncedAt'
      >
    >,
  ) => void;
  upsertIntegrationConnection: (connection: IntegrationConnection) => void;
  removeIntegrationConnection: (connectionId: string) => void;
  updateIntegrationSync: (
    connectionId: string,
    patch: Partial<
      Pick<
        IntegrationConnection,
        | 'lastSyncAt'
        | 'lastSync'
        | 'nextSync'
        | 'syncStatus'
        | 'lastError'
        | 'status'
        | 'connectionStatus'
      >
    >,
  ) => void;
  addIntegrationLog: (log: IntegrationLog) => void;
  upsertPaymentTransaction: (tx: PaymentTransaction) => void;
  applyIntegrationWebhook: (update: import('../types/integrations').WebhookPaymentUpdate) => void;
  upsertExternalFormConnection: (connection: ExternalFormConnection) => void;
  removeExternalFormConnection: (connectionId: string) => void;
  clearAllExternalFormConnections: () => void;
  activateExternalFormConnection: (connectionId: string) => Promise<void>;
  processExternalFormSubmission: (params: {
    connectionId: string;
    rawPayload: unknown;
    externalSubmissionId?: string;
    submissionId?: string;
  }) => string | null;
  retryExternalFormSubmission: (submissionId: string) => string | null;
  dismissFormNotification: (id: string) => void;
  markFormNotificationHandled: (id: string) => void;
  markFormNotificationsHandledForActivity: (activityId: string) => void;
  addEventTemplate: (template: Omit<EventTemplate, 'id' | 'businessId'>) => void;
  deleteEventTemplate: (id: string) => void;
  addTask: (title: string, dueDate: string) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  dismissAutoTask: (autoId: string) => void;
  restoreAppState: (state: AppState) => void;
  importHistoricalEvents: (rows: HistoricalEventRow[]) => number;
}

type Store = AppState & AppActions;

function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return d.toISOString().slice(0, 10);
}

function migrateInvoices(invoices: unknown): Invoice[] {
  if (!Array.isArray(invoices)) return [];
  return invoices.map((inv) => {
    const row = inv as Invoice & {
      provider?: string;
      providerDocumentId?: string;
      paymentUrl?: string;
      paymentStatus?: Invoice['paymentStatus'];
    };
    const paymentStatus =
      row.paymentStatus === 'none' || !row.paymentStatus
        ? 'unpaid'
        : row.paymentStatus;
    return {
      ...row,
      dueDate: row.dueDate ?? row.issuedAt ?? new Date().toISOString().slice(0, 10),
      externalProvider: row.externalProvider ?? row.provider,
      externalInvoiceId: row.externalInvoiceId ?? row.providerDocumentId,
      externalDocumentNumber: row.externalDocumentNumber ?? row.providerInvoiceNumber,
      externalPdfUrl: row.externalPdfUrl ?? row.officialPdfUrl,
      paymentLink: row.paymentLink ?? row.paymentUrl,
      paymentStatus,
      syncStatus:
        row.syncStatus ??
        (row.providerSyncedAt || row.externalInvoiceId || row.providerDocumentId
          ? 'synced'
          : 'not_synced'),
    };
  });
}

function migrateIntegrationConnections(raw: unknown): IntegrationConnection[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((c) =>
    normalizeIntegrationConnection(c as IntegrationConnection & { provider?: string; userId?: string }),
  );
}

function normalizeEngagementState(p: Partial<AppState>): Partial<AppState> {
  return {
    ...p,
    leads: normalizeLeads(p.leads as Lead[] | undefined),
    engagements: Array.isArray(p.engagements) ? p.engagements : [],
    milestones: Array.isArray(p.milestones) ? p.milestones : [],
    engagementSessions: Array.isArray(p.engagementSessions) ? p.engagementSessions : [],
    business: p.business ? normalizeBusiness(p.business) : p.business,
    categories: Array.isArray(p.categories)
      ? normalizeCategorySortOrders(p.categories as Category[])
      : p.categories,
  };
}

const initialState: AppState = {
  user: null,
  business: null,
  categories: [],
  events: [],
  eventValues: [],
  leads: [],
  invoices: [],
  nextInvoiceNumber: 1001,
  eventTemplates: [],
  tasks: [],
  dismissedAutoTasks: [],
  engagements: [],
  milestones: [],
  engagementSessions: [],
  integrationConnections: [],
  integrationLogs: [],
  paymentTransactions: [],
  externalFormConnections: [],
  externalFormSubmissions: [],
  formNotifications: [],
  monthlyExpenses: [],
};

export const useAppStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialState,

      login: (displayName, email) => {
        const trimmedName = displayName.trim();
        const trimmedEmail = email?.trim().toLowerCase();
        if (trimmedEmail) {
          get().loginExisting(trimmedEmail, trimmedName);
          return;
        }
        const saved = findAccountSnapshot(trimmedName, trimmedEmail);
        if (saved?.user) {
          set({
            ...normalizeEngagementState(saved),
            user: {
              id: saved.user.id,
              displayName: trimmedName,
              email: saved.user.email,
            },
          });
          flushAccountSnapshot(get());
          return;
        }
        set({
          ...initialState,
          user: {
            id: createId(),
            displayName: trimmedName,
            email: trimmedEmail,
          },
        });
      },

      register: (displayName, email) => {
        const trimmedName = displayName.trim();
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedName || !trimmedEmail) {
          return { ok: false as const, reason: 'invalid' as const };
        }
        if (findAccountByEmail(trimmedEmail)) {
          return { ok: false as const, reason: 'exists' as const };
        }

        const userId = createId();
        registerAccount({
          email: trimmedEmail,
          displayName: trimmedName,
          userId,
        });

        set({
          ...initialState,
          user: {
            id: userId,
            displayName: trimmedName,
            email: trimmedEmail,
          },
        });
        flushAccountSnapshot(get());
        return { ok: true as const };
      },

      loginExisting: (email, displayName) => {
        const trimmedEmail = email.trim().toLowerCase();
        if (!trimmedEmail) {
          return { ok: false as const, reason: 'invalid' as const };
        }

        const record = findAccountByEmail(trimmedEmail);
        const nameHint = displayName?.trim() || record?.displayName || '';
        const saved = findAccountSnapshot(nameHint, trimmedEmail);

        if (!record && !saved) {
          return { ok: false as const, reason: 'not_found' as const };
        }

        const resolvedName =
          nameHint || saved?.user?.displayName || record?.displayName || trimmedEmail;
        const userId = saved?.user?.id ?? record?.userId ?? createId();

        if (saved) {
          set({
            ...normalizeEngagementState(saved),
            user: {
              id: userId,
              displayName: resolvedName,
              email: trimmedEmail,
            },
          });
        } else {
          set({
            ...initialState,
            user: {
              id: userId,
              displayName: resolvedName,
              email: trimmedEmail,
            },
          });
        }

        ensureAccountInRegistry({
          id: userId,
          displayName: resolvedName,
          email: trimmedEmail,
        });
        if (record && record.displayName !== resolvedName) {
          updateAccountDisplayName(trimmedEmail, resolvedName);
        }
        flushAccountSnapshot(get());
        return { ok: true as const };
      },

      logout: () => {
        const state = get();
        if (state.user && !isSupabaseConfigured()) {
          flushAccountSnapshot(state);
        }
        if (isSupabaseConfigured()) {
          void cloudSignOut();
        }
        set({ ...initialState });
      },

      createBusiness: ({
        name,
        businessType,
        isGeneric,
        businessTypeFromList,
        presetId,
        workModels,
        primaryWorkModel,
      }) => {
        const user = get().user;
        if (!user) return;

        const prev = get().business;
        const trimmedName = name.trim();
        const resolvedWorkModels =
          workModels ??
          (primaryWorkModel && primaryWorkModel !== 'mixed'
            ? [primaryWorkModel]
            : suggestWorkModelsFromPreset(presetId));

        if (prev) {
          let categories = get().categories;
          if (categories.length === 0) {
            let categoryDefs: Omit<Category, 'id'>[];
            if (presetId) {
              const preset = BUSINESS_TYPE_PRESETS.find((p) => p.id === presetId);
              categoryDefs = preset
                ? buildCategoriesFromPreset(prev.id, preset).map((c) => ({
                    ...c,
                    businessId: prev.id,
                  }))
                : buildGenericCategories(prev.id).map((c) => ({
                    ...c,
                    businessId: prev.id,
                  }));
            } else {
              categoryDefs = buildGenericCategories(prev.id).map((c) => ({
                ...c,
                businessId: prev.id,
              }));
            }
            categories = categoryDefs.map((c) => ({ ...c, id: createId() }));
          }
          set({
            business: {
              ...prev,
              name: trimmedName,
              businessType,
              isGeneric,
              businessTypeFromList,
              ...(presetId ? { presetId } : {}),
              workModels: resolvedWorkModels,
              primaryWorkModel:
                resolvedWorkModels.length > 1 ? 'mixed' : resolvedWorkModels[0],
            },
            categories,
          });
          get().ensureCustomerSourceCategory();
          return;
        }

        const archived = findAccountSnapshot(user.displayName, user.email);
        if (archived?.business && archived.events.length > 0) {
          set({
            ...archived,
            user: {
              id: archived.user!.id,
              displayName: user.displayName,
              email: user.email ?? archived.user!.email,
            },
            business: normalizeBusiness({
              ...archived.business,
              name: trimmedName,
              businessType,
              isGeneric,
              businessTypeFromList,
              ...(presetId ? { presetId } : {}),
              workModels:
                workModels ??
                archived.business.workModels ??
                (primaryWorkModel && primaryWorkModel !== 'mixed'
                  ? [primaryWorkModel]
                  : suggestWorkModelsFromPreset(presetId ?? archived.business.presetId)),
            })!,
          });
          get().ensureCustomerSourceCategory();
          return;
        }

        const business: Business = {
          id: createId(),
          name: trimmedName,
          userId: user.id,
          businessType,
          isGeneric,
          businessTypeFromList,
          ...(presetId ? { presetId } : {}),
          workModels: resolvedWorkModels,
          primaryWorkModel:
            resolvedWorkModels.length > 1 ? 'mixed' : resolvedWorkModels[0],
        };

        let categoryDefs: Omit<Category, 'id'>[];
        if (presetId) {
          const preset = BUSINESS_TYPE_PRESETS.find((p) => p.id === presetId);
          categoryDefs = preset
            ? buildCategoriesFromPreset(business.id, preset).map((c) => ({
                ...c,
                businessId: business.id,
              }))
            : buildGenericCategories(business.id).map((c) => ({
                ...c,
                businessId: business.id,
              }));
        } else {
          categoryDefs = buildGenericCategories(business.id).map((c) => ({
            ...c,
            businessId: business.id,
          }));
        }

        const categories: Category[] = categoryDefs.map((c) => ({
          ...c,
          id: createId(),
        }));

        set({
          business,
          categories,
          events: [],
          eventValues: [],
          leads: [],
          invoices: [],
          nextInvoiceNumber: 1001,
          eventTemplates: [],
          tasks: [],
          dismissedAutoTasks: [],
        });
      },

      updateWorkModels: (models) => {
        const business = get().business;
        if (!business || models.length === 0) return;
        set({
          business: normalizeBusiness({
            ...business,
            workModels: models,
          })!,
        });
      },

      updateExpenseTrackingMode: (mode) => {
        const business = get().business;
        if (!business) return;
        set({
          business: normalizeBusiness({
            ...business,
            expenseTrackingMode: mode,
          })!,
        });
      },

      addMonthlyExpense: (partial) => {
        const business = get().business;
        if (!business) return;
        const now = new Date().toISOString();
        const expense: MonthlyExpense = {
          id: createId(),
          businessId: business.id,
          month: partial.month,
          category: partial.category,
          amount: partial.amount,
          notes: partial.notes ?? '',
          createdAt: now,
          updatedAt: now,
        };
        set({ monthlyExpenses: [expense, ...get().monthlyExpenses] });
      },

      updateMonthlyExpense: (id, patch) => {
        set({
          monthlyExpenses: get().monthlyExpenses.map((e) =>
            e.id === id
              ? { ...e, ...patch, updatedAt: new Date().toISOString() }
              : e,
          ),
        });
      },

      deleteMonthlyExpense: (id) => {
        set({
          monthlyExpenses: get().monthlyExpenses.filter((e) => e.id !== id),
        });
      },

      ensureCustomerSourceCategory: () => {
        const business = get().business;
        if (!business) return;
        const exists = get().categories.some(
          (c) => c.isActive && c.name === CUSTOMER_SOURCE_CATEGORY_NAME,
        );
        if (exists) return;
        const category: Category = {
          id: createId(),
          businessId: business.id,
          name: CUSTOMER_SOURCE_CATEGORY_NAME,
          valueType: 'text',
          metricRole: 'neutral',
          isActive: true,
          sortOrder: nextCategorySortOrder(get().categories),
        };
        set({ categories: [...get().categories, category] });
      },

      addCategory: (partial) => {
        const business = get().business;
        if (!business) return;
        const category: Category = {
          id: createId(),
          businessId: business.id,
          name: partial.name,
          valueType: partial.valueType,
          metricRole: partial.metricRole,
          isActive: partial.isActive ?? true,
          sortOrder: partial.sortOrder ?? nextCategorySortOrder(get().categories),
        };
        set({ categories: sortCategories([...get().categories, category]) });
      },

      deleteCategory: (id) => {
        const hasValues = get().eventValues.some((ev) => ev.categoryId === id);
        if (hasValues) {
          set({
            categories: normalizeCategorySortOrders(
              get().categories.map((c) =>
                c.id === id ? { ...c, isActive: false } : c,
              ),
            ),
          });
        } else {
          set({
            categories: normalizeCategorySortOrders(
              get().categories.filter((c) => c.id !== id),
            ),
          });
        }
      },

      reorderCategories: (orderedActiveIds) => {
        const categories = get().categories;
        const inactive = sortCategories(categories.filter((c) => !c.isActive));
        const activeUpdated = orderedActiveIds
          .map((id, i) => {
            const cat = categories.find((c) => c.id === id);
            return cat ? { ...cat, sortOrder: i } : null;
          })
          .filter((c): c is Category => c != null);
        const inactiveUpdated = inactive.map((c, i) => ({
          ...c,
          sortOrder: activeUpdated.length + i,
        }));
        set({ categories: [...activeUpdated, ...inactiveUpdated] });
      },

      moveCategory: (categoryId, direction) => {
        const active = sortCategories(get().categories.filter((c) => c.isActive));
        const idx = active.findIndex((c) => c.id === categoryId);
        if (idx < 0) return;
        const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
        if (targetIdx < 0 || targetIdx >= active.length) return;
        const ids = active.map((c) => c.id);
        [ids[idx], ids[targetIdx]] = [ids[targetIdx], ids[idx]];
        get().reorderCategories(ids);
      },

      addEvent: (partial, values) => {
        const business = get().business;
        const user = get().user;
        if (!business || !user) return '';

        const event: Event = {
          id: createId(),
          businessId: business.id,
          userId: user.id,
          ...partial,
        };

        const autoValues = createEventValuesForEvent(event, get().categories);
        const mergedValues = autoValues.map((auto) => {
          const filled = values.find((v) => v.categoryId === auto.categoryId);
          if (!filled) return auto;
          return {
            ...auto,
            ...filled,
            id: auto.id,
            eventId: auto.eventId,
            businessId: auto.businessId,
            userId: auto.userId,
          };
        });

        set({
          events: [...get().events, event],
          eventValues: [...get().eventValues, ...mergedValues],
        });
        return event.id;
      },

      updateEvent: (id, partial, categoryInputs) => {
        const business = get().business;
        const user = get().user;
        if (!business || !user) return;

        const existing = get().events.find((e) => e.id === id);
        if (!existing) return;

        const updated: Event = { ...existing, ...partial };
        const existingValues = get().eventValues.filter((ev) => ev.eventId === id);
        const newValues = buildEventValuesFromInputs(
          id,
          business.id,
          user.id,
          get().categories,
          categoryInputs,
          existingValues,
        );

        set({
          events: get().events.map((e) => (e.id === id ? updated : e)),
          eventValues: [
            ...get().eventValues.filter((ev) => ev.eventId !== id),
            ...newValues,
          ],
        });
      },

      deleteEvent: (id) => {
        set({
          events: get().events.filter((e) => e.id !== id),
          eventValues: get().eventValues.filter((ev) => ev.eventId !== id),
          leads: get().leads.map((l) =>
            l.eventId === id ? { ...l, eventId: undefined } : l,
          ),
        });
      },

      addLead: (partial) => {
        const business = get().business;
        const user = get().user;
        if (!business || !user) return;
        const now = new Date().toISOString();
        const lead: Lead = {
          id: partial.id ?? createId(),
          businessId: business.id,
          userId: user.id,
          status: partial.status ?? 'new',
          ...partial,
          createdAt: partial.createdAt ?? now,
          updatedAt: now,
          statusHistory: partial.statusHistory ?? [{ status: partial.status ?? 'new', at: now }],
        };
        set({ leads: [lead, ...get().leads.filter((l) => l.id !== lead.id)] });
      },

      upsertCloudLead: (lead, isNew) => {
        if (isNew) {
          set({ leads: [lead, ...get().leads] });
        } else {
          set({
            leads: get().leads.map((l) => (l.id === lead.id ? { ...l, ...lead } : l)),
          });
        }
      },

      updateLead: (id, patch) => {
        const now = new Date().toISOString();
        set({
          leads: get().leads.map((l) =>
            l.id === id ? { ...l, ...patch, updatedAt: now } : l,
          ),
        });
        const updated = get().leads.find((l) => l.id === id);
        if (updated?.externalProvider === 'meta' && updated.externalLeadId) {
          void pushLeadStatusToCloud(id, updated.status, updated.statusHistory, updated);
        }
      },

      setLeadStatus: (id, status, note) => {
        const now = new Date().toISOString();
        set({
          leads: get().leads.map((l) => {
            if (l.id !== id) return l;
            const history = [...(l.statusHistory ?? []), { status, at: now, note }];
            return { ...l, status, statusHistory: history, updatedAt: now };
          }),
        });
        const updated = get().leads.find((l) => l.id === id);
        if (updated?.externalProvider === 'meta') {
          void pushLeadStatusToCloud(id, status, updated.statusHistory, updated);
        }
      },

      linkLeadToEvent: (leadId, eventId) => {
        const now = new Date().toISOString();
        set({
          leads: get().leads.map((l) => {
            if (l.id !== leadId) return l;
            const history = [
              ...(l.statusHistory ?? []),
              { status: 'closed' as LeadStatus, at: now },
            ];
            return {
              ...l,
              eventId,
              convertedToEventId: eventId,
              status: 'closed' as LeadStatus,
              statusHistory: history,
              updatedAt: now,
            };
          }),
        });
      },

      createInvoice: ({
        clientName,
        clientEmail,
        amount,
        eventId,
        engagementId,
        milestoneId,
        notes = '',
      }) => {
        const business = get().business;
        const user = get().user;
        if (!business || !user) return '';
        const num = get().nextInvoiceNumber;
        const issuedAt = new Date().toISOString().slice(0, 10);
        const email = clientEmail?.trim();
        const invoice: Invoice = {
          id: createId(),
          businessId: business.id,
          userId: user.id,
          invoiceNumber: num,
          clientName,
          ...(email ? { clientEmail: email } : {}),
          amount,
          ...(eventId ? { eventId } : {}),
          ...(engagementId ? { engagementId } : {}),
          ...(milestoneId ? { milestoneId } : {}),
          issuedAt,
          dueDate: defaultDueDate(),
          status: 'draft',
          notes,
        };
        set({
          invoices: [invoice, ...get().invoices],
          nextInvoiceNumber: num + 1,
        });
        return invoice.id;
      },

      createEngagement: (partial) => {
        const business = get().business;
        const user = get().user;
        if (!business || !user) return '';
        const engagement: Engagement = {
          id: createId(),
          businessId: business.id,
          userId: user.id,
          status: 'active',
          usedSessions: 0,
          createdAt: new Date().toISOString(),
          ...partial,
          members: partial.members ?? [],
          notes: partial.notes ?? '',
        };
        set({ engagements: [engagement, ...(get().engagements ?? [])] });
        return engagement.id;
      },

      updateEngagement: (id, patch) => {
        set({
          engagements: (get().engagements ?? []).map((e) => (e.id === id ? { ...e, ...patch } : e)),
        });
      },

      completeEngagement: (id) => {
        get().updateEngagement(id, { status: 'completed' });
      },

      addMilestone: (engagementId, partial) => {
        const business = get().business;
        if (!business) return '';
        const sortOrder = (get().milestones ?? []).filter((m) => m.engagementId === engagementId).length;
        const milestone: Milestone = {
          id: createId(),
          engagementId,
          businessId: business.id,
          status: 'pending',
          sortOrder,
          ...partial,
          notes: partial.notes ?? '',
        };
        set({ milestones: [...(get().milestones ?? []), milestone] });
        return milestone.id;
      },

      updateMilestone: (id, patch) => {
        set({
          milestones: (get().milestones ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
        });
      },

      deleteMilestone: (id) => {
        set({ milestones: (get().milestones ?? []).filter((m) => m.id !== id) });
      },

      createMilestoneInvoice: (milestoneId) => {
        const milestone = (get().milestones ?? []).find((m) => m.id === milestoneId);
        const engagement = (get().engagements ?? []).find((e) => e.id === milestone?.engagementId);
        if (!milestone || !engagement) return '';
        const invoiceId = get().createInvoice({
          clientName: engagement.clientName,
          clientEmail: engagement.clientEmail,
          amount: milestone.amount,
          engagementId: engagement.id,
          milestoneId: milestone.id,
          notes: milestone.name,
        });
        get().updateMilestone(milestoneId, { invoiceId });
        return invoiceId;
      },

      logEngagementSession: (engagementId, partial) => {
        const business = get().business;
        if (!business) return '';
        const engagement = (get().engagements ?? []).find((e) => e.id === engagementId);
        if (!engagement) return '';

        const session: EngagementSession = {
          id: createId(),
          engagementId,
          businessId: business.id,
          date: partial.date,
          notes: partial.notes,
          revenue: partial.revenue,
          attendedMemberIds: partial.attendedMemberIds,
        };

        const updates: Partial<Engagement> = {};
        if (engagement.kind === 'session_pack') {
          const used = (engagement.usedSessions ?? 0) + 1;
          updates.usedSessions = used;
          if ((engagement.totalSessions ?? 0) > 0 && used >= (engagement.totalSessions ?? 0)) {
            updates.status = 'completed';
          }
        }

        set({
          engagementSessions: [session, ...(get().engagementSessions ?? [])],
          engagements: (get().engagements ?? []).map((e) =>
            e.id === engagementId ? { ...e, ...updates } : e,
          ),
        });
        return session.id;
      },

      addGroupMember: (engagementId, partial) => {
        const member: GroupMember = { id: createId(), ...partial };
        set({
          engagements: (get().engagements ?? []).map((e) =>
            e.id === engagementId
              ? { ...e, members: [...(e.members ?? []), member] }
              : e,
          ),
        });
      },

      removeGroupMember: (engagementId, memberId) => {
        set({
          engagements: (get().engagements ?? []).map((e) =>
            e.id === engagementId
              ? { ...e, members: (e.members ?? []).filter((m) => m.id !== memberId) }
              : e,
          ),
        });
      },

      updateInvoiceStatus: (id, status) => {
        set({
          invoices: get().invoices.map((inv) =>
            inv.id === id ? { ...inv, status } : inv,
          ),
        });
      },

      updateInvoice: (id, patch) => {
        set({
          invoices: get().invoices.map((inv) => {
            if (inv.id !== id) return inv;
            const next = { ...inv, ...patch };
            if (patch.clientEmail !== undefined) {
              const email = patch.clientEmail.trim();
              if (email) next.clientEmail = email;
              else delete next.clientEmail;
            }
            return next;
          }),
        });
      },

      upsertIntegrationConnection: (connection) => {
        const normalized = normalizeIntegrationConnection(
          connection as IntegrationConnection & { provider?: string; userId?: string },
        );
        const list = get().integrationConnections.filter(
          (c) =>
            c.providerId !== normalized.providerId || c.businessId !== normalized.businessId,
        );
        set({ integrationConnections: [normalized, ...list] });
      },

      removeIntegrationConnection: (connectionId) => {
        set({
          integrationConnections: get().integrationConnections.filter(
            (c) => c.id !== connectionId,
          ),
        });
      },

      updateIntegrationSync: (connectionId, patch) => {
        set({
          integrationConnections: get().integrationConnections.map((c) => {
            if (c.id !== connectionId) return c;
            const lastSyncAt = patch.lastSyncAt ?? patch.lastSync ?? c.lastSyncAt;
            const status = patch.status ?? patch.connectionStatus ?? c.status;
            return {
              ...c,
              ...patch,
              lastSyncAt,
              status,
              updatedAt: new Date().toISOString(),
            };
          }),
        });
      },

      addIntegrationLog: (log) => {
        set({ integrationLogs: [log, ...get().integrationLogs].slice(0, 100) });
      },

      upsertPaymentTransaction: (tx) => {
        const list = get().paymentTransactions.filter((t) => t.id !== tx.id);
        set({ paymentTransactions: [tx, ...list] });
      },

      applyIntegrationWebhook: (update) => {
        const result = applyWebhookPaymentUpdate(
          get().invoices,
          get().paymentTransactions,
          update,
        );
        set({
          invoices: result.invoices,
          paymentTransactions: result.paymentTransactions,
        });
      },

      upsertExternalFormConnection: (connection) => {
        const list = get().externalFormConnections.filter((c) => c.id !== connection.id);
        set({ externalFormConnections: [connection, ...list] });
      },

      removeExternalFormConnection: (connectionId) => {
        set({
          externalFormConnections: get().externalFormConnections.filter(
            (c) => c.id !== connectionId,
          ),
          externalFormSubmissions: get().externalFormSubmissions.filter(
            (s) => s.connectionId !== connectionId,
          ),
          formNotifications: get().formNotifications.filter(
            (n) => n.connectionId !== connectionId,
          ),
        });
      },

      clearAllExternalFormConnections: () => {
        const business = get().business;
        if (!business) {
          set({
            externalFormConnections: [],
            externalFormSubmissions: [],
            formNotifications: [],
          });
          return;
        }
        const connectionIds = new Set(
          get()
            .externalFormConnections.filter((c) => c.businessId === business.id)
            .map((c) => c.id),
        );
        set({
          externalFormConnections: get().externalFormConnections.filter(
            (c) => c.businessId !== business.id,
          ),
          externalFormSubmissions: get().externalFormSubmissions.filter(
            (s) => !connectionIds.has(s.connectionId),
          ),
          formNotifications: get().formNotifications.filter(
            (n) => !connectionIds.has(n.connectionId),
          ),
        });
      },

      activateExternalFormConnection: async (connectionId) => {
        const conn = get().externalFormConnections.find((c) => c.id === connectionId);
        if (!conn) return;
        const updated: ExternalFormConnection = {
          ...conn,
          isActive: true,
          updatedAt: new Date().toISOString(),
        };
        get().upsertExternalFormConnection(updated);
        try {
          await registerExternalFormConnection(updated);
        } catch (e) {
          get().upsertExternalFormConnection({
            ...conn,
            isActive: false,
            updatedAt: new Date().toISOString(),
          });
          throw e;
        }
      },

      processExternalFormSubmission: (params) => {
        const business = get().business;
        const user = get().user;
        if (!business || !user) {
          logPipelineStage('SUBMISSION_FAILED', {
            error: 'No business or user session',
            payload: params.rawPayload,
          });
          return null;
        }

        const connection = get().externalFormConnections.find(
          (c) => c.id === params.connectionId,
        );
        if (!connection) {
          logPipelineStage('SUBMISSION_FAILED', {
            error: `Connection not found locally: ${params.connectionId}`,
            payload: params.rawPayload,
          });
          return null;
        }

        const now = new Date().toISOString();
        const submissionId = params.submissionId ?? createId();
        let normalized: NormalizedFormPayload;
        try {
          const provider = getExternalFormProvider(connection.provider);
          const rawFieldKeys = Object.keys(provider.extractFields(params.rawPayload));
          normalized = normalizeSubmission(connection, params.rawPayload);
          if (params.externalSubmissionId) {
            normalized.externalSubmissionId = params.externalSubmissionId;
          }
          logPipelineStage('NORMALIZED_FIELDS', {
            lastNormalizedFields: normalized.fields as Record<string, string>,
            lastRawFieldKeys: rawFieldKeys,
          });
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : 'Mapping failed';
          logPipelineStage('SUBMISSION_FAILED', {
            error: errMsg,
            payload: params.rawPayload,
          });
          const failed: ExternalFormSubmission = {
            id: submissionId,
            businessId: business.id,
            connectionId: connection.id,
            provider: connection.provider,
            externalSubmissionId: params.externalSubmissionId,
            rawPayload: params.rawPayload,
            normalizedPayload: {
              fields: {},
              unmapped: {},
              sourceProvider: connection.provider,
            },
            status: 'failed',
            errorMessage: e instanceof Error ? e.message : 'Mapping failed',
            createdAt: now,
            updatedAt: now,
          };
          set({
            externalFormSubmissions: [failed, ...get().externalFormSubmissions],
          });
          return null;
        }

        const dup = get().externalFormSubmissions.find(
          (s) =>
            s.connectionId === connection.id &&
            s.status === 'created' &&
            (s.externalSubmissionId === normalized.externalSubmissionId ||
              (normalized.externalSubmissionId &&
                s.externalSubmissionId === normalized.externalSubmissionId)),
        );
        if (dup?.createdActivityId) return dup.createdActivityId;

        try {
          const { event, values, clientKey } = prepareActivityFromFormSubmission({
            connection,
            submission: {
              id: submissionId,
              rawPayload: params.rawPayload,
              normalizedPayload: normalized,
              externalSubmissionId: normalized.externalSubmissionId,
            },
            categories: get().categories,
            events: get().events,
            leads: get().leads,
            businessId: business.id,
            userId: user.id,
          });

          logPipelineStage('ACTIVITY_PREPARED', {
            lastNormalizedFields: normalized.fields as Record<string, string>,
          });

          const eventId = get().addEvent(event, values);
          if (!eventId) throw new Error('יצירת פעילות נכשלה');

          logPipelineStage('ACTIVITY_CREATED', { lastCreatedActivityId: eventId });

          const phone = normalized.fields.clientPhone?.trim();
          const email = normalized.fields.clientEmail?.trim();
          const name = normalized.fields.clientName?.trim();
          if (name && (phone || email)) {
            const exists = get().leads.some(
              (l) =>
                (phone && l.phone?.replace(/\D/g, '') === phone.replace(/\D/g, '')) ||
                (email && l.email?.trim().toLowerCase() === email.toLowerCase()),
            );
            if (!exists) {
              get().addLead({
                name,
                phone: phone ?? '',
                email: email ?? '',
                source: 'website',
                serviceInterest: connection.formName,
                notes: 'נוצר מטופס חיצוני',
                externalProvider: 'website',
                externalFormId: connection.id,
                externalFormName: connection.formName,
                formAnswers: Object.entries(normalized.fields).map(([field, value]) => ({
                  field,
                  value: value ?? '',
                })),
              });
            }
          }

          const record: ExternalFormSubmission = {
            id: submissionId,
            businessId: business.id,
            connectionId: connection.id,
            provider: connection.provider,
            externalSubmissionId: normalized.externalSubmissionId,
            rawPayload: params.rawPayload,
            normalizedPayload: normalized,
            createdActivityId: eventId,
            createdClientId: clientKey,
            status: 'created',
            createdAt: now,
            updatedAt: now,
          };

          const notification = buildFormActivityNotification({
            id: createId(),
            connection,
            activityId: eventId,
            normalized,
            createdAt: now,
          });

          set({
            externalFormSubmissions: [record, ...get().externalFormSubmissions],
            externalFormConnections: get().externalFormConnections.map((c) =>
              c.id === connection.id
                ? {
                    ...c,
                    submissionCount: c.submissionCount + 1,
                    lastSubmissionAt: now,
                    updatedAt: now,
                  }
                : c,
            ),
            formNotifications: [notification, ...get().formNotifications].slice(0, 20),
          });
          return eventId;
        } catch (e) {
          const errMsg = e instanceof Error ? e.message : 'Create activity failed';
          logAutomationError('processSubmission', errMsg);
          logPipelineStage('SUBMISSION_FAILED', {
            error: errMsg,
            payload: params.rawPayload,
            lastNormalizedFields: normalized.fields as Record<string, string>,
          });
          const failed: ExternalFormSubmission = {
            id: submissionId,
            businessId: business.id,
            connectionId: connection.id,
            provider: connection.provider,
            externalSubmissionId: normalized.externalSubmissionId,
            rawPayload: params.rawPayload,
            normalizedPayload: normalized,
            status: 'failed',
            errorMessage: errMsg,
            createdAt: now,
            updatedAt: now,
          };
          set({
            externalFormSubmissions: [failed, ...get().externalFormSubmissions],
          });
          return null;
        }
      },

      retryExternalFormSubmission: (submissionId) => {
        const sub = get().externalFormSubmissions.find((s) => s.id === submissionId);
        if (!sub || sub.status !== 'failed') return null;
        set({
          externalFormSubmissions: get().externalFormSubmissions.filter(
            (s) => s.id !== submissionId,
          ),
        });
        return get().processExternalFormSubmission({
          connectionId: sub.connectionId,
          rawPayload: sub.rawPayload,
          externalSubmissionId: sub.externalSubmissionId,
          submissionId: sub.id,
        });
      },

      dismissFormNotification: (id) => {
        set({
          formNotifications: get().formNotifications.map((n) =>
            n.id === id ? { ...n, read: true } : n,
          ),
        });
      },

      markFormNotificationHandled: (id) => {
        set({
          formNotifications: get().formNotifications.map((n) =>
            n.id === id ? { ...n, read: true, handled: true } : n,
          ),
        });
      },

      markFormNotificationsHandledForActivity: (activityId) => {
        set({
          formNotifications: get().formNotifications.map((n) =>
            n.activityId === activityId ? { ...n, read: true, handled: true } : n,
          ),
        });
      },

      addEventTemplate: (partial) => {
        const business = get().business;
        if (!business) return;
        const template: EventTemplate = {
          id: createId(),
          businessId: business.id,
          ...partial,
        };
        set({ eventTemplates: [...get().eventTemplates, template] });
      },

      deleteEventTemplate: (id) => {
        set({
          eventTemplates: get().eventTemplates.filter((t) => t.id !== id),
        });
      },

      addTask: (title, dueDate) => {
        const business = get().business;
        if (!business) return;
        const task: Task = {
          id: createId(),
          businessId: business.id,
          title: title.trim(),
          dueDate,
          done: false,
          createdAt: new Date().toISOString(),
        };
        set({ tasks: [task, ...get().tasks] });
      },

      toggleTask: (id) => {
        set({
          tasks: get().tasks.map((t) =>
            t.id === id
              ? {
                  ...t,
                  done: !t.done,
                  doneAt: !t.done ? new Date().toISOString() : undefined,
                }
              : t,
          ),
        });
      },

      deleteTask: (id) => {
        set({ tasks: get().tasks.filter((t) => t.id !== id) });
      },

      dismissAutoTask: (autoId) => {
        const list = get().dismissedAutoTasks;
        if (list.includes(autoId)) return;
        set({ dismissedAutoTasks: [...list, autoId] });
      },

      restoreAppState: (state) => {
        set({
          ...state,
          invoices: migrateInvoices(state.invoices ?? []),
          eventTemplates: state.eventTemplates ?? [],
          tasks: state.tasks ?? [],
          dismissedAutoTasks: state.dismissedAutoTasks ?? [],
          engagements: state.engagements ?? [],
          milestones: state.milestones ?? [],
          engagementSessions: state.engagementSessions ?? [],
          integrationConnections: migrateIntegrationConnections(state.integrationConnections),
          integrationLogs: state.integrationLogs ?? [],
          paymentTransactions: state.paymentTransactions ?? [],
          externalFormConnections: state.externalFormConnections ?? [],
          externalFormSubmissions: state.externalFormSubmissions ?? [],
          formNotifications: state.formNotifications ?? [],
          monthlyExpenses: state.monthlyExpenses ?? [],
        });
      },

      importHistoricalEvents: (rows) => {
        const business = get().business;
        const user = get().user;
        if (!business || !user || rows.length === 0) return 0;

        get().ensureCustomerSourceCategory();
        const categories = get().categories;

        const result = importEventsIntoState(
          rows,
          business.id,
          user.id,
          categories,
          get().events,
          get().eventValues,
        );

        try {
          set({
            events: result.events,
            eventValues: result.eventValues,
          });
        } catch (e) {
          console.error('import set failed', e);
          return 0;
        }

        return result.imported;
      },
    }),
    {
      name: STORAGE_KEY,
      version: 12,
      storage: createJSONStorage(() => safeJsonStorage),
      onRehydrateStorage: () => (_state, err) => {
        if (err) {
          console.error('שגיאת טעינת נתונים:', err);
          clearAppStorage();
        }
      },
      migrate: (persisted, version) => {
        const p = normalizeEngagementState(persisted as Partial<AppState>) as Partial<AppState>;
        if (version < 12) {
          return {
            ...p,
            invoices: migrateInvoices(p.invoices),
            integrationConnections: migrateIntegrationConnections(p.integrationConnections),
            integrationLogs: [],
            paymentTransactions: [],
          };
        }
        return p;
      },
      merge: (persisted, current) => {
        try {
          const p = normalizeEngagementState((persisted ?? {}) as Partial<AppState>);
          return {
            ...current,
            ...p,
            user: p.user ?? current.user,
            leads: Array.isArray(p.leads) ? p.leads : [],
            invoices: migrateInvoices(p.invoices),
            nextInvoiceNumber:
              typeof p.nextInvoiceNumber === 'number' ? p.nextInvoiceNumber : 1001,
            eventTemplates: Array.isArray(p.eventTemplates) ? p.eventTemplates : [],
            tasks: Array.isArray(p.tasks) ? p.tasks : [],
            dismissedAutoTasks: Array.isArray(p.dismissedAutoTasks)
              ? p.dismissedAutoTasks
              : [],
            events: Array.isArray(p.events) ? p.events : [],
            eventValues: Array.isArray(p.eventValues) ? p.eventValues : [],
            categories: normalizeCategorySortOrders(
              Array.isArray(p.categories) ? (p.categories as Category[]) : [],
            ),
            integrationConnections: migrateIntegrationConnections(p.integrationConnections),
            integrationLogs: Array.isArray(p.integrationLogs) ? p.integrationLogs : [],
            paymentTransactions: Array.isArray(p.paymentTransactions) ? p.paymentTransactions : [],
            externalFormConnections: Array.isArray(p.externalFormConnections)
              ? p.externalFormConnections
              : [],
            externalFormSubmissions: Array.isArray(p.externalFormSubmissions)
              ? p.externalFormSubmissions
              : [],
            formNotifications: Array.isArray(p.formNotifications) ? p.formNotifications : [],
            monthlyExpenses: Array.isArray(p.monthlyExpenses) ? p.monthlyExpenses : [],
            business: p.business
              ? normalizeBusiness({
                  ...p.business,
                  expenseTrackingMode: p.business.expenseTrackingMode ?? 'both',
                })
              : current.business,
          };
        } catch {
          return current;
        }
      },
    },
  ),
);
