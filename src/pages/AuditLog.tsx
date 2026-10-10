import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAuditLogs } from '../services/dataService';
import { AuditLog as AuditLogType } from '../types';
import { FileText, Search, ShieldCheck, Clock, User, Database } from 'lucide-react';
import { EmptyState } from '../components/EmptyState';

export const AuditLog: React.FC = () => {
  const { isPengetuaOrGpkHem } = useAuth();
  const [logs, setLogs] = useState<AuditLogType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    setLogs(getAuditLogs());
  }, []);

  const filtered = logs.filter(l => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      l.namaPengguna.toLowerCase().includes(q) ||
      l.perincian.toLowerCase().includes(q) ||
      l.koleksi.toLowerCase().includes(q) ||
      l.tindakan.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-7xl mx-auto pb-24 lg:pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
              Audit & Keselamatan Data
            </span>
            <span className="text-xs text-slate-500">
              Pematuhan Integriti Data HEM (PDPA)
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Log Jejak Audit Keselamatan
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Setiap operasi cipta, kemaskini, dan padam data sensitif direkodkan secara automatik
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <ShieldCheck className="w-4 h-4" />
          <span>Pengauditan Aktif</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Cari log mengikut pengguna, tindakan, atau dokumen..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg outline-hidden"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">Masa & Tarikh</th>
                <th className="p-3">Pengguna</th>
                <th className="p-3">Tindakan</th>
                <th className="p-3">Koleksi</th>
                <th className="p-3">Perincian Aktiviti</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(l => (
                <tr key={l.id} className="hover:bg-slate-50">
                  <td className="p-3 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(l.masa).toLocaleString('ms-MY', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-3 font-bold text-slate-900 whitespace-nowrap">{l.namaPengguna}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                        l.tindakan === 'cipta'
                          ? 'bg-blue-100 text-blue-800'
                          : l.tindakan === 'ubah'
                          ? 'bg-amber-100 text-amber-800'
                          : l.tindakan === 'padam'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {l.tindakan}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-600 font-semibold">{l.koleksi}</td>
                  <td className="p-3 text-slate-700">{l.perincian}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <EmptyState
            title="Tiada Log Ditemui"
            description="Tiada aktiviti yang sepadan dengan carian."
          />
        )}
      </div>
    </div>
  );
};
