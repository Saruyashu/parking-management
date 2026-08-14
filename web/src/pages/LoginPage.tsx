import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { AppDispatch } from '../store';
import { login } from '../store/slices/authSlice';
import { Car } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const result = await dispatch(login({ email, password })).unwrap();
      if (result) {
        navigate('/');
      }
    } catch (err: any) {
      setError(err || 'Login failed. Please check your credentials.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-brass/15 flex items-center justify-center">
            <Car size={28} className="text-brass" strokeWidth={1.5} />
          </div>
          <h1 className="font-display text-3xl text-text-primary">Andheri West</h1>
          <p className="text-sm text-text-tertiary mt-2">Parking Management Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-text-secondary mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="owner@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs text-text-secondary mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input w-full"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-danger/10 border border-danger/25 rounded-md p-3 text-sm text-danger">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-text-tertiary">
            Demo: <span className="font-mono text-text-secondary">owner@example.com</span>
          </p>
        </div>
      </div>
    </div>
  );
};