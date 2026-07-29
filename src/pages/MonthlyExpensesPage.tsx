import { Navigate, useLocation } from 'react-router-dom';

/** Legacy route — redirects to finance expenses tab. */
export function MonthlyExpensesPage() {
  const location = useLocation();
  const suffix = location.search.includes('new=1') ? '?tab=expenses&new=1' : '?tab=expenses';
  return <Navigate to={`/invoices${suffix}`} replace />;
}
