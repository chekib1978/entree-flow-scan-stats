
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
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Prendre la première feuille
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        const articles: Omit<Article, 'id' | 'created_at' | 'updated_at'>[] = [];
        const errors: string[] = [];
        
        // Parser chaque ligne (ignorer la première si c'est un en-tête)
        jsonData.forEach((row: any, index: number) => {
          // Ignorer les lignes vides
          if (!row || row.length < 2) return;
          
          const designation = row[0]?.toString().trim();
          const prixStr = row[1]?.toString().trim();
          
          if (!designation) {
            errors.push(`Ligne ${index + 1}: Désignation manquante`);
            return;
          }
          
          if (!prixStr) {
            errors.push(`Ligne ${index + 1}: Prix manquant`);
            return;
          }
          
          // Convertir le prix en nombre
          const prix = parseFloat(prixStr.replace(',', '.'));
          if (isNaN(prix) || prix < 0) {
            errors.push(`Ligne ${index + 1}: Prix invalide (${prixStr})`);
            return;
          }
          
          articles.push({
            designation,
            prix,
            code_article: null,
            description: null
          });
        });
        
        resolve({ articles, errors });
      } catch (error) {
        reject(new Error('Erreur lors de la lecture du fichier Excel'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };
    
    reader.readAsArrayBuffer(file);
  });
};
