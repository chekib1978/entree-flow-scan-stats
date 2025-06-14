
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
        
        // Détecter et ignorer les lignes d'en-tête
        let startIndex = 0;
        
        // Vérifier si la première ligne contient des mots-clés d'en-tête
        if (jsonData.length > 0) {
          const firstRow = jsonData[0] as any[];
          const isHeaderRow = firstRow.some(cell => {
            const cellStr = cell?.toString().toLowerCase().trim() || '';
            return ['designation', 'désignation', 'prix', 'price', 'code', 'description'].includes(cellStr);
          });
          
          if (isHeaderRow) {
            startIndex = 1; // Ignorer la première ligne
            console.log('Ligne d\'en-tête détectée et ignorée');
          }
        }
        
        // Parser chaque ligne à partir de startIndex
        for (let index = startIndex; index < jsonData.length; index++) {
          const row = jsonData[index] as any[];
          
          // Ignorer les lignes complètement vides
          if (!row || row.filter((cell: any) => cell !== null && cell !== undefined && cell.toString().trim() !== "").length < 2) {
            continue;
          }
          
          const designation = row[0]?.toString().trim();
          const prixStr = row[1]?.toString().trim();
          
          if (!designation) {
            if (prixStr) {
              errors.push(`Ligne ${index + 1}: Désignation manquante.`);
            }
            continue;
          }
          
          if (!prixStr) {
            errors.push(`Ligne ${index + 1} (Désignation: ${designation}): Prix manquant.`);
            continue;
          }
          
          // Convertir le prix en nombre
          const prix = parseFloat(prixStr.replace(',', '.'));
          if (isNaN(prix) || prix < 0) {
            errors.push(`Ligne ${index + 1} (Désignation: ${designation}): Prix invalide ('${prixStr}').`);
            continue;
          }
          
          articles.push({
            designation,
            prix,
            code_article: row[2]?.toString().trim() || null,
            description: row[3]?.toString().trim() || null
          });
        }
        
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
