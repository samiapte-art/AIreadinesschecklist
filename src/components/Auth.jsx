import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Lock, Mail, ChevronRight, Check } from 'lucide-react';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role] = useState('client'); // default role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role: role
            }
          }
        });
        if (signUpError) throw signUpError;
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center p-6 bg-cover bg-center" style={{ backgroundImage: "url('/mac-wallpaper-blur.jpg')" }}>
      <div className="bg-white/70 backdrop-blur-xl max-w-md w-full rounded-[2rem] p-8 md:p-10 shadow-apple border border-white/40">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Finivis Logo" className="h-10 object-contain mb-6" />
          <h2 className="text-2xl font-bold text-finivis-dark tracking-tight">
            {isLogin ? 'Sign in to Finivis' : 'Create an Account'}
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            {isLogin ? 'Access your assessment dashboard.' : 'Start analyzing your business opportunities.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50/80 backdrop-blur-md text-red-600 p-4 rounded-xl text-sm font-medium mb-6 border border-red-100 flex items-start gap-3">
            <span className="shrink-0 mt-0.5"><Lock size={16} /></span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                <Mail size={18} />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="apple-input !pl-12"
                placeholder="name@company.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
                <Lock size={18} />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="apple-input !pl-12"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          {/* Role selector removed - defaults to 'client' */}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-8 py-3.5 bg-finivis-blue text-white rounded-[1.2rem] font-bold text-[15px] hover:bg-blue-600 hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,122,255,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Authenticating...' : (isLogin ? 'Sign In' : 'Create Account')}
            {!loading && <ChevronRight size={18} />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-[14px] font-medium text-gray-500 hover:text-finivis-blue transition-colors"
          >
            {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}
