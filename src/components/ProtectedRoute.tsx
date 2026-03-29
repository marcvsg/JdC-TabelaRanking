import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import type { ReactNode } from 'react';
import duckImg from '../assets/imgs/duck.png';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <img src={duckImg} alt="Loading..." className="loading-logo" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
