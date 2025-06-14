
import * as XLSX from 'xlsx';
import { Article } from '@/types/database';

export interface ExcelImportResult {
  articles: Omit<Article, 'id' | 'created_at' | 'updated_at'>[];
  errors: string[];
}

export const parseExcelFile = (file: File): Promise<ExcelImportResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const result = e.target?.result;
        if (!(result instanceof ArrayBuffer)) {
          reject(new Error('Erreur de lecture du contenu du fichier. Le format n\'est peut-être pas supporté.'));
          return;
        }
        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Prendre la première feuille
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          reject(new Error('Le fichier Excel est vide ou ne contient pas de feuilles de calcul.'));
          return;
        }
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const articles: Omit<Article, 'id' | 'created_at' | 'updated_at'>[] = [];
        const errors: string[] = [];
        
        // Parser chaque ligne (ignorer la première si c'est un en-tête, ou la traiter si besoin)
        // Si la première ligne est un en-tête, jsonData[0] la contiendra.
        // Nous commençons à partir de l'index 0 si pas d'en-tête ou si l'en-tête est déjà géré/attendu.
        // Si la première ligne doit être ignorée (en-tête), commencer la boucle à index 1:
        // const dataRows = jsonData.slice(1); // ou jsonData.slice(headerRows);
        // Pour l'instant, on assume que toutes les lignes peuvent être des données.
        
        jsonData.forEach((row: any, index: number) => {
          // Ignorer les lignes complètement vides ou avec moins de 2 colonnes pertinentes
          if (!row || row.filter((cell: any) => cell !== null && cell !== undefined && cell.toString().trim() !== "").length < 2) {
            // Si vous souhaitez être strict sur le fait que les deux premières colonnes doivent avoir du contenu:
            // if (!row || !row[0] || !row[1]) return;
            return;
          }
          
          const designation = row[0]?.toString().trim();
          const prixStr = row[1]?.toString().trim();
          
          if (!designation) {
            // Si la ligne a d'autres données mais pas de désignation, c'est une erreur.
            // Si la ligne est globalement vide sauf peut-être pour le prix, on pourrait l'ignorer.
            // Pour l'instant, on considère une désignation manquante comme une erreur si un prix est présent ou vice-versa.
            if (prixStr) { // S'il y a un prix mais pas de désignation
                errors.push(`Ligne ${index + 1}: Désignation manquante.`);
            } // Si ni désignation ni prix, la ligne est probablement vide et déjà filtrée plus haut.
            return; // Ne pas traiter cette ligne plus loin si désignation manque et qu'un prix existe
          }
          
          if (!prixStr) {
            errors.push(`Ligne ${index + 1} (Désignation: ${designation}): Prix manquant.`);
            return;
          }
          
          // Convertir le prix en nombre
          const prix = parseFloat(prixStr.replace(',', '.'));
          if (isNaN(prix) || prix < 0) {
            errors.push(`Ligne ${index + 1} (Désignation: ${designation}): Prix invalide ('${prixStr}').`);
            return;
          }
          
          articles.push({
            designation,
            prix,
            code_article: row[2]?.toString().trim() || null, // Ajout potentiel de la colonne C pour code_article
            description: row[3]?.toString().trim() || null   // Ajout potentiel de la colonne D pour description
          });
        });
        
        resolve({ articles, errors });
      } catch (error) {
        console.error("Erreur détaillée dans parseExcelFile:", error);
        reject(new Error('Erreur interne lors du traitement du fichier Excel.'));
      }
    };
    
    reader.onerror = (error) => {
      console.error("Erreur FileReader:", error);
      reject(new Error('Erreur lors de la tentative de lecture du fichier.'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};
