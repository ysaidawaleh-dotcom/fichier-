/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Intervention, TechProfile, TaskItem } from "../types";
import { DEPARTMENTS, DEVICE_TYPES, TASK_CATEGORIES } from "../data/constants";
import { Sparkles, Plus, Trash2, Save, RotateCcw, ArrowRight, Info, AlertTriangle } from "lucide-react";

interface NewInterventionFormProps {
  onSave: (intervention: Omit<Intervention, "id" | "refNumber" | "createdAt">) => void;
  techProfile: TechProfile;
}

export default function NewInterventionForm({ onSave, techProfile }: NewInterventionFormProps) {
  const [clientName, setClientName] = useState("");
  const [clientTitle, setClientTitle] = useState("");
  const [clientDepartment, setClientDepartment] = useState(DEPARTMENTS[0]);
  
  const [deviceType, setDeviceType] = useState(DEVICE_TYPES[0].value);
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceInventory, setDeviceInventory] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));

  const [rawNotes, setRawNotes] = useState("");
  const [professionalSummary, setProfessionalSummary] = useState("");
  const [tasks, setTasks] = useState<Omit<TaskItem, "id">[]>([]);
  const [status, setStatus] = useState<"termine" | "en_cours">("termine");

  // Manual subtask field helpers
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskCat, setNewTaskCat] = useState<TaskItem["category"]>("Matériel");

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  const handleRefineWithIA = async () => {
    if (!rawNotes.trim()) {
      setAiError("Veuillez d'abord saisir vos notes d'intervention rapides/brutes ci-dessous.");
      return;
    }
    setAiError("");
    setIsAiLoading(true);

    try {
      const response = await fetch("/api/refine-tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          rawNotes,
          deviceType,
          deviceBrand,
          clientName,
          clientTitle,
          clientDepartment
        })
      });

      if (!response.ok) {
        throw new Error("Impossible de joindre le service de reformulation administrative.");
      }

      const data = await response.json();
      
      if (data.professionalSummary) {
        setProfessionalSummary(data.professionalSummary);
      }
      
      if (data.tasks && Array.isArray(data.tasks)) {
        setTasks(data.tasks.map((t: any) => ({
          description: t.description,
          category: t.category,
          status: "completed"
        })));
      }
    } catch (err: any) {
      console.error(err);
      setAiError("Le service IA du CNIPLC n'a pas pu traiter ce texte. Une reformulation générique a été appliquée.");
      
      // Local fallback
      setProfessionalSummary(`Intervention technique sur l'appareil ${deviceBrand || ''} ${deviceType}. Travaux effectués conformément aux notes du technicien : ${rawNotes}.`);
      setTasks([
        { description: `Diagnostic et maintenance : ${rawNotes}`, category: "Autre", status: "completed" }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleAddTask = () => {
    if (!newTaskDesc.trim()) return;
    setTasks([
      ...tasks,
      {
        description: newTaskDesc.trim(),
        category: newTaskCat,
        status: "completed"
      }
    ]);
    setNewTaskDesc("");
  };

  const handleRemoveTask = (idx: number) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim()) {
      alert("Veuillez spécifier le nom du demandeur (Bénéficiaire).");
      return;
    }

    // Default professional summary if empty
    const actualSummary = professionalSummary.trim() || `Intervention de maintenance corrective. ${rawNotes}`;
    const actualTasksParams = tasks.length > 0 ? tasks : [
      { description: rawNotes || "Prestation d'assistance informatique standard", category: "Autre" as const, status: "completed" as const }
    ];

    onSave({
      date,
      clientName: clientName.trim(),
      clientTitle: clientTitle.trim() || "Collaborateur / Directeur",
      clientDepartment,
      techName: techProfile.name || "Technicien Informatique",
      techTitle: techProfile.title || "Support CNIPLC",
      deviceType,
      deviceBrand: deviceBrand.trim() || "Standard",
      deviceInventory: deviceInventory.trim() || "N/A",
      rawNotes: rawNotes.trim(),
      professionalSummary: actualSummary,
      tasks: actualTasksParams.map((t, idx) => ({
        ...t,
        id: `task-${Date.now()}-${idx}`
      })),
      status,
      durationMinutes,
      signatureDate: status === "termine" ? date : undefined
    });

    // Reset Form
    setClientName("");
    setClientTitle("");
    setDeviceBrand("");
    setDeviceInventory("");
    setRawNotes("");
    setProfessionalSummary("");
    setTasks([]);
  };

  return (
    <form id="new-intervention-form" onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-slate-200/80 shadow-sm rounded-xl p-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-5 flex items-center justify-between">
          <span>1. Informations Générales & Bénéficiaire</span>
          <span className="text-xs font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
            Intervenant actif : {techProfile.name || "Non Défini"}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Client Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Nom complet du Bénéficiaire *
            </label>
            <input
              id="input-client-name"
              type="text"
              required
              placeholder="ex: M. Jean-Paul Dupont"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full text-slate-800 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/80 bg-white"
            />
          </div>

          {/* Client Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Titre / Fonction officielle
            </label>
            <input
              id="input-client-title"
              type="text"
              placeholder="ex: Directeur des Ressources Humaines"
              value={clientTitle}
              onChange={(e) => setClientTitle(e.target.value)}
              className="w-full text-slate-800 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/80 bg-white"
            />
          </div>

          {/* Client Department */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Département / Direction d'État
            </label>
            <input
              id="input-client-dept"
              type="text"
              placeholder="ex: Cabinet du Directeur, Ressources Humaines..."
              value={clientDepartment}
              onChange={(e) => setClientDepartment(e.target.value)}
              list="departments-list"
              className="w-full text-slate-800 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
            <datalist id="departments-list">
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {/* Equipment Type */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Type de Matériel
            </label>
            <input
              id="input-device-type"
              type="text"
              placeholder="ex: PC Portable, Imprimante, Switch..."
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              list="device-types-list"
              className="w-full text-slate-800 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            />
            <datalist id="device-types-list">
              {DEVICE_TYPES.map((type) => (
                <option key={type.value} value={type.value} />
              ))}
            </datalist>
          </div>

          {/* Device Brand */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Modèle / Marque
            </label>
            <input
              id="input-device-brand"
              type="text"
              placeholder="ex: HP LaserJet M404 / Dell Vostro"
              value={deviceBrand}
              onChange={(e) => setDeviceBrand(e.target.value)}
              className="w-full text-slate-800 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/80 bg-white"
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Date d'intervention
            </label>
            <input
              id="input-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full text-slate-800 text-sm px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/80 bg-white"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 2: Informational / Notes */}
        <div className="bg-white border border-slate-200/80 shadow-sm rounded-xl p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 mb-1 flex items-center justify-between">
              <span>2. Saisie Rapide des Notes de Prestation</span>
              <span className="text-xs font-bold text-slate-400 font-mono">Notes brutes</span>
            </h3>

            <p className="text-xs text-slate-500 leading-normal">
              Écrivez ici vos notes de travail comme vous le feriez à la volée durant le dépannage informatique. Notre moteur d'IA administrative formulera un rapport de haut niveau à présenter au Directeur.
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Vos notes brutes (Que s'est-il passé, qu'avez-vous résolu ?)
              </label>
              <textarea
                id="textarea-raw-notes"
                rows={5}
                required
                placeholder="Rédigez succinctement (ex: depan pc ram lent, ajouter 8go ddr4 dell, suppression adware malware, depoussierage complet)"
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                className="w-full text-slate-800 text-sm p-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500/80 bg-white resize-none"
              />
            </div>

            {aiError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-start gap-2 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex gap-3">
            <button
              id="btn-refine-ia"
              type="button"
              disabled={isAiLoading || !rawNotes.trim()}
              onClick={handleRefineWithIA}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isAiLoading 
                  ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-100"
                  : !rawNotes.trim()
                  ? "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed"
                  : "bg-teal-50 hover:bg-teal-100 active:bg-teal-200 text-teal-800 border border-teal-200/50"
              }`}
            >
              <Sparkles className={`w-4 h-4 text-teal-600 ${isAiLoading ? "animate-spin" : ""}`} />
              {isAiLoading ? "Traitement par l'IA CNIPLC..." : "Générer les termes professionnels par IA"}
            </button>
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-slate-500 font-mono">DURÉE (MINUTES) :</div>
              <input
                id="input-duration-min"
                type="number"
                min={5}
                max={480}
                step={5}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                className="w-16 text-center text-slate-800 text-sm font-mono font-bold px-2 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
          </div>
        </div>

        {/* Output & Final verification before registry insertion */}
        <div className="bg-slate-900 border border-slate-850 shadow-sm rounded-xl p-6 flex flex-col justify-between text-white">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-teal-400 border-b border-slate-800 pb-3 mb-1 flex items-center justify-between">
              <span>3. Rapport d'Intervention Final (Visualisation)</span>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-full uppercase tracking-wider">
                Validation & Archivage
              </span>
            </h3>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Synthèse Rédigée Officielle (Sera incluse sur la fiche papier)
              </label>
              <textarea
                id="textarea-professional-summary"
                rows={4}
                required
                placeholder="La synthèse apparaîtra ici après reformulation IA ou écrivez manuellement le compte rendu."
                value={professionalSummary}
                onChange={(e) => setProfessionalSummary(e.target.value)}
                className="w-full text-white text-sm p-3 bg-slate-800/80 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Subtasks actions grid */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Actes Techniques Atomiques ({tasks.length})
              </label>
              <div className="bg-slate-850 border border-slate-800 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 font-mono scrollbar-thin">
                {tasks.map((task, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-805/80 p-2 rounded border border-slate-800 group hover:border-slate-750">
                    <div className="text-xs truncate max-w-[80%]">
                      <span className="text-teal-400 mr-2">[{task.category}]</span>
                      <span className="text-slate-200">{task.description}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTask(idx)}
                      className="text-slate-500 hover:text-red-400 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {tasks.length === 0 && (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Aucune tâche spécifique listée. Utilisez l'IA ou ajoutez-en manuellement ci-dessous.
                  </div>
                )}
              </div>
            </div>

            {/* Quick addition of common tasks */}
            <div className="space-y-1 mt-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-bold">Actes fréquents (Saisie en 1 clic) :</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-850 rounded border border-slate-800 scrollbar-thin">
                {[
                  { text: "Diagnostic initial matériel & logiciel", cat: "Matériel" },
                  { text: "Dépoussiérage & nettoyage thermique complet", cat: "Matériel" },
                  { text: "Installation physique de mémoire RAM DDR4", cat: "Optimisation" },
                  { text: "Remplacement du disque dur par un SSD rapide", cat: "Matériel" },
                  { text: "Mise à jour corrective de sécurité système", cat: "Sécurité" },
                  { text: "Configuration d'IP statique & route réseaux", cat: "Réseau" },
                  { text: "Partage réseau local de l'unité d'impression", cat: "Réseau" },
                  { text: "Installation et activation de la suite bureautique officielle", cat: "Logiciel" },
                  { text: "Désinfection virale complète & nettoyage cache", cat: "Sécurité" }
                ].map((item, id) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setTasks(prev => [
                        ...prev,
                        { description: item.text, category: item.cat as any, status: "completed" }
                      ]);
                    }}
                    className="text-[10px] bg-slate-800 hover:bg-slate-750 text-teal-400 hover:text-white border border-slate-700/60 px-2 py-0.5 rounded cursor-pointer transition-colors"
                  >
                    + {item.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick manual task insertion */}
            <div className="flex gap-2 bg-slate-850 p-2.5 rounded-lg border border-slate-800 mt-2">
              <input
                id="input-new-task-desc"
                type="text"
                placeholder="Ajouter textuellement un acte technique..."
                value={newTaskDesc}
                onChange={(e) => setNewTaskDesc(e.target.value)}
                className="flex-1 text-xs text-white bg-slate-800 px-3 py-2 border border-slate-700/80 rounded-md focus:outline-none"
              />
              <select
                id="select-new-task-cat"
                value={newTaskCat}
                onChange={(e) => setNewTaskCat(e.target.value as any)}
                className="text-xs text-slate-300 bg-slate-850 px-2 py-2 border border-slate-750 rounded-md focus:outline-none cursor-pointer font-sans"
              >
                {TASK_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddTask}
                className="bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs px-3 font-semibold rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Ajouter
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 font-mono">STATUT INITIAL :</span>
              <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
                <button
                  type="button"
                  onClick={() => setStatus("termine")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer tracking-wider uppercase transition-all ${
                    status === "termine" ? "bg-emerald-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Terminé
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("en_cours")}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer tracking-wider uppercase transition-all ${
                    status === "en_cours" ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  En cours
                </button>
              </div>
            </div>

            <button
              id="btn-save-intervention"
              type="submit"
              className="bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 text-sm font-extrabold px-6 py-3 rounded-xl shadow-lg hover:shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Valider et Enregistrer l'Intervention
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
