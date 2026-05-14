import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { Spinner } from '@/components/ui/Spinner';

export function OAuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { setAuth, setAccessToken } = useAuthStore();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Extract access_token from hash (e.g. #access_token=...)
        const hash = location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');

        if (!accessToken) {
          setError('No access token found in URL.');
          return;
        }

        // Temporarily set the access token so the API client uses it
        setAccessToken(accessToken);

        // Fetch the user's full profile
        const response = await api.get('/auth/me');
        
        if (response.data.success) {
          // Fully authenticate the user
          setAuth(response.data.data, accessToken);
          navigate('/dashboard', { replace: true });
        } else {
          setError('Failed to fetch user profile.');
        }
      } catch (err) {
        console.error('OAuth Callback Error:', err);
        setError('An error occurred during authentication.');
      }
    };

    processCallback();
  }, [location, navigate, setAuth, setAccessToken]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="rounded-xl bg-red-50 p-6 text-center text-red-800 border border-red-200">
          <h2 className="mb-2 text-lg font-semibold">Authentication Failed</h2>
          <p>{error}</p>
          <button 
            onClick={() => navigate('/signin')}
            className="mt-4 rounded bg-red-100 px-4 py-2 text-sm font-medium hover:bg-red-200"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-primary">
      <Spinner size="lg" />
      <p className="text-sm font-medium text-text-secondary">Completing sign in...</p>
    </div>
  );
}
