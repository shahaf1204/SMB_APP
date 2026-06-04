import { useAppStore } from '../store/useAppStore';
import type { AppState } from '../types/models';

export function getAppSnapshot(): AppState {
  const s = useAppStore.getState();
  return {
    user: s.user,
    business: s.business,
    categories: s.categories,
    events: s.events,
    eventValues: s.eventValues,
    leads: s.leads,
    invoices: s.invoices,
    nextInvoiceNumber: s.nextInvoiceNumber,
    eventTemplates: s.eventTemplates,
    tasks: s.tasks,
    dismissedAutoTasks: s.dismissedAutoTasks,
  };
}
