/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Intervention } from "../types";
import { 
  BarChart, 
  Settings, 
  Cpu, 
  Building, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ShieldAlert, 
  PieChart as PieIcon,
  CalendarCheck
} from "lucide-react";

interface StatsDashboardProps {
  interventions: Intervention[];
}

export default function StatsDashboard({ interventions }: StatsDashboardProps) {
  // Calculations
  const total = interventions.length;
  const completed = interventions.filter(i => i.status === "termine").length;
  const inProgress = total - completed;
  
  const totalDuration = interventions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
  const avgDuration = total > 0 ? Math.round(totalDuration / total) : 0;

  // Department counts
  const deptMap: { [key: string]: number } = {};
  // Category counts
  const catMap: { [key: string]: number } = {
    "Matériel": 0,
    "Logiciel": 0,
    "Réseau": 0,
    "Sécurité": 0,
    "Optimisation": 0,
    "Autre": 0,
  };

  interventions.forEach(i => {
    // Departments
    const d = i.clientDepartment || "Non Spécifié";
    deptMap[d] = (deptMap[d] || 0) + 1;

    // Categories in tasks
    i.tasks.forEach(t => {
      const cat = t.category || "Autre";
      if (catMap[cat] !== undefined) {
        catMap[cat] += 1;
      } else {
        catMap[cat] = 1;
      }
    });
  });

  const sortedDepts = Object.entries(deptMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const maxDeptValue = sortedDepts.length > 0 ? Math.max(...sortedDepts.map(d => d[1])) : 1;
  const maxCatValue = Math.max(...Object.values(catMap), 1);

  // Client list of specific services rendered
  const clientSummary: { [client: string]: { count: number; dept: string; devices: string[] } } = {};
  interventions.forEach(i => {
    if (!clientSummary[i.clientName]) {
      clientSummary[i.clientName] = { count: 0, dept: i.clientDepartment, devices: [] };
    }
    clientSummary[i.clientName].count += 1;
    if (i.deviceType && !clientSummary[i.clientName].devices.includes(i.deviceType)) {
      clientSummary[i.clientName].devices.push(i.deviceType);
    }
  });

  const clientsSorted = Object.entries(clientSummary)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-slate-900 border border-slate-850 rounded-xl p-5 text-white shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-400 font-medium tracking-wide uppercase">Total Interventions</p>
            <h3 className="text-3xl font-extrabold tracking-tight text-white">{total}</h3>
            <p className="text-[10px] text-teal-400 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Archivées au registre
            </p>
          </div>
          <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
            <Cpu className="w-6 h-6 text-teal-400" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Prestations Clôturées</p>
            <h3 className="text-3xl font-extrabold tracking-tight text-emerald-700">{completed}</h3>
            <p className="text-[10px] text-slate-400">Signées / En attente d'impression</p>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Tâches en Cours d'intervention</p>
            <h3 className="text-3xl font-extrabold tracking-tight text-amber-600">{inProgress}</h3>
            <p className="text-[10px] text-slate-400">Diagnostic ou pièces attendues</p>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Temps d'Intervention Moyen</p>
            <h3 className="text-3xl font-extrabold tracking-tight text-slate-800">{avgDuration} min</h3>
            <p className="text-[10px] text-slate-400">Durée par fiche de service fait</p>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <Clock className="w-6 h-6 text-slate-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown Bar Chart */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-600" />
              Volume par Directions & Départements Servis
            </h4>
            <span className="text-xs text-slate-400 font-mono">Top 5</span>
          </div>
          
          <div className="space-y-4 py-2">
            {sortedDepts.map(([dept, count]) => {
              const pct = Math.round((count / maxDeptValue) * 100);
              return (
                <div key={dept} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-700 font-medium truncate max-w-xs">{dept}</span>
                    <span className="text-slate-900 font-bold bg-slate-100 px-2 py-0.5 rounded font-mono">
                      {count} inter.
                    </span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-teal-600 hover:bg-teal-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-1 text-[8px] font-bold text-white font-mono"
                      style={{ width: `${pct}%` }}
                    >
                      {pct > 15 ? `${pct}%` : ''}
                    </div>
                  </div>
                </div>
              );
            })}
            {sortedDepts.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-xs font-mono">
                Aucune donnée à afficher. Veuillez consigner une intervention.
              </div>
            )}
          </div>
        </div>

        {/* Categories Analysis */}
        <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-indigo-600" />
              Actions Techniques Accomplies par Catégorie
            </h4>
            <span className="text-xs text-slate-400 font-mono">Type d'Actes</span>
          </div>

          <div className="grid grid-cols-2 gap-4 py-2">
            {Object.entries(catMap).map(([category, count]) => {
              const pct = Math.round((count / maxCatValue) * 100);
              const isZero = count === 0;
              return (
                <div key={category} className="border border-slate-100 p-3 rounded-lg bg-slate-50/50 flex flex-col justify-between min-h-20">
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-semibold text-slate-600">{category}</span>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                      isZero ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {count}
                    </span>
                  </div>
                  
                  <div className="mt-3 text-[10px] text-slate-400 font-mono">
                    <div className="w-full bg-slate-200/60 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${isZero ? 0 : pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Proof Support Section: Who we helped the most */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-50">
          <div>
            <h4 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-600" />
              Registre de Preuves de Service par Bénéficiaire
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Ces archives démontrent l'étendue de vos travaux de support par bureau et par équipement.
            </p>
          </div>
          <span className="text-xs text-teal-700 bg-teal-50 px-2.5 py-1 rounded font-mono font-bold">
            Total Directeurs/Bénéficiaires : {Object.keys(clientSummary).length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium bg-slate-50 uppercase tracking-widest text-[9px]">
                <th className="p-2.5 font-bold">Bénéficiaire de l'Intervention / Directeur</th>
                <th className="p-2.5 font-bold">Département d'Intégration d'État</th>
                <th className="p-2.5 font-bold">Équipements Assistés</th>
                <th className="p-2.5 font-bold text-center">Interventions Validées</th>
                <th className="p-2.5 font-bold text-right text-teal-800">Preuve administrative</th>
              </tr>
            </thead>
            <tbody>
              {clientsSorted.map(([clientName, info]) => (
                <tr key={clientName} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-2.5 font-semibold text-slate-800 text-sm flex items-center gap-2">
                    <div className="w-6 h-6 bg-slate-100 text-slate-600 rounded-full flex items-center justify-center font-mono font-bold uppercase">
                      {clientName[0] || '?'}
                    </div>
                    {clientName}
                  </td>
                  <td className="p-2.5 text-slate-500">{info.dept}</td>
                  <td className="p-2.5">
                    <div className="flex flex-wrap gap-1">
                      {info.devices.map(dev => (
                        <span key={dev} className="bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded text-[10px]">
                          {dev}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2.5 font-bold text-center text-slate-700 font-mono">{info.count}</td>
                  <td className="p-2.5 text-right font-medium text-teal-700 font-sans">
                    ✓ Prête au registre
                  </td>
                </tr>
              ))}
              {clientsSorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-mono">
                    Aucun bénéficiaire enregistré au registre de preuve.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
