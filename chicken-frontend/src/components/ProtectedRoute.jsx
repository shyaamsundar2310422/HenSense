// src/components/ProtectedRoute.jsx
import { useAuth } from '../contexts/AuthContext';

export default function ProtectedRoute({ children, fallback = null }) {
  const { user } = useAuth();
  if (!user) {
    // if no user, redirect client-side to login
    window.location.hash = '#/login';
    return fallback;
  }
  return children;
}
