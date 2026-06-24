/**
 * CRM types — Meta connection + future pipeline structure.
 * Flow: Lead → Contact → Customer → Activity
 */

export interface MetaConnection {
  id: string;
  ownerId: string;
  businessId: string;
  pageId: string;
  pageName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CrmStage = 'lead' | 'contact' | 'customer';

export interface CrmContact {
  id: string;
  businessId: string;
  leadId?: string;
  name: string;
  phone?: string;
  email?: string;
  stage: CrmStage;
  customerKey?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CrmActivityRef {
  id: string;
  kind: 'event' | 'engagement' | 'invoice' | 'task';
  title: string;
  date?: string;
  href: string;
}

export interface CrmCustomerProfile {
  key: string;
  name: string;
  contactId?: string;
  leadIds: string[];
  activities: CrmActivityRef[];
  totalRevenue: number;
}
