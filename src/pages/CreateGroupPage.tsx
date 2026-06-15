import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BottomNav } from '../components/BottomNav';
import { WEEKDAY_LABELS } from '../lib/engagements';
import { useAppStore } from '../store/useAppStore';

export function CreateGroupPage() {
  const navigate = useNavigate();
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
        <Link to="/create" className="page-back">
          ← חזרה
        </Link>
        <h1 className="page-title">חוג / קבוצה חדשה</h1>
        <p className="page-subtitle">יום קבוע · תשלום לכל שיעור</p>

        <form onSubmit={handleSubmit} className="card">
          <div className="field">
            <label htmlFor="grp-title">שם החוג *</label>
            <input
              id="grp-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="לדוגמה: אנגלית — שלישי בוקר"
              required
            />
          </div>
          <div className="field">
            <label htmlFor="grp-day">יום קבוע בשבוע</label>
            <select id="grp-day" value={weekday} onChange={(e) => setWeekday(e.target.value)}>
              {WEEKDAY_LABELS.map((label, i) => (
                <option key={label} value={i}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="grp-time">שעה (אופציונלי)</label>
            <input
              id="grp-time"
              type="time"
              value={lessonTime}
              onChange={(e) => setLessonTime(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="grp-price">מחיר לתלמיד לשיעור (₪)</label>
            <input
              id="grp-price"
              type="number"
              min={0}
              value={pricePerStudent}
              onChange={(e) => setPricePerStudent(e.target.value)}
              placeholder="לדוגמה: 120"
            />
          </div>

          <fieldset className="engagement-fieldset">
            <legend>תלמיד/ה ראשון/ה (אופציונלי)</legend>
            <div className="field">
              <label htmlFor="grp-student">שם התלמיד/ה</label>
              <input
                id="grp-student"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="grp-parent">שם הורה</label>
              <input
                id="grp-parent"
                value={parentName}
                onChange={(e) => setParentName(e.target.value)}
              />
            </div>
          </fieldset>

          <button type="submit" className="btn btn-primary">
            צור חוג
          </button>
        </form>
      </div>
      <BottomNav />
    </div>
  );
}
