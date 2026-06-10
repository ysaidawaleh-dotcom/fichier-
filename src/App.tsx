/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Intervention, TechProfile } from "./types";
import { INITIAL_INTERVENTIONS } from "./data/constants";
import StatsDashboard from "./components/StatsDashboard";
import NewInterventionForm from "./components/NewInterventionForm";
import InterventionsRegistry from "./components/InterventionsRegistry";
import ProfessionalFiche from "./components/ProfessionalFiche";
import SettingsProfile from "./components/SettingsProfile";
import { 
  Building, 
  Cpu, 
  Layers, 
  PlusCircle, 
  Table, 
  Settings, 
  FileText, 
  TrendingUp, 
  Check, 
  Info,
  Calendar,
  Sparkles,
  Printer,
  ChevronRight,
  ChevronLeft,
  X,
  FolderOpen
} from "lucide-react";
import { 
  getDirectoryHandle, 
  saveDirectoryHandle, 
  deleteDirectoryHandle, 
  writeJsonToDirectory 
} from "./utils/localDiskStorage";
import { generateAndDownloadPDF } from "./utils/pdfGenerator";

export default function App() {
  // Stored states
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [techProfile, setTechProfile] = useState<TechProfile>({
    name: "Said Awaleh",
    title: "Ingénieur Support Informatique",
    department: "Systèmes d'Information (DSI)",
    centerName: "CNIPLC"
  });

  const [localDirHandle, setLocalDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [localDirName, setLocalDirName] = useState<string>("");

  // Navigation tabs
  const [activeTab, setActiveTab] = useState<"dashboard" | "new" | "registry" | "settings">("dashboard");
  
  // Selected intervention for printing/viewing
  const [selectedIntervention, setSelectedIntervention] = useState<Intervention | null>(null);

  // Load directory handle and interventions on mount
  useEffect(() => {
    async function loadSavedDirectory() {
      try {
        const handle = await getDirectoryHandle();
        if (handle) {
          setLocalDirHandle(handle);
          setLocalDirName(handle.name);
        }
      } catch (err) {
        console.error("Failed to load saved directory handle:", err);
      }
    }
    loadSavedDirectory();
  }, []);

  // Set up local file picker actions
  const handleConnectDirectory = async () => {
    try {
      const win = window as any;
      if (!win.showDirectoryPicker) {
        alert("Votre navigateur ne supporte pas l'accès direct aux dossiers locaux (l'API FileSystem Access). Veuillez utiliser Google Chrome, Microsoft Edge ou Opera sur ordinateur.");
        return;
      }
      const handle = await win.showDirectoryPicker({
        mode: "readwrite"
      });
      await saveDirectoryHandle(handle);
      setLocalDirHandle(handle);
      setLocalDirName(handle.name);
      alert(`Dossier local "${handle.name}" connecté avec succès comme stockage professionnel ! Les fiches d'intervention JSON y seront enregistrées automatiquement.`);
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Error picking directory:", err);
        alert("Impossible de sélectionner le dossier : " + err.message);
      }
    }
  };

  const handleDisconnectDirectory = async () => {
    await deleteDirectoryHandle();
    setLocalDirHandle(null);
    setLocalDirName("");
    alert("Dossier de sauvegarde locale déconnecté.");
  };

  // Load from local storage on mount
  useEffect(() => {
    const list = localStorage.getItem("cniplc_interventions");
    if (list) {
      try {
        setInterventions(JSON.parse(list));
      } catch (e) {
        setInterventions(INITIAL_INTERVENTIONS);
      }
    } else {
      setInterventions(INITIAL_INTERVENTIONS);
      localStorage.setItem("cniplc_interventions", JSON.stringify(INITIAL_INTERVENTIONS));
    }

    const savedProfile = localStorage.getItem("cniplc_tech_profile");
    if (savedProfile) {
      try {
        setTechProfile(JSON.parse(savedProfile));
      } catch (e) {}
    }
  }, []);

  // Save changes helper
  const saveToLocalStorage = (newList: Intervention[]) => {
    setInterventions(newList);
    localStorage.setItem("cniplc_interventions", JSON.stringify(newList));
  };

  // Handlers
  const handleCreateIntervention = async (formData: Omit<Intervention, "id" | "refNumber" | "createdAt">) => {
    // Generate unique index/ref
    const count = interventions.length + 1;
    const padding = count.toString().padStart(4, "0");
    const currentYear = new Date().getFullYear();
    const refNumber = `${techProfile.centerName || 'CNIPLC'}-${currentYear}-${padding}`;
    const id = `int-${Date.now()}`;

    const newInt: Intervention = {
      ...formData,
      id,
      refNumber,
      createdAt: new Date().toISOString()
    };

    const newList = [newInt, ...interventions];
    saveToLocalStorage(newList);

    const downloadName = `CNIPLC_Fiche_${newInt.refNumber.replace(/\s+/g, "_")}.json`;
    const dataStr = JSON.stringify(newInt, null, 2);

    // 1. Immediately compile and trigger PDF download as requested
    try {
      await generateAndDownloadPDF(newInt);
    } catch (e) {
      console.error("Auto PDF generation failed:", e);
    }

    // 2. Direct local disk storage routing
    if (localDirHandle) {
      try {
        await writeJsonToDirectory(localDirHandle, downloadName, dataStr);
        // Successful direct disk audit log
        console.log(`Automatic background save succeeded: ${downloadName} stored in user-selected folder.`);
      } catch (err: any) {
        console.error("Autosave to connected directory failed:", err);
        alert(`Attention : la sauvegarde automatique dans le dossier "${localDirName}" a échoué. Le fichier JSON va être téléchargé via le navigateur.`);
        
        // Fallback standard browser download
        triggerBrowserDownload(downloadName, dataStr);
      }
    } else {
      // Fallback standard browser download for JSON
      triggerBrowserDownload(downloadName, dataStr);
      
      // Educational professional prompt
      setTimeout(() => {
        alert(
          "Fiche d'intervention et attestation d'État enregistrées avec succès !\n\n" +
          "💡 Astuce Professionnelle CNIPLC : " +
          "Vous pouvez connecter un dossier permanent de votre disque dur (ex: votre dossier Documents ou une clé USB) " +
          "dans l'onglet 'Préférences' pour sauvegarder vos fiches automatiquement sans aucune question du navigateur."
        );
      }, 500);
    }
    
    // Auto shift to registry & select for immediate print view
    setActiveTab("registry");
    setSelectedIntervention(newInt);
  };

  const triggerBrowserDownload = (fileName: string, content: string) => {
    try {
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(content);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', fileName);
      document.body.appendChild(linkElement);
      linkElement.click();
      document.body.removeChild(linkElement);
    } catch (e) {
      console.error("Browser download failed:", e);
    }
  };

  const handleDeleteIntervention = (id: string) => {
    const newList = interventions.filter(i => i.id !== id);
    saveToLocalStorage(newList);
    if (selectedIntervention?.id === id) {
      setSelectedIntervention(null);
    }
  };

  const handleToggleStatus = (id: string) => {
    const newList = interventions.map(i => {
      if (i.id === id) {
        const nextStatus = i.status === "termine" ? "en_cours" : "termine";
        return {
          ...i,
          status: nextStatus,
          signatureDate: nextStatus === "termine" ? new Date().toISOString().substring(0, 10) : undefined
        };
      }
      return i;
    });
    saveToLocalStorage(newList);
    // Sync active select preview
    if (selectedIntervention?.id === id) {
      const updated = newList.find(t => t.id === id);
      if (updated) setSelectedIntervention(updated);
    }
  };

  const handleSaveProfile = (updatedProfile: TechProfile) => {
    setTechProfile(updatedProfile);
    localStorage.setItem("cniplc_tech_profile", JSON.stringify(updatedProfile));
  };

  // Export database to standard JSON file
  const handleExportData = () => {
    const dataStr = JSON.stringify(interventions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `CNIPLC_REGISTRE_IT_${new Date().toISOString().slice(0,10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Import previously saved JSON files
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            saveToLocalStorage(parsed);
            alert("Base de données importée et synchronisée avec succès !");
          } else {
            alert("Erreur de format: Le fichier sélectionné n'est pas un registre d'interventions valide.");
          }
        } catch (error) {
          alert("Erreur lors de la lecture du fichier de sauvegarde.");
        }
      };
    }
  };

  const handleResetFactory = () => {
    saveToLocalStorage(INITIAL_INTERVENTIONS);
    alert("Les données d'exemples ont été réinjectées au registre.");
  };

  const handleClearData = () => {
    saveToLocalStorage([]);
    alert("Toutes les données du registre ont été purgées définitivement.");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      {/* State Official Banner Header */}
      <header className="bg-slate-900 text-white shadow-md border-b-2 border-teal-500/80 no-print">
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-slate-800/60 p-1 rounded-xl border border-teal-500/40 shadow-inner shrink-0 flex items-center justify-center">
              <img 
                src="/api/logo" 
                alt="CNIPLC Logo" 
                className="h-12 w-12 object-contain rounded" 
                referrerPolicy="no-referrer"
                onError={(e) => {
                  // If the image fails to load for any reason, hide default cross and show simple fallback circle (or text)
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-teal-400 uppercase tracking-widest font-mono">
                  République de Djibouti - Administration Informatique
                </span>
              </div>
              <h1 className="text-lg md:text-xl font-extrabold uppercase tracking-tight flex items-center gap-1.5 mt-0.5">
                {techProfile.centerName || "CNIPLC"} - Registre des Interventions IT
              </h1>
            </div>
          </div>

          {/* User quick badge status */}
          <div className="flex items-center gap-2">
            <div className="text-right text-xs hidden md:block">
              <span className="text-slate-400 block font-medium">Informaticien de Service</span>
              <strong className="text-teal-400 text-sm font-semibold">{techProfile.name}</strong>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-teal-500/80 flex items-center justify-center font-bold text-teal-400 text-base shadow uppercase">
              {techProfile.name[0] || 'T'}
            </div>
          </div>
        </div>
      </header>

      {/* Primary tab navigator */}
      <nav className="bg-white border-b border-slate-200/80 shadow-sm no-print">
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 overflow-x-auto scrollbar-none py-1.5">
          <button
            id="nav-tab-dashboard"
            onClick={() => setActiveTab("dashboard")}
            className={`px-4 py-3 text-xs md:text-sm font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "dashboard"
                ? "bg-teal-50/80 text-teal-800 border-b-2 border-teal-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-teal-600" />
            Tableau de Bord & Stats
          </button>

          <button
            id="nav-tab-new"
            onClick={() => setActiveTab("new")}
            className={`px-4 py-3 text-xs md:text-sm font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "new"
                ? "bg-teal-50/80 text-teal-800 border-b-2 border-teal-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <PlusCircle className="w-4 h-4 text-teal-600 animate-bounce" />
            Consigner une Intervention
          </button>

          <button
            id="nav-tab-registry"
            onClick={() => setActiveTab("registry")}
            className={`px-4 py-3 text-xs md:text-sm font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "registry"
                ? "bg-teal-50/80 text-teal-800 border-b-2 border-teal-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Table className="w-4 h-4 text-teal-600" />
            Registre & Fiches à Signer
            <span className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded text-[10px] font-mono leading-none">
              {interventions.length}
            </span>
          </button>

          <button
            id="nav-tab-settings"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-3 text-xs md:text-sm font-bold rounded-lg flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === "settings"
                ? "bg-teal-50/80 text-teal-800 border-b-2 border-teal-600 shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Settings className="w-4 h-4 text-teal-600" />
            Préférences & Import/Export
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 no-print">
        <AnimatePresence mode="popLayout">
          {selectedIntervention && activeTab === "registry" && (
            <motion.div
              initial={{ opacity: 0, y: -15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="mb-8 border border-teal-150 rounded-2xl bg-teal-50/10 p-4 relative shadow-sm max-w-4xl mx-auto"
            >
              <button
                onClick={() => setSelectedIntervention(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-full cursor-pointer hover:shadow transition-all z-10"
                title="Masquer l'aperçu"
              >
                <X className="w-4 h-4" />
              </button>
              <ProfessionalFiche 
                intervention={selectedIntervention} 
                onPrint={handlePrint} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic tabs components routing with clean slide and fade entry */}
        <AnimatePresence mode="wait">
          {activeTab === "dashboard" && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <StatsDashboard interventions={interventions} />
            </motion.div>
          )}

          {activeTab === "new" && (
            <motion.div
              key="new"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <NewInterventionForm 
                onSave={handleCreateIntervention} 
                techProfile={techProfile}
              />
            </motion.div>
          )}

          {activeTab === "registry" && (
            <motion.div
              key="registry"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <InterventionsRegistry
                interventions={interventions}
                onSelect={setSelectedIntervention}
                onDelete={handleDeleteIntervention}
                onToggleStatus={handleToggleStatus}
              />
            </motion.div>
          )}

          {activeTab === "settings" && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
            >
              <SettingsProfile
                techProfile={techProfile}
                onSaveProfile={handleSaveProfile}
                onExportData={handleExportData}
                onImportData={handleImportData}
                onResetFactory={handleResetFactory}
                onClearData={handleClearData}
                localDirName={localDirName}
                onConnectDirectory={handleConnectDirectory}
                onDisconnectDirectory={handleDisconnectDirectory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Background full-size Printable Page Container exclusively visible when printing */}
      {selectedIntervention ? (
        <div id="print-area-only" className="hidden print:block absolute left-0 top-0 w-full bg-white text-black p-0">
          <ProfessionalFiche 
            intervention={selectedIntervention} 
            onPrint={handlePrint} 
          />
        </div>
      ) : (
        <div id="print-area-fallback" className="hidden print:block absolute left-0 top-0 w-full text-center p-10 font-mono text-sm">
          Pour imprimer une attestation administrative officielle, veuillez d'abord sélectionner une ligne dans l'historique et cliquer sur "Imprimer" pour générer la mise en page correcte de signature.
        </div>
      )}

      {/* Footer copyright */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-500 py-6 text-center text-xs mt-12 no-print">
        <div className="max-w-7xl mx-auto px-4 space-y-1">
          <p>© {new Date().getFullYear()} - Registre d'Archives de Prestations et Service Fait d'État.</p>
          <p className="text-[10px] text-slate-600 font-mono">
            Développé pour les services informatiques du CNIPLC • Soumis aux règles de traçabilité administrative d'État.
          </p>
        </div>
      </footer>
    </div>
  );
}
