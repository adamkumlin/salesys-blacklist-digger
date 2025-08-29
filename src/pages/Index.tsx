import { useState } from 'react';
import { LoginForm } from '@/components/LoginForm';
import { BlacklistManager } from '@/components/BlacklistManager';
import { ApiClient } from '@/lib/api';

const Index = () => {
  const [bearerToken, setBearerToken] = useState<string | null>(null);
  const [apiClient, setApiClient] = useState<ApiClient | null>(null);

  const handleLogin = (token: string) => {
    setBearerToken(token);
    setApiClient(new ApiClient(token));
  };

  const handleLogout = () => {
    setBearerToken(null);
    setApiClient(null);
  };

  if (!bearerToken || !apiClient) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <BlacklistManager apiClient={apiClient} onLogout={handleLogout} />;
};

export default Index;
