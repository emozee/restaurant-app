import { supabase } from '../lib/supabase';
import { Loader2, ArrowLeft, Mail, LockKeyhole, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { hasAdminAccess } from '../lib/admin';

const AUTO_CREATE_EMAILS = ['lhamo5pema@gmail.com'];

export default function StaffLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetting, setResetting] = useState(false);
  const navigate = useNavigate();

  function isAutoCreatable(email: string) {
    return AUTO_CREATE_EMAILS.includes(email.trim().toLowerCase());
  }

  async function attemptAutoCreate(email: string, password: string) {
    if (!isAutoCreatable(email)) return false;
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });
      if (error) {
        console.log('[auto-create] failed:', error.message);
        return false;
      }
      console.log('[auto-create] account created for', email);
      return true;
    } catch {
      return false;
    }
  }

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

      if (error) {
        if (isAutoCreatable(email.trim())) {
          setErrorMessage('Account not found. Creating your account now…');
          const created = await attemptAutoCreate(email.trim(), password);
          if (created) {
            setErrorMessage('Account created! Try signing in again with the same credentials.');
          } else {
            setErrorMessage('Could not auto-create account. Contact the owner to set up your account in Supabase Dashboard → Authentication → Users.');
          }
        } else {
          throw error;
        }
        return;
      }

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

  async function handleResetPassword() {
    if (!resetEmail.trim()) {
      setErrorMessage('Enter your email address.');
      return;
    }
    setResetting(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${window.location.origin}/admin-login`,
      });
      if (error) throw error;
      setResetSent(true);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send reset email.';
      setErrorMessage(message);
    } finally {
      setResetting(false);
    }
  }

  async function handleUpdatePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMessage('Enter a new password.');
      return;
    }
    setLoading(true);
    setErrorMessage('');
    try {
      const { error } = await supabase.auth.updateUser({ password: password.trim() });
      if (error) throw error;
      navigate('/live-orders', { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password.';
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  }

  const isRecovery = new URLSearchParams(window.location.search).get('type') === 'recovery';

  if (isRecovery) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-kira-pattern opacity-30" />
        <div className="absolute inset-0 bg-[url('/logo.jpg')] bg-cover bg-center opacity-[0.04]" />
        <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-[#D64000]/5 blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-[#FFB800]/5 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
        <form onSubmit={handleUpdatePassword} className="max-w-md w-full glass-card p-8 sm:p-10 rounded-[2rem] shadow-2xl text-center relative z-10">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 overflow-hidden shadow-lg">
            <img src="/logo.jpg" alt="ཨོ་ལོ Pizza" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black mb-2 italic tracking-tighter">Set New Password</h1>
          <p className="text-gray-400 mb-8 font-bold text-xs uppercase tracking-widest">Enter your new password below</p>
          <label className="block text-left">
            <span className="text-[10px] font-black uppercase text-gray-400 ml-2 block mb-1">New Password</span>
            <div className="relative">
              <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 pl-12 pr-12 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="Enter new password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {errorMessage && (
            <p className="mt-5 rounded-2xl bg-red-50 px-4 py-3 text-left text-xs font-bold text-red-500">{errorMessage}</p>
          )}
          <button type="submit" disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-4 bg-[#D64000] text-white p-5 rounded-2xl font-black text-sm hover:brightness-110 transition active:scale-95 disabled:opacity-50 shadow-xl"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    );
  }

  if (showReset) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-kira-pattern opacity-30" />
        <div className="absolute inset-0 bg-[url('/logo.jpg')] bg-cover bg-center opacity-[0.04]" />
        <button onClick={() => { setShowReset(false); setResetSent(false); setErrorMessage(''); }}
          className="mb-8 flex items-center gap-2 text-gray-400 font-bold text-xs hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={14} /> BACK TO SIGN IN
        </button>
        <div className="max-w-md w-full glass-card p-8 sm:p-10 rounded-[2rem] shadow-2xl text-center">
          <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 overflow-hidden shadow-lg">
            <img src="/logo.jpg" alt="ཨོ་ལོ Pizza" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-black mb-2 italic tracking-tighter">Reset Password</h1>
          <p className="text-gray-400 mb-8 font-bold text-xs uppercase tracking-widest">We'll send you a reset link</p>

          {resetSent ? (
            <div className="text-center py-4">
              <CheckCircle2 size={48} className="mx-auto mb-4 text-green-500" />
              <p className="font-bold text-gray-800">Reset link sent!</p>
              <p className="text-sm text-gray-500 mt-2">Check your email inbox. The link expires in 1 hour.</p>
            </div>
          ) : (
            <div className="space-y-4 text-left">
              <label className="block">
                <span className="text-[10px] font-black uppercase text-gray-400 ml-2 block mb-1">Email Address</span>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input
                    type="email" autoComplete="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full bg-gray-50 text-gray-900 pl-12 pr-4 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100"
                    placeholder="admin@example.com"
                  />
                </div>
              </label>
              {errorMessage && (
                <p className="rounded-2xl bg-red-50 px-4 py-3 text-left text-xs font-bold text-red-500">{errorMessage}</p>
              )}
              <button onClick={handleResetPassword} disabled={resetting}
                className="w-full flex items-center justify-center gap-4 bg-[#D64000] text-white p-5 rounded-2xl font-black text-sm hover:brightness-110 transition active:scale-95 disabled:opacity-50 shadow-xl"
              >
                {resetting ? <Loader2 className="animate-spin" size={20} /> : <><ArrowRight size={18} /> SEND RESET LINK</>}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-kira-pattern opacity-30" />
      <div className="absolute inset-0 bg-[url('/logo.jpg')] bg-cover bg-center opacity-[0.04]" />
      <div className="absolute top-20 left-10 w-24 h-24 rounded-full bg-[#D64000]/5 blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-32 h-32 rounded-full bg-[#FFB800]/5 blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-40 right-20 w-16 h-16 rounded-full bg-[#D64000]/5 blur-2xl animate-float" style={{ animationDelay: '0.8s' }} />
      <button 
        onClick={() => navigate('/')}
        className="mb-8 flex items-center gap-2 text-gray-400 font-bold text-xs hover:text-gray-900 transition-colors"
      >
        <ArrowLeft size={14} /> BACK TO CUSTOMER VIEW
      </button>

      <form onSubmit={handleEmailLogin} className="max-w-md w-full glass-card p-8 sm:p-10 rounded-[2rem] shadow-2xl text-center relative z-10">
        <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 overflow-hidden shadow-lg">
          <img src="/logo.jpg" alt="ཨོ་ལོ Pizza" className="w-full h-full object-cover" />
        </div>
        
        <h1 className="font-black italic tracking-tighter leading-none group/title cursor-default">
          <div className="text-[#D64000] text-4xl transition-all duration-300 group-hover/title:scale-110 group-hover/title:drop-shadow-[0_0_12px_rgba(214,64,0,0.5)]">ཨོ་ལོ</div>
          <div className="text-[#FFB800] text-4xl -mt-1 transition-all duration-300 group-hover/title:scale-110 group-hover/title:drop-shadow-[0_0_12px_rgba(255,184,0,0.5)] group-hover/title:-rotate-2">PIZZA</div>
          <p className="text-gray-400 mt-3 font-bold text-[10px] uppercase tracking-widest">Administrative Access Only</p>
        </h1>

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
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 text-gray-900 pl-12 pr-12 py-4 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-orange-100"
                placeholder="Enter password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
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
          className="mt-6 w-full flex items-center justify-center gap-4 bg-gray-900 text-white p-5 rounded-2xl font-black text-sm hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl"
        >
          {loading ? (
            <Loader2 className="animate-spin" size={20} />
          ) : (
            'SIGN IN'
          )}
        </button>

        <button
          type="button"
          onClick={() => { setShowReset(true); setErrorMessage(''); }}
          className="mt-4 w-full text-gray-400 font-bold text-xs hover:text-[#D64000] transition-colors"
        >
          Forgot password?
        </button>
      </form>
    </div>
  );
}
