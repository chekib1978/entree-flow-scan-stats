
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, Edit, Trash2, Eye, Search, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BonEntree, LigneBonEntree } from "@/types/database";

const GestionBLModule = () => {
  const [bons, setBons] = useState<BonEntree[]>([]);
  const [filteredBons, setFilteredBons] = useState<BonEntree[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBon, setSelectedBon] = useState<BonEntree | null>(null);
  const [lignes, setLignes] = useState<LigneBonEntree[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBons();
  }, []);

  useEffect(() => {
    filterBons();
  }, [searchTerm, bons]);

  const fetchBons = async () => {
    try {
      const { data, error } = await supabase
        .from('bons_entree')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBons(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des BL:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les bons de livraison",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterBons = () => {
    if (!searchTerm.trim()) {
      setFilteredBons(bons);
    } else {
      const filtered = bons.filter(bon =>
        bon.numero_bl.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bon.fournisseur.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBons(filtered);
    }
  };

  const fetchLignesBon = async (bonId: string) => {
    try {
      const { data, error } = await supabase
        .from('ligne_bon_entree')
        .select('*')
        .eq('bon_entree_id', bonId);

      if (error) throw error;
      setLignes(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des lignes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les détails du BL",
        variant: "destructive"
      });
    }
  };

  const viewBonDetails = async (bon: BonEntree) => {
    setSelectedBon(bon);
    await fetchLignesBon(bon.id);
    setIsDetailOpen(true);
  };

  const deleteBon = async (bonId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce BL ?')) {
      return;
    }

    try {
      // Supprimer d'abord les lignes
      const { error: lignesError } = await supabase
        .from('ligne_bon_entree')
        .delete()
        .eq('bon_entree_id', bonId);

      if (lignesError) throw lignesError;

      // Puis supprimer le bon
      const { error: bonError } = await supabase
        .from('bons_entree')
        .delete()
        .eq('id', bonId);

      if (bonError) throw bonError;

      toast({
        title: "BL supprimé",
        description: "Le bon de livraison a été supprimé avec succès",
      });

      fetchBons();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le BL",
        variant: "destructive"
      });
    }
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'En attente': return 'bg-yellow-100 text-yellow-800';
      case 'Groupé': return 'bg-blue-100 text-blue-800';
      case 'Traité': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRowColor = (statut: string) => {
    switch (statut) {
      case 'Groupé': return 'bg-blue-50 hover:bg-blue-100';
      default: return 'hover:bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-32 bg-gray-200 rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-700">
            <FileText className="w-6 h-6" />
            Gestion des Bons de Livraison
          </CardTitle>
          <CardDescription>
            Visualiser, modifier et supprimer les bons de livraison créés (incluant les BL groupés)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Barre de recherche */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Rechercher par numéro BL ou fournisseur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800">En attente</h4>
              <p className="text-2xl font-bold text-yellow-700">
                {filteredBons.filter(bl => bl.statut === 'En attente').length}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-800">Groupés</h4>
              <p className="text-2xl font-bold text-blue-700">
                {filteredBons.filter(bl => bl.statut === 'Groupé').length}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800">Traités</h4>
              <p className="text-2xl font-bold text-green-700">
                {filteredBons.filter(bl => bl.statut === 'Traité').length}
              </p>
            </div>
          </div>

          {/* Liste des BL */}
          <div className="rounded-lg border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Numéro BL</TableHead>
                  <TableHead>Fournisseur</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBons.map((bon) => (
                  <TableRow key={bon.id} className={getRowColor(bon.statut)}>
                    <TableCell className="font-medium">{bon.numero_bl}</TableCell>
                    <TableCell>{bon.fournisseur}</TableCell>
                    <TableCell>{new Date(bon.date_bl).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell>{Number(bon.montant_total).toFixed(3)} TND</TableCell>
                    <TableCell>
                      <Badge className={getStatutColor(bon.statut)}>
                        {bon.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewBonDetails(bon)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          disabled={bon.statut === 'Groupé'}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteBon(bon.id)}
                          className="text-red-600 hover:text-red-700"
                          disabled={bon.statut === 'Groupé'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredBons.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? "Aucun BL trouvé pour cette recherche" : "Aucun BL créé"}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de détails */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails du BL {selectedBon?.numero_bl}</DialogTitle>
            <DialogDescription>
              Informations complètes du bon de livraison
            </DialogDescription>
          </DialogHeader>
          
          {selectedBon && (
            <div className="space-y-6">
              {/* Informations générales */}
              <div className={`grid grid-cols-2 gap-4 p-4 rounded-lg ${
                selectedBon.statut === 'Groupé' ? 'bg-blue-50 border border-blue-200' : 'bg-gray-50'
              }`}>
                <div>
                  <h4 className="font-semibold">Fournisseur</h4>
                  <p>{selectedBon.fournisseur}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Date BL</h4>
                  <p>{new Date(selectedBon.date_bl).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <h4 className="font-semibold">Statut</h4>
                  <Badge className={getStatutColor(selectedBon.statut)}>
                    {selectedBon.statut}
                  </Badge>
                  {selectedBon.statut === 'Groupé' && (
                    <p className="text-sm text-blue-600 mt-1">Ce BL fait partie d'un groupe</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold">Montant Total</h4>
                  <p className="text-lg font-bold text-green-600">
                    {Number(selectedBon.montant_total).toFixed(3)} TND
                  </p>
                </div>
              </div>

              {/* Notes */}
              {selectedBon.notes && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Notes</h4>
                  <p>{selectedBon.notes}</p>
                </div>
              )}

              {/* Lignes du BL */}
              <div>
                <h4 className="font-semibold mb-4">Articles du BL</h4>
                <div className="rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead>Désignation</TableHead>
                        <TableHead>Quantité</TableHead>
                        <TableHead>Prix Unitaire</TableHead>
                        <TableHead>Montant</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lignes.map((ligne) => (
                        <TableRow key={ligne.id}>
                          <TableCell>{ligne.designation}</TableCell>
                          <TableCell>{ligne.quantite}</TableCell>
                          <TableCell>{Number(ligne.prix_unitaire).toFixed(3)} TND</TableCell>
                          <TableCell>{Number(ligne.montant_ligne).toFixed(3)} TND</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GestionBLModule;
