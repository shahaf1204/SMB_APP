import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { findAccountSnapshot, flushAccountSnapshot } from '../lib/accountArchive';
import {
  ensureAccountInRegistry,
  findAccountByEmail,
  registerAccount,
  updateAccountDisplayName,
} from '../lib/accountsRegistry';
import { clearAppStorage, safeJsonStorage, STORAGE_KEY } from '../lib/safeStorage';
import {
  buildCategoriesFromPreset,
  buildGenericCategories,
  BUSINESS_TYPE_PRESETS,
} from '../data/businessTypePresets';
import { CUSTOMER_SOURCE_CATEGORY_NAME } from '../data/leadSources';
import { buildEventValuesFromInputs } from '../lib/eventForm';
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
  Lead,
  LeadStatus,
  Milestone,
  Task,
} from '../types/models';

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
  }) => void;
  ensureCustomerSourceCategory: () => void;
  addCategory: (category: Omit<Category, 'id' | 'businessId' | 'isActive'> & { isActive?: boolean }) => void;
  deleteCategory: (id: string) => void;
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
    },
  ) => void;
  updateLead: (id: string, patch: Partial<Pick<Lead, 'status' | 'notes' | 'phone' | 'email' | 'name'>>) => void;
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
    patch: Partial<Pick<Invoice, 'clientEmail' | 'notes'>>,
  ) => void;
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
    const row = inv as Invoice;
    return {
      ...row,
      dueDate: row.dueDate ?? row.issuedAt ?? new Date().toISOString().slice(0, 10),
    };
  });
}

function normalizeEngagementState(p: Partial<AppState>): Partial<AppState> {
  return {
    ...p,
    engagements: Array.isArray(p.engagements) ? p.engagements : [],
    milestones: Array.isArray(p.milestones) ? p.milestones : [],
    engagementSessions: Array.isArray(p.engagementSessions) ? p.engagementSessions : [],
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
        if (state.user) {
          flushAccountSnapshot(state);
        }
        set({ ...initialState });
      },

      createBusiness: ({ name, businessType, isGeneric, businessTypeFromList, presetId }) => {
        const user = get().user;
        if (!user) return;

        const prev = get().business;
        const trimmedName = name.trim();

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
            business: {
              ...archived.business,
              name: trimmedName,
              businessType,
              isGeneric,
              businessTypeFromList,
            },
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
        };
        set({ categories: [...get().categories, category] });
      },

      deleteCategory: (id) => {
        const hasValues = get().eventValues.some((ev) => ev.categoryId === id);
        if (hasValues) {
          set({
            categories: get().categories.map((c) =>
              c.id === id ? { ...c, isActive: false } : c,
            ),
          });
        } else {
          set({ categories: get().categories.filter((c) => c.id !== id) });
        }
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
        const lead: Lead = {
          id: createId(),
          businessId: business.id,
          userId: user.id,
          status: 'new',
          ...partial,
          createdAt: partial.createdAt ?? new Date().toISOString(),
        };
        set({ leads: [lead, ...get().leads] });
      },

      updateLead: (id, patch) => {
        set({
          leads: get().leads.map((l) => (l.id === id ? { ...l, ...patch } : l)),
        });
      },

      linkLeadToEvent: (leadId, eventId) => {
        set({
          leads: get().leads.map((l) =>
            l.id === leadId ? { ...l, eventId, status: 'won' as LeadStatus } : l,
          ),
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
      version: 5,
      storage: createJSONStorage(() => safeJsonStorage),
      onRehydrateStorage: () => (_state, err) => {
        if (err) {
          console.error('שגיאת טעינת נתונים:', err);
          clearAppStorage();
        }
      },
      migrate: (persisted) => normalizeEngagementState(persisted as Partial<AppState>),
      merge: (persisted, current) => {
        try {
          const p = normalizeEngagementState((persisted ?? {}) as Partial<AppState>);
          return {
            ...current,
            ...p,
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
            categories: Array.isArray(p.categories) ? p.categories : [],
          };
        } catch {
          return current;
        }
      },
    },
  ),
);
