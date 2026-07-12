import { Navigate, useParams } from 'react-router-dom';

export function RedirectExternalFormManage() {
  const { id } = useParams();
  return <Navigate to={`/sources/forms/${id ?? ''}`} replace />;
}
