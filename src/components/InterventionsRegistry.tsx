/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Intervention } from "../types";
import { DEPARTMENTS, DEVICE_TYPES } from "../data/constants";
import { 
  Search, 
  Filter, 
  Printer, 
  Trash2, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  FileMinus,
  CalendarDays
} from "lucide-react";

interface InterventionsRegistryProps {
  interventions: Intervention[];
  onSelect: (intervention: Intervention) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string) => void;
}

export default function InterventionsRegistry({ 
  interventions, 
  onSelect, 
  onDelete, 
  onToggleStatus 
}: InterventionsRegistryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("Tous");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedDevice, setSelectedDevice] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filter actions
  const filteredInterventions = interventions.filter((intervention) => {
    // Search keyword
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      intervention.clientName.toLowerCase().includes(term) ||
      intervention.clientTitle.toLowerCase().includes(term) ||
      intervention.refNumber.toLowerCase().includes(term) ||
      intervention.rawNotes.toLowerCase().includes(term) ||
      intervention.professionalSummary.toLowerCase().includes(term) ||
      (intervention.deviceBrand || "").toLowerCase().includes(term);

    // Department match
    const matchesDept = selectedDept === "Tous" || intervention.clientDepartment === selectedDept;

    // Status match
    const matchesStatus = selectedStatus === "all" || intervention.status === selectedStatus;

    // Device type match
    const matchesDevice = selectedDevice === "all" || intervention.deviceType === selectedDevice;

    // Date range matches
    const matchesStartDate = !startDate || intervention.date >= startDate;
    const matchesEndDate = !endDate || intervention.date <= endDate;

    return matchesSearch && matchesDept && matchesStatus && matchesDevice && matchesStartDate && matchesEndDate;
  });

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedDept("Tous");
    setSelectedStatus("all");
    setSelectedDevice("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-4">
      {/* Professional Local Sovereign Backup Description */}
      <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-5 md:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 bg-teal-500/10 text-teal-400 border border-teal-500/20 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest font-mono">
              ★ Stockage Privé Souverain (0% Cloud)
            </div>
            <h4 className="text-sm md:text-base font-extrabold text-slate-100 uppercase tracking-tight">
              Registre d'État Auto-Géré & Archives sur Disque Dur
            </h4>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              Pour assurer une sécurité maximale sans dépendre d'abonnements tiers, vos rapports techniques de service fait sont stockés <strong>exclusivement sur votre machine locale</strong>. À chaque validation, l'archive originale au format universel <span className="text-teal-400 font-mono">.json</span> vous est proposée en téléchargement pour constituer votre propre dossier d'archives d'État à vie, sans aucune limitation.
            </p>
          </div>
          <div className="flex flex-col items-center bg-slate-800/80 border border-slate-700/50 rounded-xl px-4 py-3 text-center shrink-0 min-w-36">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total Archives</span>
            <span className="text-2xl font-black text-white font-mono mt-0.5">{interventions.length}</span>
            <span className="text-[9px] text-teal-400 mt-1 uppercase font-semibold">Illimitées et gratuites</span>
          </div>
        </div>
      </div>

      {/* Registry Top Toolbar Search / Filter */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Main search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              id="input-search-registry"
              type="text"
              placeholder="Rechercher par bénéficiaire, équipement ou numéro de référence (ex: CNIPLC-2026-0001)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-slate-800 text-sm pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/80 transition-all font-sans"
            />
          </div>

          <div className="flex gap-2">
            <button
              id="btn-toggle-filters"
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2 border rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showAdvancedFilters 
                  ? "bg-slate-900 text-white border-slate-900" 
                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              {showAdvancedFilters ? "Masquer Filtres" : "Filtres Avancés"}
            </button>

            {(selectedDept !== "Tous" || selectedStatus !== "all" || selectedDevice !== "all" || startDate || endDate || searchTerm) && (
              <button
                id="btn-reset-filters"
                type="button"
                onClick={handleResetFilters}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {/* Detailed collapsible advanced filters */}
        {showAdvancedFilters && (
          <div className="border-t border-slate-100 pt-3 mt-1 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-in">
            {/* Department selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Direction / Service Client
              </label>
              <select
                id="filter-dept"
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full text-slate-800 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none"
              >
                <option value="Tous">Tous les départements</option>
                {DEPARTMENTS.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Status Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Statut de Validation
              </label>
              <select
                id="filter-status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full text-slate-800 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none"
              >
                <option value="all">Tous les statuts</option>
                <option value="termine">Terminé (Fiche prête)</option>
                <option value="en_cours">En Cours d'exécution</option>
              </select>
            </div>

            {/* Device type Selector */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Équipement Concerne
              </label>
              <select
                id="filter-device"
                value={selectedDevice}
                onChange={(e) => setSelectedDevice(e.target.value)}
                className="w-full text-slate-800 text-xs px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md focus:outline-none"
              >
                <option value="all">Tous les types de matériels</option>
                {DEVICE_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            {/* Date range inputs */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Période d'intervention
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  id="filter-start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-slate-800 text-[10px] px-1.5 py-1 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                />
                <span className="text-slate-400 text-xs">à</span>
                <input
                  id="filter-end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-slate-800 text-[10px] px-1.5 py-1 bg-slate-50 border border-slate-200 rounded focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Registry Table & Render results */}
      <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-semibold uppercase tracking-widest text-[9px]">
                <th className="p-3 w-32">Référence</th>
                <th className="p-3 w-28">Date</th>
                <th className="p-3 w-48">Demandeur (Bénéficiaire)</th>
                <th className="p-3 w-40">Direction/Service</th>
                <th className="p-3 w-36">Équipement</th>
                <th className="p-3">Rapport synthétique</th>
                <th className="p-3 w-24 text-center">Tâches</th>
                <th className="p-3 w-28 text-center">Réf (Statut)</th>
                <th className="p-3 w-32 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInterventions.map((intervention) => {
                const isTerminated = intervention.status === "termine";
                return (
                  <tr 
                    key={intervention.id} 
                    className="border-b border-slate-105 hover:bg-slate-50/50 transition-all font-sans"
                  >
                    {/* Ref Number */}
                    <td className="p-3 font-mono font-extrabold text-[#111827]">
                      {intervention.refNumber}
                    </td>

                    {/* Date */}
                    <td className="p-3 text-slate-500 whitespace-nowrap flex items-center gap-1 mt-1 font-mono">
                      <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(intervention.date).toLocaleDateString('fr-FR')}
                    </td>

                    {/* Client details */}
                    <td className="p-3">
                      <div className="font-semibold text-slate-800 text-sm truncate max-w-[180px]">{intervention.clientName}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[180px]">{intervention.clientTitle}</div>
                    </td>

                    {/* Client department */}
                    <td className="p-3 text-slate-500">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] text-slate-600 border border-slate-200 max-w-[130px] truncate block">
                        {intervention.clientDepartment}
                      </span>
                    </td>

                    {/* Equipment Details */}
                    <td className="p-3">
                      <div className="font-medium text-slate-700 truncate max-w-[125px]">{intervention.deviceType}</div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[125px]">
                        {intervention.deviceBrand || "Standard"}
                      </div>
                    </td>

                    {/* Report professional preview */}
                    <td className="p-3 index-table-desc">
                      <p className="text-slate-600 line-clamp-2 leading-relaxed text-justify text-[11px] max-w-[300px]" title={intervention.professionalSummary}>
                        {intervention.professionalSummary}
                      </p>
                    </td>

                    {/* Tasks numerical counts */}
                    <td className="p-3 text-center">
                      <span className="font-bold text-slate-700 bg-slate-100 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full font-mono">
                        {intervention.tasks.length}
                      </span>
                    </td>

                    {/* Status Badge clickable triggers */}
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onToggleStatus(intervention.id)}
                        id={`btn-toggle-status-${intervention.id}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-all ${
                          isTerminated
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                        }`}
                        title="Cliquez pour permuter le statut"
                      >
                        {isTerminated ? (
                          <>
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            Terminé
                          </>
                        ) : (
                          <>
                            <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                            En cours
                          </>
                        )}
                      </button>
                    </td>

                    {/* Action buttons */}
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelect(intervention)}
                          id={`btn-view-${intervention.id}`}
                          className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 p-1.5 rounded-lg text-xs font-semibold flex items-center justify-center cursor-pointer transition-colors"
                          title="Générer / Imprimer la Fiche à Signer"
                        >
                          <Printer className="w-3.5 h-3.5 mr-0.5" />
                          Imprimer
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Êtes-vous certain de vouloir archiver définitivement la fiche ${intervention.refNumber} ?`)) {
                              onDelete(intervention.id);
                            }
                          }}
                          id={`btn-delete-${intervention.id}`}
                          className="bg-white hover:bg-red-50 hover:text-red-600 border border-slate-200 hover:border-red-200 text-slate-500 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Supprimer la fiche d'intervention"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredInterventions.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <FileMinus className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-semibold text-slate-400 font-mono">
                        Aucun résultat correspondant aux critères de recherche.
                      </p>
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="text-xs text-teal-700 hover:underline cursor-pointer"
                      >
                        Réinitialiser tous les filtres
                      </button>
                    </div>
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
