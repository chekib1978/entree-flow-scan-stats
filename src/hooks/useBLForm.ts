
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/database";

interface LigneBL {
  id: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
  article_id?: string;
}

export const useBLForm = () => {
  const [numeroBL, setNumeroBL] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [dateBL, setDateBL] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneBL[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const ajouterLigne = () => {
    const nouvelleLigne: LigneBL = {
      id: Math.random().toString(36).substr(2, 9),
      designation: "",
      quantite: 1,
      prix_unitaire: 0,
      montant_ligne: 0
    };
    setLignes([...lignes, nouvelleLigne]);
  };

  const supprimerLigne = (id: string) => {
    setLignes(lignes.filter(ligne => ligne.id !== id));
  };

  const mettreAJourLigne = (id: string, champ: keyof LigneBL, valeur: any) => {
    setLignes(lignes.map(ligne => {
      if (ligne.id === id) {
        const ligneMiseAJour = { ...ligne, [champ]: valeur };
        // Recalculer le montant si quantité ou prix change
        if (champ === 'quantite' || champ === 'prix_unitaire') {
          ligneMiseAJour.montant_ligne = ligneMiseAJour.quantite * ligneMiseAJour.prix_unitaire;
        }
        return ligneMiseAJour;
      }
      return ligne;
    }));
  };

  const handleArticleSelect = (article: Article, lineId: string) => {
    mettreAJourLigne(lineId, 'designation', article.designation);
    mettreAJourLigne(lineId, 'prix_unitaire', Number(article.prix));
    mettreAJourLigne(lineId, 'article_id', article.id);
    
    // Recalculer le montant avec la nouvelle quantité
    const ligne = lignes.find(l => l.id === lineId);
    if (ligne) {
      const montant = ligne.quantite * Number(article.prix);
      mettreAJourLigne(lineId, 'montant_ligne', montant);
    }
  };

  const handleArticleValueChange = (value: string, lineId: string) => {
    // Si l'utilisateur tape manuellement, mettre à jour seulement la désignation
    if (value !== lignes.find(l => l.id === lineId)?.designation) {
      mettreAJourLigne(lineId, 'designation', value);
      // Réinitialiser l'article_id si l'utilisateur modifie manuellement
      mettreAJourLigne(lineId, 'article_id', undefined);
    }
  };

  const calculerMontantTotal = () => {
    return lignes.reduce((total, ligne) => total + ligne.montant_ligne, 0);
  };

  const validerFormulaire = () => {
    if (!numeroBL.trim()) {
      toast({
        title: "Erreur",
        description: "Le numéro de BL est requis",
        variant: "destructive"
      });
      return false;
    }

    if (!fournisseur.trim()) {
      toast({
        title: "Erreur",
        description: "Le fournisseur est requis",
        variant: "destructive"
      });
      return false;
    }

    if (!dateBL) {
      toast({
        title: "Erreur",
        description: "La date de BL est requise",
        variant: "destructive"
      });
      return false;
    }

    const lignesValides = lignes.filter(ligne => ligne.designation.trim() && ligne.quantite > 0);
    if (lignesValides.length === 0) {
      toast({
        title: "Erreur",
        description: "Au moins une ligne d'article est requise",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const sauvegarderBL = async () => {
    if (!validerFormulaire()) return;

    setLoading(true);
    try {
      const montantTotal = calculerMontantTotal();
      const lignesValides = lignes.filter(ligne => ligne.designation.trim() && ligne.quantite > 0);

      // Générer un ID pour le bon d'entrée
      const bonId = `BL-${Date.now()}`;

      // Insérer le bon d'entrée
      const { error: bonError } = await supabase
        .from('bons_entree')
        .insert({
          id: bonId,
          numero_bl: numeroBL,
          fournisseur: fournisseur,
          date_bl: dateBL,
          montant_total: montantTotal,
          notes: notes || null,
          statut: 'En attente'
        });

      if (bonError) throw bonError;

      // Insérer les lignes
      const lignesData = lignesValides.map(ligne => ({
        bon_entree_id: bonId,
        article_id: ligne.article_id || null,
        designation: ligne.designation,
        quantite: ligne.quantite,
        prix_unitaire: ligne.prix_unitaire,
        montant_ligne: ligne.montant_ligne
      }));

      const { error: lignesError } = await supabase
        .from('ligne_bon_entree')
        .insert(lignesData);

      if (lignesError) throw lignesError;

      toast({
        title: "BL créé",
        description: `Le bon de livraison ${numeroBL} a été créé avec succès`,
      });

      // Réinitialiser le formulaire
      setNumeroBL("");
      setFournisseur("");
      setDateBL("");
      setNotes("");
      setLignes([]);
      ajouterLigne();

    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le bon de livraison",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    // State
    numeroBL,
    setNumeroBL,
    fournisseur,
    setFournisseur,
    dateBL,
    setDateBL,
    notes,
    setNotes,
    lignes,
    loading,
    // Actions
    ajouterLigne,
    supprimerLigne,
    mettreAJourLigne,
    handleArticleSelect,
    handleArticleValueChange,
    calculerMontantTotal,
    sauvegarderBL
  };
};
