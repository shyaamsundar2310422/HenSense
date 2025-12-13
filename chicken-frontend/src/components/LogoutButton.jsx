import { useAuth } from '../contexts/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();

  const handle = () => {
    logout();
    // after logout, go to home
    window.location.hash = '#/';
    // optional: reload so App picks guest history key
    setTimeout(() => window.location.reload(), 80);
  };

  return (
    <button
      onClick={handle}
      className="px-3 py-1 rounded-md border bg-white/10 text-white text-sm"
    >
      Logout
    </button>
  );
}
