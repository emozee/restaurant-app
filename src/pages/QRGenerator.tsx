import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function QRGenerator() {
  const [tableCount, setTableCount] = useState(5);
  const [baseUrl, setBaseUrl] = useState(window.location.origin);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-orange-50/30 p-8">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8 no-print">
          {/* Points back to the main admin dashboard */}
          <Link to="/live-orders" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 font-bold transition-colors">
            <ArrowLeft size={20} /> Back to Dashboard
          </Link>
          <button 
            onClick={() => window.print()}
            className="bg-[#D64000] text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:brightness-110 transition"
          >
            <Printer size={20} /> Print All Codes
          </button>
        </header>

        <div className="glass-card p-8 rounded-[2.5rem] mb-8 no-print">
          <h1 className="text-2xl font-black mb-4 text-gray-800 italic uppercase">QR Setup</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-2">Number of Tables</label>
              <input 
                type="number" 
                min={1}
                value={tableCount} 
                onChange={(e) => setTableCount(Math.max(1, Number(e.target.value)))}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase mb-2 ml-2">Base URL</label>
              <input 
                type="text" 
                value={baseUrl} 
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full p-4 bg-gray-50 rounded-2xl border-none focus:ring-2 focus:ring-orange-200 font-bold outline-none"
              />
            </div>
          </div>
        </div>

        {/* PRINTABLE AREA */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 print-grid">
          {Array.from({ length: tableCount }).map((_, i) => {
            const tableNum = i + 1;
            // Updated to use query params (?table=)
            const url = `${baseUrl}/menu?table=${tableNum}`;
            
            return (
              <div key={tableNum} className="glass-card p-8 rounded-[2.5rem] border-2 border-dashed border-white/30 flex flex-col items-center text-center hover-lift">
                <h2 className="text-2xl font-black mb-4 text-gray-900 italic tracking-tighter">TABLE {tableNum}</h2>
                <div className="bg-white/80 backdrop-blur-sm p-4 rounded-2xl shadow-sm border border-white/30 mb-4">
                  <QRCodeSVG value={url} size={150} />
                </div>
                <p className="text-[10px] font-black text-[#D64000] uppercase tracking-[0.2em]">Scan to Order</p>
                <p className="text-[8px] text-gray-300 mt-2 font-medium break-all">{url}</p>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-grid { 
            display: grid !important; 
            grid-template-columns: repeat(2, 1fr) !important; 
            gap: 40px !important; 
          }
        }
      `}</style>
    </div>
  );
}