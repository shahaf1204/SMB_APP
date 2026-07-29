import { FormEvent, useState } from 'react';
import { Calendar, User } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { FormSection } from '../components/ui/FormSection';
import { WEEKDAY_LABELS } from '../lib/engagements';
import { useGuardCreateRoute } from '../hooks/useGuardCreateRoute';
import { getEnabledCreationModels } from '../lib/workspace/creationModels';
import { useAppStore } from '../store/useAppStore';

export function CreateGroupPage() {
  const navigate = useNavigate();
  useGuardCreateRoute();
  const business = useAppStore((s) => s.business)!;
  const createModels = getEnabledCreationModels(business);
  const backTo = createModels.length > 1 ? '/create' : '/activities';
  const createEngagement = useAppStore((s) => s.createEngagement);
  const addGroupMember = useAppStore((s) => s.addGroupMember);

  const [title, setTitle] = useState('');
  const [weekday, setWeekday] = useState('2');
  const [lessonTime, setLessonTime] = useState('');
  const [pricePerStudent, setPricePerStudent] = useState('');
  const [studentName, setStudentName] = useState('');
  const [parentName, setParentName] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const id = createEngagement({
      kind: 'recurring_group',
      title: title.trim(),
      clientName: title.trim(),
      startDate: new Date().toISOString().slice(0, 10),
      weekday: Number(weekday),
      lessonTime: lessonTime.trim() || undefined,
      pricePerStudent: pricePerStudent ? Number(pricePerStudent) : undefined,
      notes: '',
      members: [],
    });

    if (id && studentName.trim()) {
      addGroupMember(id, {
        studentName: studentName.trim(),
        parentName: parentName.trim() || undefined,
      });
    }

    if (id) navigate(`/engagements/${id}`);
  };

  return (
    <div className="app-shell">
      <div className="page">
        <Link to={backTo} className="page-back">← חזרה</Link>
        <h1 className="page-title">חוג / קבוצה חדשה</h1>
        <p className="page-subtitle">יום קבוע · תשלום לכל שיעור</p>

        <form onSubmit={handleSubmit} className="form-stack">
          <FormSection title="פרטי פעילות" icon={Calendar}>
            <div className="field">
              <label htmlFor="grp-title">שם החוג *</label>
              <input id="grp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="אנגלית — שלישי בוקר" required />
            </div>
            <div className="field">
              <label htmlFor="grp-day">יום קבוע בשבוע</label>
              <select id="grp-day" value={weekday} onChange={(e) => setWeekday(e.target.value)}>
                {WEEKDAY_LABELS.map((label, i) => (
                  <option key={label} value={i}>{label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="grp-time">שעה (אופציונלי)</label>
              <input id="grp-time" type="time" value={lessonTime} onChange={(e) => setLessonTime(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="grp-price">מחיר לתלמיד לשיעור (₪)</label>
              <input id="grp-price" type="number" min={0} value={pricePerStudent} onChange={(e) => setPricePerStudent(e.target.value)} placeholder="120" />
            </div>
          </FormSection>

          <FormSection title="פרטי לקוח" icon={User}>
            <div className="field">
              <label htmlFor="grp-student">תלמיד/ה ראשון/ה (אופציונלי)</label>
              <input id="grp-student" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="grp-parent">שם הורה</label>
              <input id="grp-parent" value={parentName} onChange={(e) => setParentName(e.target.value)} />
            </div>
          </FormSection>

          <button type="submit" className="btn btn-primary form-submit-btn">צור חוג</button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
