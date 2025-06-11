
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/database";
import ArticleAutocomplete from "./ArticleAutocomplete";

interface LigneBL {
  id: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
  article_id?: string;
}

const CreationBonModule = () => {
  const [numeroBL, setNumeroBL] = useState("");
  const [fournisseur, setFournisseur] = useState("");
  const [dateBL, setDateBL] = useState("");
  const [notes, setNotes] = useState("");
  const [lignes, setLignes] = useState<LigneBL[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    ajouterLigne();
  }, []);

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

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-700">
            <Package className="w-6 h-6" />
            Création d'un Nouveau Bon de Livraison
          </CardTitle>
          <CardDescription>
            Saisissez les informations du bon de livraison et ajoutez les articles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroBL">Numéro BL *</Label>
              <Input
                id="numeroBL"
                value={numeroBL}
                onChange={(e) => setNumeroBL(e.target.value)}
                placeholder="Ex: BL-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fournisseur">Fournisseur *</Label>
              <Input
                id="fournisseur"
                value={fournisseur}
                onChange={(e) => setFournisseur(e.target.value)}
                placeholder="Nom du fournisseur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateBL">Date BL *</Label>
              <Input
                id="dateBL"
                type="date"
                value={dateBL}
                onChange={(e) => setDateBL(e.target.value)}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes additionnelles..."
              rows={3}
            />
          </div>

          {/* Articles */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Articles</h3>
              <Button onClick={ajouterLigne} size="sm" className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Article
              </Button>
            </div>

            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[40%]">Désignation</TableHead>
                    <TableHead className="w-[15%]">Quantité</TableHead>
                    <TableHead className="w-[20%]">Prix Unitaire</TableHead>
                    <TableHead className="w-[20%]">Montant</TableHead>
                    <TableHead className="w-[5%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((ligne) => (
                    <TableRow key={ligne.id}>
                      <TableCell>
                        <ArticleAutocomplete
                          value={ligne.designation}
                          onSelect={(article) => handleArticleSelect(article, ligne.id)}
                          onValueChange={(value) => mettreAJourLigne(ligne.id, 'designation', value)}
                          placeholder="Rechercher un article..."
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={ligne.quantite}
                          onChange={(e) => mettreAJourLigne(ligne.id, 'quantite', parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          value={ligne.prix_unitaire}
                          onChange={(e) => mettreAJourLigne(ligne.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {ligne.montant_ligne.toFixed(3)} TND
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => supprimerLigne(ligne.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Total et actions */}
          <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
            <div className="text-lg font-semibold">
              Montant Total: <span className="text-blue-700">{calculerMontantTotal().toFixed(3)} TND</span>
            </div>
            <Button 
              onClick={sauvegarderBL}
              disabled={loading}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Sauvegarde..." : "Sauvegarder BL"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreationBonModule;
