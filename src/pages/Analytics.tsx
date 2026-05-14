import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, ReceiptText, Plus, Trash2, TrendingDown } from 'lucide-react';

interface OtherIncome { id?: string; label: string; amount: number; date: string; }
interface Expenditure { id?: string; label: string; amount: number; date: string; }

export default function Analytics() {
  const [orderRevenue, setOrderRevenue] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [otherIncomes, setOtherIncomes] = useState<OtherIncome[]>([]);
  const [expenditures, setExpenditures] = useState<Expenditure[]>([]);
  const [showIncomeForm, setShowIncomeForm] = useState(false);
  const [showExpForm, setShowExpForm] = useState(false);
  const [newIncome, setNewIncome] = useState({ label: '', amount: '' });
  const [newExp, setNewExp] = useState({ label: '', amount: '' });

  useEffect(() => {
    fetchData();
    fetchFinancials();
  }, []);

  async function fetchData() {
    const { data: orders } = await supabase.from('orders').select('*').eq('status', 'completed');
    let totalRevenue = 0;
    const itemSales: { [key: string]: number } = {};
    orders?.forEach((order) => {
      totalRevenue += Number(order.total_amount);
      order.items.forEach((item: any) => {
        itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
      });
    });
    setOrderRevenue(totalRevenue);
    const formattedChart = Object.keys(itemSales).map((name) => ({ name, sales: itemSales[name] }))
      .sort((a, b) => b.sales - a.sales).slice(0, 5);
    setChartData(formattedChart);
  }

  async function fetchFinancials() {
    const { data: inc } = await supabase.from('other_income').select('*').order('date', { ascending: false });
    const { data: exp } = await supabase.from('expenditures').select('*').order('date', { ascending: false });
    setOtherIncomes(inc || []);
    setExpenditures(exp || []);
  }

  const addIncome = async () => {
    if (!newIncome.label || !newIncome.amount) return;
    const entry = { label: newIncome.label, amount: parseFloat(newIncome.amount), date: new Date().toISOString() };
    const { data } = await supabase.from('other_income').insert([entry]).select().single();
    if (data) setOtherIncomes((prev) => [data, ...prev]);
    setNewIncome({ label: '', amount: '' });
    setShowIncomeForm(false);
  };

  const addExpenditure = async () => {
    if (!newExp.label || !newExp.amount) return;
    const entry = { label: newExp.label, amount: parseFloat(newExp.amount), date: new Date().toISOString() };
    const { data } = await supabase.from('expenditures').insert([entry]).select().single();
    if (data) setExpenditures((prev) => [data, ...prev]);
    setNewExp({ label: '', amount: '' });
    setShowExpForm(false);
  };

  const deleteIncome = async (id: string) => {
    await supabase.from('other_income').delete().eq('id', id);
    setOtherIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  const deleteExpenditure = async (id: string) => {
    await supabase.from('expenditures').delete().eq('id', id);
    setExpenditures((prev) => prev.filter((e) => e.id !== id));
  };

  const totalOtherIncome = otherIncomes.reduce((s, i) => s + i.amount, 0);
  const totalExpenditure = expenditures.reduce((s, e) => s + e.amount, 0);
  const totalRevenue = orderRevenue + totalOtherIncome;
  const netProfit = totalRevenue - totalExpenditure;
  const isProfitable = netProfit >= 0;

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-gray-50 via-gray-50 to-orange-50/30 min-h-screen">
      <h1 className="text-3xl font-black mb-2 text-gray-900">Financial Overview</h1>
      <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-8">Income - Expenditure - Profit/Loss</p>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        <div className="glass-card p-6 rounded-[2rem] hover-lift">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-green-50 text-green-600 rounded-2xl"><DollarSign size={22} /></div>
            <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center gap-1"><ArrowUpRight size={12}/> Income</span>
          </div>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Total Revenue</p>
          <h2 className="text-2xl font-black mt-1 text-gray-900">Nu. {totalRevenue.toLocaleString()}</h2>
          <p className="text-[10px] text-gray-300 font-bold mt-1">Orders: Nu. {orderRevenue.toLocaleString()} + Other: Nu. {totalOtherIncome.toLocaleString()}</p>
        </div>

        <div className="glass-card p-6 rounded-[2rem] hover-lift">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-red-50 text-red-500 rounded-2xl"><TrendingDown size={22} /></div>
            <span className="text-[10px] font-black text-red-500 bg-red-50 px-2 py-1 rounded-full flex items-center gap-1"><ArrowDownRight size={12}/> Cost</span>
          </div>
          <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">Total Expenditure</p>
          <h2 className="text-2xl font-black mt-1 text-gray-900">Nu. {totalExpenditure.toLocaleString()}</h2>
        </div>

        <div className={`p-6 rounded-[2rem] col-span-1 md:col-span-2 glass-card hover-lift ${isProfitable ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-red-400'}`}>
          <div className="flex justify-between items-start mb-4">
            <div className={`p-3 rounded-2xl ${isProfitable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {isProfitable ? <ArrowUpRight size={22} /> : <ArrowDownRight size={22} />}
            </div>
            <span className={`text-[10px] font-black px-2 py-1 rounded-full ${isProfitable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
              {isProfitable ? 'PROFIT' : 'LOSS'}
            </span>
          </div>
          <p className={`font-bold uppercase text-[10px] tracking-widest ${isProfitable ? 'text-green-600' : 'text-red-500'}`}>Net {isProfitable ? 'Profit' : 'Loss'}</p>
          <h2 className={`text-3xl font-black mt-1 ${isProfitable ? 'text-green-700' : 'text-red-600'}`}>
            {isProfitable ? '+' : '-'}Nu. {Math.abs(netProfit).toLocaleString()}
          </h2>
          <p className="text-[10px] text-gray-400 font-bold mt-1">Nu. {totalRevenue.toLocaleString()} revenue - Nu. {totalExpenditure.toLocaleString()} expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
        {/* OTHER INCOME */}
        <div className="glass-card p-6 rounded-[2.5rem]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-gray-800">Other Income</h3>
            <button
              onClick={() => setShowIncomeForm((v) => !v)}
              className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100"
            >
              <Plus size={18} />
            </button>
          </div>

          {showIncomeForm && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-4 space-y-3 border border-white/20">
              <input
                className="w-full p-3 rounded-xl bg-white/80 backdrop-blur-sm text-sm font-bold outline-none border border-white/30"
                placeholder="Source (e.g. Catering)"
                value={newIncome.label}
                onChange={(e) => setNewIncome({ ...newIncome, label: e.target.value })}
              />
              <input
                className="w-full p-3 rounded-xl bg-white/80 backdrop-blur-sm text-sm font-bold outline-none border border-white/30"
                placeholder="Amount (Nu.)"
                type="number"
                value={newIncome.amount}
                onChange={(e) => setNewIncome({ ...newIncome, amount: e.target.value })}
              />
              <button onClick={addIncome} className="w-full bg-green-600 text-white p-3 rounded-xl font-black text-sm">
                Add Income
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {otherIncomes.map((inc) => (
              <div key={inc.id} className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/10">
                <div>
                  <p className="font-black text-gray-800 text-sm">{inc.label}</p>
                  <p className="text-[10px] text-gray-400">{new Date(inc.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-green-600 text-sm">+Nu. {inc.amount}</span>
                  <button onClick={() => deleteIncome(inc.id!)} className="text-red-300 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {otherIncomes.length === 0 && <p className="text-center text-gray-300 font-bold text-sm py-4">No other income recorded</p>}
          </div>
        </div>

        {/* EXPENDITURES */}
        <div className="glass-card p-6 rounded-[2.5rem]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-gray-800">Expenditures</h3>
            <button
              onClick={() => setShowExpForm((v) => !v)}
              className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100"
            >
              <Plus size={18} />
            </button>
          </div>

          {showExpForm && (
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 mb-4 space-y-3 border border-white/20">
              <input
                className="w-full p-3 rounded-xl bg-white/80 backdrop-blur-sm text-sm font-bold outline-none border border-white/30"
                placeholder="Expense (e.g. Vegetables)"
                value={newExp.label}
                onChange={(e) => setNewExp({ ...newExp, label: e.target.value })}
              />
              <input
                className="w-full p-3 rounded-xl bg-white/80 backdrop-blur-sm text-sm font-bold outline-none border border-white/30"
                placeholder="Amount (Nu.)"
                type="number"
                value={newExp.amount}
                onChange={(e) => setNewExp({ ...newExp, amount: e.target.value })}
              />
              <button onClick={addExpenditure} className="w-full bg-red-500 text-white p-3 rounded-xl font-black text-sm">
                Add Expenditure
              </button>
            </div>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {expenditures.map((exp) => (
              <div key={exp.id} className="flex justify-between items-center p-3 bg-white/50 backdrop-blur-sm rounded-xl border border-white/10">
                <div>
                  <p className="font-black text-gray-800 text-sm">{exp.label}</p>
                  <p className="text-[10px] text-gray-400">{new Date(exp.date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-red-500 text-sm">-Nu. {exp.amount}</span>
                  <button onClick={() => deleteExpenditure(exp.id!)} className="text-red-300 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
            {expenditures.length === 0 && <p className="text-center text-gray-300 font-bold text-sm py-4">No expenditures recorded</p>}
          </div>
        </div>

        {/* TAX / RECEIPT */}
        <div className="glass-card p-6 rounded-[2.5rem]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ReceiptText size={22} /></div>
            <h3 className="font-black text-gray-800">Summary</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Order Revenue', value: orderRevenue, color: 'text-gray-900' },
              { label: 'Other Income', value: totalOtherIncome, color: 'text-green-600' },
              { label: 'Total Income', value: totalRevenue, color: 'text-gray-900', bold: true },
              { label: 'Expenditures', value: totalExpenditure, color: 'text-red-500' },
              { label: isProfitable ? 'Net Profit' : 'Net Loss', value: Math.abs(netProfit), color: isProfitable ? 'text-green-700' : 'text-red-600', bold: true },
            ].map((row) => (
              <div key={row.label} className={`flex justify-between items-center py-2 ${row.bold ? 'border-t border-gray-100 pt-3' : ''}`}>
                <span className={`text-xs font-bold uppercase tracking-wide ${row.bold ? 'text-gray-700 font-black' : 'text-gray-400'}`}>{row.label}</span>
                <span className={`font-black ${row.color}`}>Nu. {row.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TOP SELLING CHART */}
      <div className="glass-card p-8 rounded-[2.5rem]">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800">Top Selling Items</h3>
          <span className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-3 py-1 rounded-full">Live Stats</span>
        </div>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontWeight: 'bold', fontSize: 11 }} />
              <YAxis hide />
              <Tooltip cursor={{ fill: '#fff7ed' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="sales" radius={[12, 12, 0, 0]} barSize={40}>
                {chartData.map((_entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#f97316' : '#fdba74'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
