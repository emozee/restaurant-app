import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, UtensilsCrossed, UserCircle, ArrowLeft } from 'lucide-react';

type Step = 'landing' | 'choose' | 'form';

export default function Home() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('landing');
  const [orderType, setOrderType] = useState<'takeaway' | 'dine-in' | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });

  const handleChoose = (type: 'takeaway' | 'dine-in') => {
    setOrderType(type);
    setStep('form');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerInfo.name.trim() || !customerInfo.phone.trim()) return;
    localStorage.setItem('customer_info', JSON.stringify({
      name: customerInfo.name.trim(),
      phone: customerInfo.phone.trim(),
      type: orderType,
    }));
    navigate('/menu');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative">
      <div className="absolute inset-0 bg-kira-pattern opacity-[0.015] pointer-events-none" />
      <div className="w-full max-w-sm space-y-8 text-center">
        <header className="mb-10">
          <h1 className="text-4xl font-black italic tracking-tighter">
            <span className="text-[#D64000]">OLO</span> <span className="text-[#FFB800]">PIZZA</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest mt-2">Gelephu, Bhutan</p>
        </header>

        {step === 'landing' && (
          <div className="grid gap-4">
            <button
              onClick={() => setStep('choose')}
              className="group flex flex-col items-center justify-center bg-[#D64000] text-white p-10 rounded-[2.5rem] transition-all btn-press shadow-xl shadow-orange-200"
            >
              <ShoppingBag size={44} className="mb-4 group-hover:scale-110 transition-transform" />
              <span className="font-black text-xl uppercase tracking-tight">Order Now</span>
              <span className="text-white/70 text-xs font-bold mt-1">Takeaway or Dine-In</span>
            </button>

            <button
              onClick={() => navigate('/admin-login')}
              className="mt-6 text-gray-400 font-bold text-xs flex items-center justify-center gap-2 hover:text-gray-900 transition-colors"
            >
              <UserCircle size={16} /> STAFF LOGIN
            </button>
          </div>
        )}

        {step === 'choose' && (
          <div className="space-y-4">
            <p className="text-sm font-black uppercase text-gray-400 tracking-widest mb-6">How would you like to order?</p>
            <button
              onClick={() => handleChoose('dine-in')}
              className="group w-full flex items-center gap-5 bg-gray-900 text-white p-7 rounded-[2rem] transition-all btn-press shadow-xl"
            >
              <UtensilsCrossed size={36} className="group-hover:scale-110 transition-transform shrink-0" />
              <div className="text-left">
                <p className="font-black text-lg uppercase">Dine-In</p>
                <p className="text-white/60 text-xs font-bold">Pre-order or eat at the restaurant</p>
              </div>
            </button>

            <button
              onClick={() => handleChoose('takeaway')}
              className="group w-full flex items-center gap-5 bg-[#D64000] text-white p-7 rounded-[2rem] transition-all btn-press shadow-xl shadow-orange-200"
            >
              <ShoppingBag size={36} className="group-hover:scale-110 transition-transform shrink-0" />
              <div className="text-left">
                <p className="font-black text-lg uppercase">Takeaway</p>
                <p className="text-white/60 text-xs font-bold">Pick up your order</p>
              </div>
            </button>

            <button
              onClick={() => setStep('landing')}
              className="text-gray-400 font-bold text-xs flex items-center justify-center gap-2 mt-4 hover:text-gray-700 w-full"
            >
              <ArrowLeft size={14} /> Go Back
            </button>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="glass-card p-8 rounded-[2.5rem] text-left">
            <div className="flex items-center gap-3 mb-6">
              {orderType === 'dine-in'
                ? <UtensilsCrossed size={20} className="text-gray-700" />
                : <ShoppingBag size={20} className="text-[#D64000]" />}
              <h2 className="text-lg font-black uppercase italic">
                {orderType === 'dine-in' ? 'Dine-In Details' : 'Takeaway Details'}
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 block mb-1">Your Name *</label>
                <input
                  required
                  type="text"
                  value={customerInfo.name}
                  className="w-full p-4 rounded-2xl bg-white border-none shadow-sm font-bold text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="Enter your name"
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 ml-2 block mb-1">Contact Number *</label>
                <input
                  required
                  type="tel"
                  value={customerInfo.phone}
                  className="w-full p-4 rounded-2xl bg-white border-none shadow-sm font-bold text-sm text-gray-900 outline-none focus:ring-2 focus:ring-orange-100"
                  placeholder="e.g. 17XXXXXX"
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#D64000] text-white p-4 rounded-2xl font-black shadow-lg mt-2 btn-press transition-all"
              >
                VIEW MENU
              </button>
              <button
                type="button"
                onClick={() => setStep('choose')}
                className="w-full text-gray-400 font-bold text-xs flex items-center justify-center gap-2 mt-1"
              >
                <ArrowLeft size={12} /> Go Back
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
