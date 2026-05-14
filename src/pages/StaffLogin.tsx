import { supabase } from '../lib/supabase';
import { LogIn, Loader2, ArrowLeft, Mail, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasAdminAccess } from '../lib/admin';

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  async function handleEmailLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Enter the staff email and password.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;
      if (!hasAdminAccess(data.session?.user)) {
        await supabase.auth.signOut();
        setErrorMessage('This account is not allowed to access the admin portal.');
        return;
      }

      navigate('/live-orders', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-kira-pattern opacity-30" />
      <button 
        onClick={() => navigate('/')}
        className="mb-8 flex items-center gap-2 text-gray-400 font-bold text-xs hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} /> BACK TO CUSTOMER VIEW
      </button>

      <form onSubmit={handleEmailLogin} className="max-w-md w-full glass-card p-8 sm:p-10 rounded-[2rem] shadow-2xl text-center">
        <div className="bg-orange-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner">
           <LogIn className="text-[#D64000]" size={32} />
        </div>
        
        <h1 className="text-3xl font-black mb-2 italic tracking-tighter"><span className="text-[#D64000]">OLO</span> <span className="text-[#FFB800]">PIZZA</span> PORTAL</h1>
        <p className="text-gray-400 mb-10 font-bold text-xs uppercase tracking-widest">Administrative Access Only</p>

        <div className="space-y-4 text-left">
          <label className="block">
            <span className="text-[10px] font-black uppercase text-gray-400 ml-2 block mb-1">Staff Email</span>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 pl-12 pr-4 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="admin@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-[10px] font-black uppercase text-gray-400 ml-2 block mb-1">Password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 pl-12 pr-4 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="Enter password"
              />
            </div>
          </label>
        </div>

        {errorMessage && (
          <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-left text-xs font-bold text-red-500">
            {errorMessage}
          </p>
        )}
        
        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-4 bg-gray-900 text-white p-5 rounded-2xl font-black text-sm hover:bg-black transition active:scale-95 disabled:opacity-50 shadow-xl"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            'SIGN IN'
          )}
        </button>
      </form>
    </div>
  );
}
