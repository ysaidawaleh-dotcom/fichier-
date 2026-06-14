/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Intervention, TechProfile, TaskItem, DevicePhoto } from "../types";
import { DEPARTMENTS, DEVICE_TYPES, TASK_CATEGORIES } from "../data/constants";
import { Sparkles, Plus, Trash2, Save, AlertTriangle, UploadCloud, Camera, X } from "lucide-react";
import { GoogleGenAI, Type } from "@google/genai";
import PhotoCollage from "./PhotoCollage";

interface NewInterventionFormProps {
  onSave: (intervention: Omit<Intervention, "id" | "refNumber" | "createdAt">) => void;
  techProfile: TechProfile;
  theme?: "light" | "dark";
  interventions: Intervention[];
}

export default function NewInterventionForm({ 
  onSave, 
  techProfile, 
  theme = "light",
  interventions = []
}: NewInterventionFormProps) {
  const [clientName, setClientName] = useState("");
  const [clientTitle, setClientTitle] = useState("");
  const [clientDepartment, setClientDepartment] = useState(DEPARTMENTS[0]);
  const [quickNotes, setQuickNotes] = useState("");
  
  const [deviceType, setDeviceType] = useState(DEVICE_TYPES[0].value);
  const [deviceBrand, setDeviceBrand] = useState("");
  const [deviceInventory, setDeviceInventory] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [date, setDate] = useState(() => new Date().toISOString().substring(0, 10));

  const [rawNotes, setRawNotes] = useState("");
  const [professionalSummary, setProfessionalSummary] = useState("");
  const [tasks, setTasks] = useState<Omit<TaskItem, "id">[]>([]);
  const [status, setStatus] = useState<"termine" | "en_cours">("termine");
  const [photos, setPhotos] = useState<DevicePhoto[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files) as File[];
    const currentLen = photos.length;
    const availableSlots = 6 - currentLen;
    const filesToProcess = filesArray.slice(0, availableSlots);

    if (filesArray.length > availableSlots) {
      alert("Limite dépassée : Vous pouvez ajouter un maximum de 6 photos d'intervention pour conserver un rapport de qualité administrative sur une seule page.");
    }

    filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setPhotos((prev) => [
          ...prev,
          {
            id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            url: base64String,
            taskDescription: "", // filled manually by the user
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePhotoDescChange = (id: string, text: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, taskDescription: text } : p))
    );
  };

  // Manual subtask field helpers
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskCat, setNewTaskCat] = useState<TaskItem["category"]>("Matériel");

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");

  // System of dynamic local memorization for frequent names and departments
  const clientFrequency: { [name: string]: { count: number; title: string; dept: string } } = {};
  const departmentFrequency: { [dept: string]: number } = {};

  interventions.forEach((item) => {
    const name = item.clientName?.trim();
    if (name) {
      if (!clientFrequency[name]) {
        clientFrequency[name] = { count: 0, title: item.clientTitle || "", dept: item.clientDepartment || "" };
      }
      clientFrequency[name].count += 1;
    }

    const dept = item.clientDepartment?.trim();
    if (dept) {
      departmentFrequency[dept] = (departmentFrequency[dept] || 0) + 1;
    }
  });

  const topFrequentClients = Object.entries(clientFrequency)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, info]) => ({ name, ...info }));

  // Combined standard departments list + frequent custom input ones
  const displayedDepartments = Array.from(new Set([
    ...topFrequentClients.map(c => c.dept),
    ...Object.keys(departmentFrequency).sort((a, b) => departmentFrequency[b] - departmentFrequency[a]),
    ...DEPARTMENTS
  ])).filter(Boolean).slice(0, 20);

  const isDark = theme === "dark";

  const handleRefineWithIA = async () => {
    if (!rawNotes.trim()) {
      setAiError("Veuillez d'abord saisir vos notes d'intervention rapides/brutes ci-dessous.");
      return;
    }
    setAiError("");
    setIsAiLoading(true);

    try {
      let data: any = null;
      let response;

      try {
        response = await fetch("/api/refine-tasks", {
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

        if (response.ok) {
          data = await response.json();
        } else {
          throw new Error("Impossible de joindre le service de reformulation administrative.");
        }
      } catch (backendErr) {
        console.warn("[Vercel/Local Fallback] Le serveur d'API Express n'est pas actif (normal sur Vercel sans serveur). Test de la clé VITE_GEMINI_API_KEY côté client...", backendErr);
        
        // Retrieve key client side
        const clientApiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || (window as any).VITE_GEMINI_API_KEY;

        if (clientApiKey) {
          console.log("[Client Gemini] Exécution directe côté navigateur via le SDK GoogleGenAI...");
          const aiClient = new GoogleGenAI({ apiKey: clientApiKey });
          const prompt = `Notes brutes du technicien: "${rawNotes}"\nÉquipement concerné: ${deviceType || 'PC'} (Marque: ${deviceBrand || 'Standard'})\nBénéficiaire: ${clientName || 'Collaborateur'} (${clientTitle || 'Fonctionnaire'})\nSecteur/Département: ${clientDepartment || 'Dossier Technique'}\n\nFormulez ceci de manière extrêmement professionnelle en insérant intelligemment et formellement ces informations dans un style d'attestation administrative officielle d'État de style République de Djibouti.`;

          const aiResponse = await aiClient.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              systemInstruction: 
                "Vous êtes un expert IA des rédactions techniques et administratives de haut niveau pour l'État, rattaché au CNIPLC (Centre National d'Informatique) de la République de Djibouti. " +
                "Votre mission est d'aider les techniciens à transformer leurs notes d'intervention rapides (ex: 'depan pc ram qui rame') en rapports techniques d'intervention " +
                "hautement professionnels, rédigés en français officiel, élégant, soutenu et précis. " +
                "Intégrez intelligemment le bénéficiaire, sa fonction officielle, son direction/département, ainsi que le matériel et sa marque dans un compte rendu global parfait. " +
                "Séparez l'intervention en une synthèse globale formelle personnalisée ('professionalSummary') " +
                "et une série d'actions techniques atomiques ('tasks') catégorisées.",
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  professionalSummary: {
                    type: Type.STRING,
                    description: "Une synthèse rédigée polie et hautement professionnelle décrivant l'ensemble de l'opération en français de style officiel en intégrant le bénéficiaire, sa fonction, son département, le matériel résolu et la résolution positive de la panne."
                  },
                  tasks: {
                    type: Type.ARRAY,
                    description: "La décomposition des actions de maintenance et d'assistance concrètes réalisées.",
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        description: {
                          type: Type.STRING,
                          description: "Une phrase courte et claire décrivant l'action précise réalisée (ex: 'Démontage interne, dépollution mécanique des composants et mise à niveau de la RAM DDR4 8Go')."
                        },
                        category: {
                          type: Type.STRING,
                          enum: ["Matériel", "Logiciel", "Réseau", "Sécurité", "Optimisation", "Autre"],
                          description: "La classification de l'action technique."
                        }
                      },
                      required: ["description", "category"]
                    }
                  }
                },
                required: ["professionalSummary", "tasks"]
              }
            }
          });

          if (aiResponse.text) {
            data = JSON.parse(aiResponse.text.trim());
          } else {
            throw new Error("L'API Gemini côté navigateur n'a retourné aucun contenu.");
          }
        } else {
          // Both server is unavailable AND VITE_GEMINI_API_KEY is not defined in Vercel.
          throw new Error("Vercel_No_API_Key");
        }
      }
      
      if (data && data.professionalSummary) {
        setProfessionalSummary(data.professionalSummary);
      }
      
      if (data && data.tasks && Array.isArray(data.tasks)) {
        setTasks(data.tasks.map((t: any) => ({
          description: t.description,
          category: t.category,
          status: "completed"
        })));
      }
    } catch (err: any) {
      console.error(err);
      if (err.message === "Vercel_No_API_Key") {
        setAiError("Déploiement Vercel : La serveur Express de l'API /api/refine-tasks n'est pas démarré (comportement Vercel par défaut). Pour que la génération fonctionne, déclarez simplement la variable d'environnement VITE_GEMINI_API_KEY dans le panneau de configuration de Vercel !");
      } else {
        setAiError("Le service IA du CNIPLC n'a pas pu traiter ce texte. Une reformulation générique a été appliquée.");
      }
      
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
      quickNotes: quickNotes.trim(),
      professionalSummary: actualSummary,
      tasks: actualTasksParams.map((t, idx) => ({
        ...t,
        id: `task-${Date.now()}-${idx}`
      })),
      status,
      durationMinutes,
      photos,
      signatureDate: status === "termine" ? date : undefined
    });

    // Reset Form
    setClientName("");
    setClientTitle("");
    setDeviceBrand("");
    setDeviceInventory("");
    setRawNotes("");
    setQuickNotes("");
    setProfessionalSummary("");
    setTasks([]);
    setPhotos([]);
  };

  return (
    <form id="new-intervention-form" onSubmit={handleSubmit} className="space-y-6">
      <div className={`border shadow-sm rounded-xl p-6 transition-colors duration-200 ${
        isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-900"
      }`}>
        <h3 className={`text-base font-bold border-b pb-3 mb-5 flex items-center justify-between ${
          isDark ? "border-slate-800 text-slate-100" : "border-slate-100 text-slate-900"
        }`}>
          <span>1. Informations Générales & Bénéficiaire</span>
          <span className={`text-xs font-mono px-2 py-0.5 rounded ${
            isDark ? "bg-teal-950/40 text-teal-400 border border-teal-500/20" : "bg-teal-50 text-teal-700"
          }`}>
            Intervenant actif : {techProfile.name || "Non Défini"}
          </span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Client Name */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}>
              Nom complet du Bénéficiaire *
            </label>
            <input
              id="input-client-name"
              type="text"
              required
              placeholder="ex: M. Jean-Paul Dupont"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              list="frequent-clients-list"
              className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDark ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-650" : "bg-white border-slate-200 text-slate-800"
              }`}
            />
            <datalist id="frequent-clients-list">
              {topFrequentClients.map((client) => (
                <option key={client.name} value={client.name}>
                  {client.title ? `${client.title} - ` : ""}{client.dept}
                </option>
              ))}
            </datalist>

            {topFrequentClients.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider self-center">Frequent :</span>
                {topFrequentClients.map((client) => (
                  <button
                    key={client.name}
                    type="button"
                    onClick={() => {
                      setClientName(client.name);
                      setClientTitle(client.title);
                      setClientDepartment(client.dept);
                    }}
                    className={`text-[10px] font-semibold border px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                      isDark
                        ? "border-slate-800 bg-slate-950/60 text-teal-400 hover:text-white hover:bg-slate-800"
                        : "border-slate-200 bg-slate-100/50 text-teal-700 hover:text-teal-900 hover:bg-slate-200/50"
                    }`}
                    title={`Remplir : ${client.title} - ${client.dept}`}
                  >
                    {client.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Client Title */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}>
              Titre / Fonction officielle
            </label>
            <input
              id="input-client-title"
              type="text"
              placeholder="ex: Directeur des Ressources Humaines"
              value={clientTitle}
              onChange={(e) => setClientTitle(e.target.value)}
              className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDark ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-650" : "bg-white border-slate-200 text-slate-800"
              }`}
            />
          </div>

          {/* Client Department */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}>
              Département / Direction d'État
            </label>
            <input
              id="input-client-dept"
              type="text"
              placeholder="ex: Cabinet du Directeur, Ressources Humaines..."
              value={clientDepartment}
              onChange={(e) => setClientDepartment(e.target.value)}
              list="departments-list"
              className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDark ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-650" : "bg-white border-slate-200 text-slate-800"
              }`}
            />
            <datalist id="departments-list">
              {displayedDepartments.map((dept) => (
                <option key={dept} value={dept} />
              ))}
            </datalist>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {/* Equipment Type */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}>
              Type de Matériel
            </label>
            <input
              id="input-device-type"
              type="text"
              placeholder="ex: PC Portable, Imprimante, Switch..."
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
              list="device-types-list"
              className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDark ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-650" : "bg-white border-slate-200 text-slate-800"
              }`}
            />
            <datalist id="device-types-list">
              {DEVICE_TYPES.map((type) => (
                <option key={type.value} value={type.value} />
              ))}
            </datalist>
          </div>

          {/* Device Brand */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}>
              Modèle / Marque
            </label>
            <input
              id="input-device-brand"
              type="text"
              placeholder="ex: HP LaserJet M404 / Dell Vostro"
              value={deviceBrand}
              onChange={(e) => setDeviceBrand(e.target.value)}
              className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDark ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-650" : "bg-white border-slate-200 text-slate-800"
              }`}
            />
          </div>

          {/* Date */}
          <div className="space-y-1.5">
            <label className={`block text-xs font-semibold uppercase tracking-wider ${
              isDark ? "text-slate-300" : "text-slate-700"
            }`}>
              Date d'intervention
            </label>
            <input
              id="input-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full text-sm px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                isDark ? "bg-slate-950 border-slate-800 text-white focus:bg-slate-950" : "bg-white border-slate-200 text-slate-805"
              }`}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Step 2: Informational / Notes */}
        <div className={`border shadow-sm rounded-xl p-6 flex flex-col justify-between transition-colors duration-200 ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-custom-gray"
        }`}>
          <div className="space-y-4">
            <h3 className={`text-base font-bold border-b pb-3 mb-1 flex items-center justify-between ${
              isDark ? "border-slate-800 text-slate-100" : "border-slate-105 text-slate-900"
            }`}>
              <span>2. Saisie Rapide des Notes de Prestation</span>
              <span className="text-xs font-bold text-slate-400 font-mono">Notes brutes</span>
            </h3>

            <p className="text-xs text-slate-500 leading-normal">
              Écrivez ici vos notes de travail comme vous le feriez à la volée durant le dépannage informatique. Notre moteur d'IA administrative formulera un rapport de haut niveau à présenter au Directeur.
            </p>

            <div className="space-y-2">
              <label className={`block text-xs font-semibold uppercase tracking-wider ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                Vos notes brutes (Que s'est-il passé, qu'avez-vous résolu ?) *
              </label>
              <textarea
                id="textarea-raw-notes"
                rows={4}
                required
                placeholder="Rédigez succinctement (ex: depan pc ram lent, ajouter 8go ddr4 dell, suppression adware malware, depoussierage complet)"
                value={rawNotes}
                onChange={(e) => setRawNotes(e.target.value)}
                className={`w-full text-sm p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
                  isDark ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-655" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>

            <div className="space-y-2">
              <label className={`block text-xs font-semibold uppercase tracking-wider ${
                isDark ? "text-slate-300" : "text-slate-700"
              }`}>
                Notes rapides / Observations complémentaires (Optionnel)
              </label>
              <textarea
                id="textarea-quick-notes"
                rows={2}
                placeholder="Détails contextuels ou observations de maintenance non structurées (ex: écran un peu rayé, câblage nettoyé, onduleur fatigué)"
                value={quickNotes}
                onChange={(e) => setQuickNotes(e.target.value)}
                className={`w-full text-sm p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none ${
                  isDark ? "bg-slate-950 border-slate-800 text-white placeholder:text-slate-655" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
              <p className="text-[10px] text-slate-450">
                Ces observations de maintenance ne sont pas traitées par l'IA mais seront consignées directement sur la fiche d'intervention.
              </p>
            </div>

            {aiError && (
              <div className={`border p-3 rounded-lg flex items-start gap-2 text-xs ${
                isDark ? "bg-amber-955/20 border-amber-900/40 text-amber-300" : "bg-amber-50 border-amber-200 text-amber-800"
              }`}>
                <AlertTriangle className="w-4 h-4 text-amber-653 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}
          </div>

          <div className={`mt-6 pt-4 border-t flex gap-3 ${
            isDark ? "border-slate-800" : "border-slate-105"
          }`}>
            <button
              id="btn-refine-ia"
              type="button"
              disabled={isAiLoading || !rawNotes.trim()}
              onClick={handleRefineWithIA}
              className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isAiLoading 
                  ? "bg-slate-800 text-slate-500 border border-slate-850 cursor-not-allowed"
                  : !rawNotes.trim()
                  ? isDark
                    ? "bg-slate-950 text-slate-600 border border-slate-850 cursor-not-allowed"
                    : "bg-slate-50 text-slate-400 border border-slate-100 cursor-not-allowed"
                  : isDark
                    ? "bg-teal-950/40 hover:bg-teal-900/40 text-teal-300 border border-teal-800/60"
                    : "bg-teal-50 hover:bg-teal-100 active:bg-teal-200 text-teal-850 border border-teal-200/50"
              }`}
            >
              <Sparkles className={`w-4 h-4 text-teal-605 ${isAiLoading ? "animate-spin" : ""}`} />
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
                className={`w-16 text-center text-sm font-mono font-bold px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 ${
                  isDark ? "bg-slate-950 border-slate-800 text-teal-400" : "bg-white border-slate-200 text-slate-800"
                }`}
              />
            </div>
          </div>
        </div>

        <div className={`border shadow-sm rounded-xl p-6 transition-colors duration-200 mt-6 ${
          isDark ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-200/80 text-slate-900"
        }`}>
          <h3 className={`text-base font-bold border-b pb-3 mb-4 flex items-center justify-between ${
            isDark ? "border-slate-800 text-slate-100" : "border-slate-100 text-slate-900"
          }`}>
            <span className="flex items-center gap-1.5 font-sans">
              <Camera className="w-4.5 h-4.5 text-teal-500" />
              <span>4. Photos des Équipements et Preuves de Prestation</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">Max 6 photos</span>
          </h3>

          <p className="text-xs text-slate-500 leading-normal mb-4">
            Importez des clichés des pannes constatées ou des opérations effectuées. L'application générera automatiquement un collage professionnel adapté sur la fiche d'intervention imprimée.
          </p>

          <input
            id="images-collages-uploader"
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div
            onClick={() => document.getElementById("images-collages-uploader")?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-2 group ${
              isDark 
                ? "border-slate-800 hover:border-teal-500/50 bg-slate-950/20 hover:bg-slate-950/40" 
                : "border-slate-200 hover:border-teal-500 bg-slate-50/50 hover:bg-teal-550/20"
            }`}
          >
            <UploadCloud className={`w-10 h-10 transition-transform group-hover:scale-105 ${
              isDark ? "text-slate-600 group-hover:text-teal-400" : "text-slate-400 group-hover:text-teal-500"
            }`} />
            <span className="text-xs font-bold uppercase tracking-wider text-teal-605">Importer ou Déposer des images</span>
            <span className="text-[10px] text-slate-400">Glissez-déposez jusqu'à 6 photos des équipements</span>
          </div>

          {photos.length > 0 && (
            <div className="space-y-4 mt-6">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-sans">Descriptif des actes accomplis pour chaque image :</h4>
              <div className="space-y-3">
                {photos.map((photo, idx) => (
                  <div 
                    key={photo.id}
                    className={`flex gap-3 p-2.5 rounded-lg border items-center transition-all ${
                      isDark ? "bg-slate-950/60 border-slate-800/80" : "bg-slate-50/40 border-slate-100"
                    }`}
                  >
                    <div className="w-12 h-12 rounded overflow-hidden relative group shrink-0 border border-slate-350 dark:border-slate-850">
                      <img 
                        src={photo.url} 
                        alt="Miniature" 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex-1 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-teal-500">PHOTO {idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(photo.id)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-0.5 cursor-pointer flex items-center justify-center"
                          title="Supprimer cette photo"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Action technique accomplie (ex: Dépression et nettoyage interne...)"
                        value={photo.taskDescription}
                        onChange={(e) => handlePhotoDescChange(photo.id, e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 border rounded focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 transition-colors ${
                          isDark ? "bg-slate-900 border-slate-800 text-white placeholder:text-slate-650" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-dashed border-slate-200/50 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2 font-sans">Aperçu temps réel de la planche de collage :</span>
                <div className={`p-3 rounded-xl border border-dashed ${
                  isDark ? "border-slate-800 bg-slate-950/20" : "border-slate-200/60 bg-slate-50/20"
                }`}>
                  <PhotoCollage photos={photos} theme={isDark ? "dark" : "light"} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Output & Final verification before registry insertion */}
        <div className={`border shadow-sm rounded-xl p-6 flex flex-col justify-between transition-colors duration-200 ${
          isDark ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-900 text-white border-slate-852"
        }`}>
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
                className="w-full text-white text-sm p-3 bg-slate-800/80 border border-slate-700/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none font-sans leading-relaxed"
              />
            </div>

            {/* Subtasks actions grid */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Actes Techniques Atomiques ({tasks.length})
              </label>
              <div className="bg-slate-850 border border-slate-800/85 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2 font-mono scrollbar-thin">
                {tasks.map((task, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800 group hover:border-slate-750">
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
                className="text-xs text-slate-300 bg-slate-850 px-2 py-2 border border-slate-755 rounded-md focus:outline-none cursor-pointer font-sans"
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

          <div className="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4">
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
              className="bg-teal-500 hover:bg-teal-405 active:bg-teal-600 text-slate-950 text-sm font-extrabold px-6 py-3 rounded-xl shadow-lg hover:shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
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
