import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { buildCustomerSummaries } from '../../lib/customers';
import type { Category, Event, EventValue, Invoice, Lead } from '../../types/models';

interface ClientFieldGroupProps {
  clientCategory: Category | undefined;
  clientValue: string;
  onClientValueChange: (value: string) => void;
  clientEmail: string;
  clientPhone: string;
  onClientEmailChange: (value: string) => void;
  onClientPhoneChange: (value: string) => void;
  events: Event[];
  leads: Lead[];
  invoices: Invoice[];
  categories: Category[];
  eventValues: EventValue[];
}

export function ClientFieldGroup({
  clientCategory,
  clientValue,
  onClientValueChange,
  clientEmail,
  clientPhone,
  onClientEmailChange,
  onClientPhoneChange,
  events,
  leads,
  invoices,
  categories,
  eventValues,
}: ClientFieldGroupProps) {
  const customers = useMemo(
    () => buildCustomerSummaries(events, leads, invoices, categories, eventValues),
    [events, leads, invoices, categories, eventValues],
  );

  const matchedCustomer = useMemo(
    () =>
      customers.find(
        (c) => c.name.trim().toLowerCase() === clientValue.trim().toLowerCase(),
      ) ?? null,
    [customers, clientValue],
  );

  const [newClientMode, setNewClientMode] = useState(!matchedCustomer && Boolean(clientValue));

  const showContactFields = newClientMode || !matchedCustomer;

  const handleSelectCustomer = (name: string) => {
    if (!name) {
      onClientValueChange('');
      setNewClientMode(false);
      return;
    }
    const customer = customers.find((c) => c.name === name);
    onClientValueChange(name);
    if (customer) {
      setNewClientMode(false);
      if (customer.email) onClientEmailChange(customer.email);
      if (customer.phone) onClientPhoneChange(customer.phone);
    }
  };

  return (
    <div className="client-field-group">
      <div className="field">
        <label htmlFor="client-select">בחר לקוח</label>
        <select
          id="client-select"
          value={matchedCustomer?.name ?? (newClientMode ? '__new__' : clientValue ? '__custom__' : '')}
          onChange={(e) => {
            const v = e.target.value;
            if (v === '__new__') {
              setNewClientMode(true);
              onClientValueChange('');
              onClientEmailChange('');
              onClientPhoneChange('');
              return;
            }
            if (v === '__custom__') return;
            handleSelectCustomer(v);
          }}
        >
          <option value="">בחרו לקוח</option>
          {customers.map((c) => (
            <option key={c.key} value={c.name}>
              {c.name}
            </option>
          ))}
          <option value="__new__">+ לקוח חדש</option>
          {clientValue && !matchedCustomer && !newClientMode && (
            <option value="__custom__">{clientValue}</option>
          )}
        </select>
      </div>

      {(newClientMode || (!matchedCustomer && clientValue)) && clientCategory && (
        <div className="field">
          <label htmlFor="client-name-input">{clientCategory.name}</label>
          <input
            id="client-name-input"
            value={clientValue}
            onChange={(e) => onClientValueChange(e.target.value)}
            placeholder="שם הלקוח"
            required
          />
        </div>
      )}

      {showContactFields && (
        <>
          <div className="field">
            <label htmlFor="client-email">אימייל</label>
            <input
              id="client-email"
              type="email"
              value={clientEmail}
              onChange={(e) => onClientEmailChange(e.target.value)}
              placeholder="client@example.com"
              dir="ltr"
              autoComplete="email"
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="client-phone">טלפון</label>
            <input
              id="client-phone"
              type="tel"
              value={clientPhone}
              onChange={(e) => onClientPhoneChange(e.target.value)}
              placeholder="050-1234567"
              dir="ltr"
              autoComplete="tel"
            />
          </div>
        </>
      )}

      {matchedCustomer && !showContactFields && (
        <p className="field-hint client-field-group__selected-hint">
          {matchedCustomer.phone || matchedCustomer.email
            ? [matchedCustomer.phone, matchedCustomer.email].filter(Boolean).join(' · ')
            : 'פרטי קשר שמורים על הלקוח'}
          <button
            type="button"
            className="btn btn-ghost btn-sm client-field-group__edit-contact"
            onClick={() => setNewClientMode(true)}
          >
            <Plus size={14} aria-hidden /> עריכת פרטי קשר
          </button>
        </p>
      )}
    </div>
  );
}
