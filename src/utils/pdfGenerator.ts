/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from "jspdf";
import { Intervention } from "../types";

// Helper to fetch and convert image to base64
const getBase64ImageFromUrl = async (imageUrl: string): Promise<string | null> => {
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const absoluteUrl = imageUrl.startsWith("/") ? origin + imageUrl : imageUrl;
    const res = await fetch(absoluteUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export async function generateAndDownloadPDF(intervention: Intervention): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4"
  });

  // Get official base64 logo
  const imgData = await getBase64ImageFromUrl("/api/logo");

  let currentY = 15;

  // 1. HEADER SECTION
  if (imgData) {
    // Draw Logo CNIPLC
    doc.addImage(imgData, "JPEG", 15, currentY, 20, 20);
    
    // State Text with indentation
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate-500
    doc.text("RÉPUBLIQUE DE DJIBOUTI", 38, currentY + 3);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42); // Slate-900
    const headerLines = doc.splitTextToSize("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", 100);
    doc.text(headerLines, 38, currentY + 7);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(197, 160, 67); // Gold-500
    doc.text("CNIPLC - SERVICES TECHNIQUES DE L'INFORMATIQUE", 38, currentY + 16);
  } else {
    // Fallback title text if logo doesn't fetch
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text("RÉPUBLIQUE DE DJIBOUTI", 15, currentY + 3);
    
    doc.setFontSize(8);
    const headerLines = doc.splitTextToSize("COMMISSION NATIONALE INDÉPENDANTE POUR LA PRÉVENTION ET LA LUTTE CONTRE LA CORRUPTION", 120);
    doc.text(headerLines, 15, currentY + 8);
    
    doc.setFontSize(8);
    doc.setTextColor(197, 160, 67);
    doc.text("CNIPLC - SERVICES TECHNIQUES DE L'INFORMATIQUE", 15, currentY + 18);
  }

  // Metadata block (Right side)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`REF : ${intervention.refNumber}`, 195, currentY + 4, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date : ${new Date(intervention.date).toLocaleDateString('fr-FR')}`, 195, currentY + 9, { align: "right" });
  doc.text(`Durée : ${intervention.durationMinutes} min`, 195, currentY + 14, { align: "right" });

  // Horizontal separator Gold styled line
  currentY += 23;
  doc.setDrawColor(197, 160, 67); // Gold
  doc.setLineWidth(0.8);
  doc.line(15, currentY, 195, currentY);

  // 2. DOCUMENT CORE TITLE
  currentY += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42);
  doc.text("FICHE D'INTERVENTION TECHNIQUE", 105, currentY, { align: "center" });
  
  currentY += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(197, 160, 67);
  doc.text("& ATTESTATION DE SERVICE FAIT", 105, currentY, { align: "center" });

  // 3. PARTIES GRID BOX
  currentY += 10;
  // Background and border boxes for parties
  doc.setFillColor(253, 250, 242); // Warm Gold-50 accent
  doc.roundedRect(15, currentY, 86, 30, 2, 2, "F");
  doc.setDrawColor(242, 223, 174); // Gold-200 border
  doc.setLineWidth(0.25);
  doc.roundedRect(15, currentY, 86, 30, 2, 2, "D");
  
  doc.setFillColor(253, 250, 242);
  doc.roundedRect(109, currentY, 86, 30, 2, 2, "F");
  doc.setDrawColor(242, 223, 174);
  doc.roundedRect(109, currentY, 86, 30, 2, 2, "D");

  // Column 1 content
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(147, 113, 35); // Gold-700
  doc.text("INTERVENANT (TECHNICIEN IT)", 19, currentY + 5);
  doc.setDrawColor(245, 231, 194);
  doc.setLineWidth(0.15);
  doc.line(19, currentY + 6.5, 95, currentY + 6.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(intervention.techName, 19, currentY + 12);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(intervention.techTitle, 19, currentY + 17);
  doc.text("Département d'Origine : CNIPLC Informatique", 19, currentY + 22);

  // Column 2 content
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(147, 113, 35);
  doc.text("BÉNÉFICIAIRE (DEMANDEUR)", 113, currentY + 5);
  doc.line(113, currentY + 6.5, 189, currentY + 6.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(intervention.clientName, 113, currentY + 12);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(intervention.clientTitle, 113, currentY + 17);
  doc.text(`Département/Direction : ${intervention.clientDepartment}`, 113, currentY + 22);

  // 4. EQUIPMENT SPECIFICATIONS
  currentY += 36;
  doc.setFillColor(253, 250, 242);
  doc.roundedRect(15, currentY, 180, 20, 1.5, 1.5, "F");
  doc.setDrawColor(242, 223, 174);
  doc.setLineWidth(0.25);
  doc.roundedRect(15, currentY, 180, 20, 1.5, 1.5, "D");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(115, 84, 24); // Gold-850
  doc.text("DÉTAILS DE L'ÉQUIPEMENT INFORMATIQUE CONCERNÉ", 19, currentY + 5);
  doc.setDrawColor(245, 231, 194);
  doc.line(19, currentY + 6.5, 191, currentY + 6.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text("Type de matériel :", 19, currentY + 11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(intervention.deviceType.toUpperCase(), 19, currentY + 15);

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Modèle / Marque :", 79, currentY + 11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(intervention.deviceBrand || "Standard/Inconnu", 79, currentY + 15);

  // Since Asset Tag inventory input is deleted, we either read it from data or display static/N/A
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("N° Inventaire (Asset Code) :", 139, currentY + 11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(intervention.deviceInventory || "N/A", 139, currentY + 15);

  // 5. RAPPORT SYNTHÉTIQUE
  currentY += 26;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("RAPPORT SYNTHÉTIQUE D'INTERVENTION", 15, currentY);
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.2);
  doc.line(15, currentY + 1.5, 195, currentY + 1.5);

  currentY += 5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59); // Slate-800
  
  const summaryText = intervention.professionalSummary || "Aucune description rédigée.";
  const wrappedSummary = doc.splitTextToSize(summaryText, 180);
  doc.text(wrappedSummary, 15, currentY);

  currentY += (wrappedSummary.length * 4.2) + 5;

  // Render quickNotes if present
  if (intervention.quickNotes) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42); 
    doc.text("Notes rapides / Observations complémentaires :", 15, currentY);
    currentY += 4.5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105); // Slate-600
    const wrappedQuickNotes = doc.splitTextToSize(intervention.quickNotes, 180);
    doc.text(wrappedQuickNotes, 15, currentY);
    currentY += (wrappedQuickNotes.length * 3.8) + 5;
  }

  // 6. ACTION NOMENCLATURE TABLE
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text("NOMENCLATURE DES ACTIONS TECHNIQUES RÉALISÉES", 15, currentY);
  doc.line(15, currentY + 1.5, 195, currentY + 1.5);

  currentY += 5;
  
  // Draw Table Header Backplate
  doc.setFillColor(15, 23, 42); // Black slate
  doc.rect(15, currentY, 180, 7, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text("N°", 18, currentY + 4.8);
  doc.text("Action de Maintenance Corrective et Préventive", 26, currentY + 4.8);
  doc.text("Catégorie", 146, currentY + 4.8);
  doc.text("Statut", 176, currentY + 4.8);

  currentY += 7;

  // Draw table rows
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  
  intervention.tasks.forEach((task, index) => {
    // Compute wrapped task line
    const wrappedDesc = doc.splitTextToSize(task.description, 115);
    const rowHeight = Math.max(wrappedDesc.length * 4, 7);

    // Grid boundaries
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.25);
    doc.line(15, currentY + rowHeight, 195, currentY + rowHeight); // Row floor

    // Draw vertical column separators
    doc.line(15, currentY, 15, currentY + rowHeight);
    doc.line(23, currentY, 23, currentY + rowHeight);
    doc.line(142, currentY, 142, currentY + rowHeight);
    doc.line(172, currentY, 172, currentY + rowHeight);
    doc.line(195, currentY, 195, currentY + rowHeight);

    // Row Text Fill
    doc.setTextColor(71, 85, 105);
    doc.text((index + 1).toString(), 19, currentY + 4.5, { align: "center" });
    
    doc.setTextColor(15, 23, 42);
    doc.text(wrappedDesc, 26, currentY + 4.5);
    
    doc.setFont("helvetica", "bold");
    doc.setTextColor(147, 113, 35); // Gold-700
    doc.text(task.category, 144, currentY + 4.5);
    
    doc.setTextColor(16, 185, 129); // Emerald-500
    doc.text("✓ FAIT", 176, currentY + 4.5);
    
    doc.setFont("helvetica", "normal");
    currentY += rowHeight;
  });

  if (intervention.tasks.length === 0) {
    doc.setDrawColor(226, 232, 240);
    doc.line(15, currentY + 8, 195, currentY + 8);
    doc.rect(15, currentY, 180, 8);
    doc.setTextColor(148, 163, 184);
    doc.text("Aucun acte technique enregistré.", 105, currentY + 5.5, { align: "center" });
    currentY += 8;
  }

  // Check if page overflow is imminent
  if (currentY > 225) {
    doc.addPage();
    currentY = 20;
  }

  // 7. COMMITMENT STATEMENT
  currentY += 8;
  doc.setFillColor(253, 250, 242);
  doc.roundedRect(15, currentY, 180, 18, 1, 1, "F");
  doc.setDrawColor(242, 223, 174);
  doc.roundedRect(15, currentY, 180, 18, 1, 1, "D");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(115, 115, 115);
  
  const declaration = "Déclaration administrative : Ce document atteste de la réalisation effective des travaux de dépannage, d'assistance, d'installation d'équipements ou de maintenance réseau décrits ci-dessus par les services informatiques d'État (CNIPLC). Le bénéficiaire (ou le Directeur de Service) atteste par sa signature que les systèmes informatiques mentionnés sont d'une part réparés, fonctionnels, conformes aux exigences professionnelles et que la prestation a été clôturée avec succès.";
  const wrappedDecl = doc.splitTextToSize(declaration, 172);
  doc.text(wrappedDecl, 19, currentY + 4.5);

  // 8. DOUBLE SIGNATURES
  currentY += 24;
  
  // Left Block
  doc.rect(15, currentY, 86, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("L'INFORMATICIEN INTERVENANT", 18, currentY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("CNIPLC Service de Maintenance", 18, currentY + 8);
  doc.line(15, currentY + 16, 101, currentY + 16);
  doc.text(`Date : ${new Date().toLocaleDateString('fr-FR')}`, 17, currentY + 20);
  doc.text("Signature", 99, currentY + 20, { align: "right" });

  // Right Block
  doc.rect(109, currentY, 86, 22);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("LE BÉNÉFICIAIRE / DIRECTEUR", 112, currentY + 4.5);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(intervention.clientName, 112, currentY + 8);
  doc.line(109, currentY + 16, 195, currentY + 16);
  doc.text("Date : ___ / ___ / ______", 111, currentY + 20);
  doc.text("Prestation Validée", 193, currentY + 20, { align: "right" });

  // Clean save action
  const pdfFileName = `CNIPLC_Fiche_${intervention.refNumber.replace(/\s+/g, "_")}.pdf`;
  doc.save(pdfFileName);
}
