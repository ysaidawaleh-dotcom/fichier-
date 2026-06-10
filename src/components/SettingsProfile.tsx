/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { TechProfile } from "../types";
import { 
  User, 
  Award, 
  Building, 
  FileText, 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  CheckCircle,
  AlertTriangle,
  FolderSync,
  FolderOpen
} from "lucide-react";

interface SettingsProfileProps {
  techProfile: TechProfile;
  onSaveProfile: (profile: TechProfile) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onResetFactory: () => void;
  onClearData: () => void;
  localDirName: string;
  onConnectDirectory: () => void;
  onDisconnectDirectory: () => void;
}

export default function SettingsProfile({
  techProfile,
  onSaveProfile,
  onExportData,
  onImportData,
  onResetFactory,
  onClearData,
  localDirName,
  onConnectDirectory,
  onDisconnectDirectory
}: SettingsProfileProps) {
  const [name, setName] = useState(techProfile.name);
  const [title, setTitle] = useState(techProfile.title);
  const [department, setDepartment] = useState(techProfile.department);
  const [centerName, setCenterName] = useState(techProfile.centerName);
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      name: name.trim() || "Technicien Informatique",
      title: title.trim() || "Ingénieur Support CNIPLC",
      department: department.trim() || "Systèmes d'Information (DSI)",
      centerName: centerName.trim() || "CNIPLC"
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Profile Form */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5 flex items-center gap-2">
          <User className="w-5 h-5 text-teal-600" />
          Votre Profil Professionnel (Intervenant)
        </h3>
        
        <p className="text-xs text-slate-500 leading-relaxed mb-5">
          Saisissez vos identifiants ci-dessous. Ils seront automatiquement injectés en tant que signataire "L'intervenant technique" sur chaque attestation imprimable afin d'automatiser vos rédactions administratives.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Nom complet du Technicien IT *
            </label>
            <input
              id="settings-tech-name"
              type="text"
              required
              placeholder="ex: Said Awaleh"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-slate-800 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          {/* Job Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Grade / Fonction officielle *
            </label>
            <input
              id="settings-tech-title"
              type="text"
              required
              placeholder="ex: Ingénieur Support TI et Maintenance Informatique"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-slate-800 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Department */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Département d'Intégration
              </label>
              <input
                id="settings-tech-dept"
                type="text"
                placeholder="ex: Infrastructure & Systèmes"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full text-slate-800 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>

            {/* Public Center Name */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Centre National (Logo / Titre)
              </label>
              <input
                id="settings-center-name"
                type="text"
                placeholder="ex: CNIPLC"
                value={centerName}
                onChange={(e) => setCenterName(e.target.value)}
                className="w-full text-slate-800 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-between">
            {isSaved && (
              <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Profil enregistré avec succès !
              </span>
            )}
            <button
              id="btn-settings-save"
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white rounded-lg px-5 py-2.5 text-xs font-bold font-sans cursor-pointer transition-colors flex items-center gap-1.5 ml-auto"
            >
              Sauvegarder les Paramètres
            </button>
          </div>
        </form>
      </div>

      {/* Database control, Backups and local archives */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-1 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            Gestion des Fichiers Accomplis & Sauvegardes
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed text-justify">
            En tant que fonctionnaire d'État, vous devez garantir la sécurité et la traçabilité de vos dossiers de support. Vous pouvez exporter l'intégralité de vos archives dans un fichier de sauvegarde officiel local ou réimporter des registres précédents.
          </p>

          {/* Direct Local Disk Archiving Folder Setup Container */}
          <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-teal-500" />
                Dossier de Sauvegarde Directe PC
              </span>
              {localDirName ? (
                <span className="text-[10px] font-bold font-mono text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded flex items-center gap-1">
                  <CheckCircle className="w-3 h-3 text-teal-600" /> ACTIF
                </span>
              ) : (
                <span className="text-[10px] font-bold font-mono text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded">
                  NON CONFIGURÉ
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 leading-normal">
              Spécifiez vers quel dossier physique de votre PC (ex: Bureau, clé USB, Documents) l'application doit stocker automatiquement vos fiches au format JSON à chaque clic sur <strong>"Valider et enregistrer"</strong>.
            </p>

            {localDirName ? (
              <div className="flex items-center justify-between bg-white border border-slate-150 rounded-lg p-2.5">
                <div className="text-slate-800 text-xs font-semibold overflow-hidden text-ellipsis flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 bg-teal-500 rounded-full"></span>
                  Dossier : {localDirName}
                </div>
                <button
                  id="btn-disconnect-directory"
                  onClick={onDisconnectDirectory}
                  className="text-[10px] font-bold text-red-600 hover:text-red-700 hover:bg-red-50 px-2.5 py-1.5 rounded border border-red-150 transition-colors cursor-pointer"
                >
                  Déconnecter
                </button>
              </div>
            ) : (
              <button
                id="btn-connect-directory"
                onClick={onConnectDirectory}
                className="w-full bg-teal-600 hover:bg-teal-700 active:bg-teal-850 text-white rounded-lg py-2.5 text-xs font-bold font-sans cursor-pointer transition-colors flex items-center justify-center gap-2"
              >
                <FolderOpen className="w-4 h-4 text-teal-100" />
                Définir le Dossier de Sauvegarde d'État
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Export backup buttons */}
            <button
              id="btn-export-backup"
              onClick={onExportData}
              className="px-4 py-3 border border-slate-200 hover:border-teal-200 bg-slate-50 hover:bg-teal-50 text-slate-700 hover:text-teal-800 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all gap-2"
            >
              <Download className="w-5 h-5 text-teal-600" />
              <div>
                <span className="block text-xs font-bold font-sans">Exporter (.JSON)</span>
                <span className="text-[9px] text-slate-400 mt-0.5 block font-mono">Archive de Preuve</span>
              </div>
            </button>

            {/* Import backup button triggers */}
            <label className="px-4 py-3 border border-slate-200 hover:border-indigo-200 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-800 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all gap-2">
              <Upload className="w-5 h-5 text-indigo-600 animate-pulse" />
              <div>
                <span className="block text-xs font-bold font-sans">Importer Sauvegarde</span>
                <span className="text-[9px] text-slate-400 mt-0.5 block font-mono font-bold">Restaurer Fiche</span>
              </div>
              <input
                id="input-file-backup"
                type="file"
                accept=".json"
                onChange={onImportData}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Severe database resets */}
        <div className="pt-5 border-t border-slate-100 flex flex-col gap-3">
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-3 text-xs leading-normal">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Attention Administrative:</strong> La réinitialisation vide l'historique complet et injecte l'échantillon d'exemples de démonstration pour inspecter les performances du tableau de bord.
            </span>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              id="btn-settings-clear"
              type="button"
              onClick={() => {
                if (confirm("Confirmez-vous la purge complète du registre d'interventions ? Cette action supprimera TOUT.")) {
                  onClearData();
                }
              }}
              className="text-[10px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200 px-3 py-2 rounded-lg cursor-pointer transition-colors"
            >
              Purger le Registre
            </button>
            
            <button
              id="btn-settings-reset"
              type="button"
              onClick={() => {
                if (confirm("Réinjecter les exemples d'interventions administratifs (Said Awaleh) ? Vos données en cours seront remplacées.")) {
                  onResetFactory();
                }
              }}
              className="text-[10px] font-bold text-slate-600 hover:bg-slate-50 px-3 py-2 border border-slate-200 rounded-lg cursor-pointer transition-colors flex items-center gap-1"
            >
              <FolderSync className="w-3.5 h-3.5" />
              Réinjecter Exemples
            </button>
          </div>
        </div>
        
      </div>

    </div>
  );
}
