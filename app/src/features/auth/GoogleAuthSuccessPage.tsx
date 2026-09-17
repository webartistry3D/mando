import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function GoogleAuthSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchMe } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      navigate('/login?error=google_no_token');
      return;
    }

    localStorage.setItem('mando_token', token);
    fetchMe()
      .then(() => navigate('/dashboard'))
      .catch(() => {
        localStorage.removeItem('mando_token');
        navigate('/login?error=google_auth_failed');
      });
  }, [searchParams, navigate, fetchMe]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  );
}
