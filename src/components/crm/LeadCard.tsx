import { Link } from 'react-router-dom';
import { CRM_SOURCE_LABELS, LEAD_STATUS_LABELS } from '../../lib/crm/constants';
import { formatDate } from '../../lib/finance';
import type { Lead } from '../../types/models';

interface LeadCardProps {
  lead: Lead;
}

export function LeadCard({ lead }: LeadCardProps) {
  const sourceLabel = CRM_SOURCE_LABELS[lead.source] ?? lead.source;
  const statusLabel = LEAD_STATUS_LABELS[lead.status] ?? lead.status;

  return (
    <article className="card crm-lead-card">
      <div className="crm-lead-card-head">
        <h3 className="crm-lead-name">{lead.name}</h3>
        <span className={`crm-status-badge crm-status-${lead.status}`}>{statusLabel}</span>
      </div>
      {lead.phone && <p className="crm-lead-line">📞 {lead.phone}</p>}
      {lead.email && <p className="crm-lead-line">✉️ {lead.email}</p>}
      <p className="crm-lead-meta">
        {sourceLabel}
        {lead.externalFormName ? ` · ${lead.externalFormName}` : ''}
        {lead.externalCampaignName ? ` · ${lead.externalCampaignName}` : ''}
      </p>
      {lead.serviceInterest && (
        <p className="crm-lead-interest">{lead.serviceInterest}</p>
      )}
      <p className="crm-lead-date">{formatDate(lead.createdAt.slice(0, 10))}</p>
      <Link to={`/leads/${lead.id}`} className="btn btn-primary crm-lead-open">
        פתח
      </Link>
    </article>
  );
}
