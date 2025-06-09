
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Save, Trash2, FileText, Check, ChevronsUpDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/database";

interface LigneArticle {
  id: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
}

const CreationBonModule = () => {
  const [bonInfo, setBonInfo] = useState({
    numero_bl: '',
    fournisseur: '',
    date_bl: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  const [lignes, setLignes] = useState<LigneArticle[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [nouvelleLigne, setNouvelleLigne] = useState({
    designation: '',
    quantite: 1,
    prix_unitaire: 0
  });
  
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('designation');

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
    }
  };

  const handleArticleSelect = (article: Article) => {
    setSelectedArticle(article);
    setNouvelleLigne(prev => ({
      ...prev,
      designation: article.designation,
      prix_unitaire: Number(article.prix)
    }));
    setOpenCombobox(false);
  };

  const ajouterLigne = () => {
    if (!nouvelleLigne.designation || nouvelleLigne.prix_unitaire <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs de la ligne",
        variant: "destructive"
      });
      return;
    }

    const montant_ligne = nouvelleLigne.quantite * nouvelleLigne.prix_unitaire;
    const ligne: LigneArticle = {
      id: Date.now().toString(),
      designation: nouvelleLigne.designation,
      quantite: nouvelleLigne.quantite,
      prix_unitaire: nouvelleLigne.prix_unitaire,
      montant_ligne
    };

    setLignes(prev => [...prev, ligne]);
    setNouvelleLigne({
      designation: '',
      quantite: 1,
      prix_unitaire: 0
    });
    setSelectedArticle(null);
  };

  const supprimerLigne = (id: string) => {
    setLignes(prev => prev.filter(ligne => ligne.id !== id));
  };

  const calculerMontantTotal = () => {
    return lignes.reduce((total, ligne) => total + ligne.montant_ligne, 0);
  };

  const sauvegarderBon = async () => {
    if (!bonInfo.numero_bl || !bonInfo.fournisseur || lignes.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir toutes les informations obligatoires et ajouter au moins une ligne",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const montantTotal = calculerMontantTotal();
      
      // Générer un ID unique pour le bon d'entrée
      const bonId = `BE-${Date.now()}`;

      // Insérer le bon d'entrée
      const { error: bonError } = await supabase
        .from('bons_entree')
        .insert({
          id: bonId,
          numero_bl: bonInfo.numero_bl,
          fournisseur: bonInfo.fournisseur,
          date_bl: bonInfo.date_bl,
          montant_total: montantTotal,
          notes: bonInfo.notes,
          statut: 'En attente'
        });

      if (bonError) throw bonError;

      // Insérer les lignes du bon d'entrée
      const lignesData = lignes.map(ligne => ({
        bon_entree_id: bonId,
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
        title: "Bon d'entrée créé",
        description: `Le bon ${bonInfo.numero_bl} a été créé avec succès`,
      });

      // Réinitialiser le formulaire
      setBonInfo({
        numero_bl: '',
        fournisseur: '',
        date_bl: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setLignes([]);

    } catch (error) {
      console.error('Erreur lors de la création du bon:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le bon d'entrée",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-700">
            <FileText className="w-6 h-6" />
            Création d'un Nouveau Bon d'Entrée
          </CardTitle>
          <CardDescription>
            Créez un nouveau bon d'entrée en ajoutant les informations et les articles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numero_bl">Numéro BL *</Label>
              <Input
                id="numero_bl"
                value={bonInfo.numero_bl}
                onChange={(e) => setBonInfo(prev => ({ ...prev, numero_bl: e.target.value }))}
                placeholder="Ex: BL-2024-001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fournisseur">Fournisseur *</Label>
              <Input
                id="fournisseur"
                value={bonInfo.fournisseur}
                onChange={(e) => setBonInfo(prev => ({ ...prev, fournisseur: e.target.value }))}
                placeholder="Nom du fournisseur"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_bl">Date BL *</Label>
              <Input
                id="date_bl"
                type="date"
                value={bonInfo.date_bl}
                onChange={(e) => setBonInfo(prev => ({ ...prev, date_bl: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={bonInfo.notes}
              onChange={(e) => setBonInfo(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notes additionnelles..."
              className="min-h-[80px]"
            />
          </div>

          {/* Ajout d'article */}
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg">Ajouter un Article</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="designation">Désignation</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between"
                      >
                        {selectedArticle
                          ? selectedArticle.designation
                          : nouvelleLigne.designation || "Rechercher un article..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput 
                          placeholder="Rechercher un article..." 
                          value={nouvelleLigne.designation}
                          onValueChange={(value) => setNouvelleLigne(prev => ({ ...prev, designation: value }))}
                        />
                        <CommandEmpty>Aucun article trouvé.</CommandEmpty>
                        <CommandList>
                          <CommandGroup>
                            {articles
                              .filter(article => 
                                article.designation.toLowerCase().includes(nouvelleLigne.designation.toLowerCase())
                              )
                              .map((article) => (
                                <CommandItem
                                  key={article.id}
                                  onSelect={() => handleArticleSelect(article)}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      selectedArticle?.id === article.id ? "opacity-100" : "opacity-0"
                                    }`}
                                  />
                                  <div>
                                    <div className="font-medium">{article.designation}</div>
                                    <div className="text-sm text-gray-500">{Number(article.prix).toFixed(3)} TND</div>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantite">Quantité</Label>
                  <Input
                    id="quantite"
                    type="number"
                    min="1"
                    value={nouvelleLigne.quantite}
                    onChange={(e) => setNouvelleLigne(prev => ({ ...prev, quantite: parseInt(e.target.value) || 1 }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prix_unitaire">Prix Unitaire (TND)</Label>
                  <Input
                    id="prix_unitaire"
                    type="number"
                    step="0.001"
                    min="0"
                    value={nouvelleLigne.prix_unitaire}
                    onChange={(e) => setNouvelleLigne(prev => ({ ...prev, prix_unitaire: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={ajouterLigne} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste des articles */}
          {lignes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Articles du Bon d'Entrée</h3>
              <div className="rounded-lg border bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Désignation</TableHead>
                      <TableHead>Quantité</TableHead>
                      <TableHead>Prix Unitaire</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lignes.map((ligne) => (
                      <TableRow key={ligne.id}>
                        <TableCell className="font-medium">{ligne.designation}</TableCell>
                        <TableCell>{ligne.quantite}</TableCell>
                        <TableCell>{ligne.prix_unitaire.toFixed(3)} TND</TableCell>
                        <TableCell className="font-semibold">{ligne.montant_ligne.toFixed(3)} TND</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                            onClick={() => supprimerLigne(ligne.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-gray-50 font-semibold">
                      <TableCell colSpan={3}>Total</TableCell>
                      <TableCell>{calculerMontantTotal().toFixed(3)} TND</TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Bouton de sauvegarde */}
          <div className="flex justify-end pt-4">
            <Button 
              onClick={sauvegarderBon}
              disabled={saving || lignes.length === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Enregistrement...' : 'Enregistrer le Bon d\'Entrée'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreationBonModule;
