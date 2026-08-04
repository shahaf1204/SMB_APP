import { FormEvent, useMemo, useState } from 'react';
import { Banknote, Calendar, StickyNote, User } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { FormSection } from '../components/ui/FormSection';
import { formCopyText, getBusinessAwareFormCopy } from '../config/businessFormCopy';
import { useGuardCreateRoute } from '../hooks/useGuardCreateRoute';
import { getEnabledCreationModels } from '../lib/workspace/creationModels';
import { getOperatingModelFinancialField } from '../lib/finance/operatingModelFinancialField';
import { useAppStore } from '../store/useAppStore';
import type { OperatingModel } from '../types/workspace';

export function CreateProjectPage() {
  const navigate = useNavigate();
  const location = useLocation();
  useGuardCreateRoute();
  const business = useAppStore((s) => s.business)!;
  const createModels = getEnabledCreationModels(business);
  const backTo = createModels.length > 1 ? '/create' : '/activities';
  const createEngagement = useAppStore((s) => s.createEngagement);
  const addMilestone = useAppStore((s) => s.addMilestone);

  const operatingModel = useMemo((): OperatingModel => {
    const fromState = (location.state as { operatingModel?: OperatingModel } | null)
      ?.operatingModel;
    if (fromState === 'journey' || fromState === 'project') return fromState;
    if (createModels.length === 1 && createModels[0].id === 'journey') return 'journey';
    if (business.workspace?.primaryOperatingModel === 'journey') return 'journey';
    return 'project';
  }, [location.state, createModels, business.workspace?.primaryOperatingModel]);

  const businessType = business.presetId ?? business.workspace?.businessType;
  const copyParams = { businessType, operatingModel };
  const revenueField = getOperatingModelFinancialField(operatingModel);
  const titleCopy = getBusinessAwareFormCopy({ ...copyParams, fieldKey: 'title' });

  const [clientName, setClientName] = useState('');
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [notes, setNotes] = useState('');
  const [projectValue, setProjectValue] = useState('');
  const [milestoneName, setMilestoneName] = useState('');
  const [milestoneAmount, setMilestoneAmount] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !title.trim()) return;

    const parsedValue = Number(projectValue.replace(/[^\d.]/g, ''));
    const parsedMilestone = Number(milestoneAmount.replace(/[^\d.]/g, ''));

    const id = createEngagement(
      {
        kind: 'project',
        title: title.trim(),
        clientName: clientName.trim(),
        clientEmail: clientEmail.trim() || undefined,
        startDate,
        endDate: endDate || undefined,
        notes: notes.trim(),
        totalValue: parsedMilestone > 0 ? undefined : parsedValue > 0 ? parsedValue : undefined,
      },
      { operatingModel },
    );

    if (id && milestoneName.trim() && parsedMilestone > 0) {
      addMilestone(id, {
        name: milestoneName.trim(),
        amount: parsedMilestone,
        notes: '',
      });
    }

    if (id) navigate(`/engagements/${id}`);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to={backTo} className="page-back">← חזרה</Link>
        <h1 className="page-title">
          {formCopyText({ ...copyParams, fieldKey: 'pageTitle' }, 'label', operatingModel === 'journey' ? 'תהליך חדש' : 'פרויקט חדש')}
        </h1>
        <p className="page-subtitle">
          {formCopyText({ ...copyParams, fieldKey: 'pageSubtitle' }, 'label', 'ניהול שלבים, תאריכים ותשלומים')}
        </p>

        <form onSubmit={handleSubmit} className="form-stack">
          <FormSection title="פרטי לקוח" icon={User}>
            <div className="field">
              <label htmlFor="proj-client">שם לקוח *</label>
              <input id="proj-client" value={clientName} onChange={(e) => setClientName(e.target.value)} required />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="proj-email">אימייל לקוח</label>
              <input id="proj-email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} dir="ltr" />
            </div>
          </FormSection>

          <FormSection title="פרטי פעילות" icon={Calendar}>
            <div className="field">
              <label htmlFor="proj-title">שם {operatingModel === 'journey' ? 'התהליך' : 'הפרויקט'} *</label>
              <input
                id="proj-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={titleCopy.placeholder}
                required
              />
              {titleCopy.example && (
                <p className="field-hint">{titleCopy.example}</p>
              )}
            </div>
            <div className="field">
              <label htmlFor="proj-start">תאריך התחלה</label>
              <input id="proj-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="proj-end">תאריך סיום (אופציונלי)</label>
              <input id="proj-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </FormSection>

          <FormSection title="תשלום" icon={Banknote}>
            <div className="field">
              <label htmlFor="proj-value">{revenueField.label}</label>
              <input
                id="proj-value"
                type="number"
                min={0}
                value={projectValue}
                onChange={(e) => setProjectValue(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="field">
              <label htmlFor="ms-name">אבן דרך ראשונה (אופציונלי)</label>
              <input
                id="ms-name"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
                placeholder={formCopyText({ ...copyParams, fieldKey: 'milestoneName' }, 'placeholder', 'למשל: שלב ראשון')}
              />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="ms-amount">סכום אבן דרך (₪)</label>
              <input
                id="ms-amount"
                type="number"
                min={0}
                value={milestoneAmount}
                onChange={(e) => setMilestoneAmount(e.target.value)}
              />
            </div>
          </FormSection>

          <FormSection title="הערות" icon={StickyNote}>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="proj-notes">הערות</label>
              <textarea id="proj-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
            </div>
          </FormSection>

          <button type="submit" className="btn btn-primary form-submit-btn">
            {formCopyText(
              { ...copyParams, fieldKey: 'submit' },
              'label',
              operatingModel === 'journey' ? 'צור תהליך' : 'צור פרויקט',
            )}
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
