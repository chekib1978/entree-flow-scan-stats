
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Merge, Download, Calendar, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BonEntree, GroupeBL } from "@/types/database";
import GroupeDetailsModal from "./GroupeDetailsModal";

const GroupageModule = () => {
  const [bons, setBons] = useState<BonEntree[]>([]);
  const [groupes, setGroupes] = useState<GroupeBL[]>([]);
  const [selectedBls, setSelectedBls] = useState<string[]>([]);
  const [nomGroupe, setNomGroupe] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedGroupe, setSelectedGroupe] = useState<GroupeBL | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Charger les bons d'entrée non groupés
      const { data: bonsData, error: bonsError } = await supabase
        .from('bons_entree')
        .select('*')
        .eq('statut', 'En attente')
        .order('created_at', { ascending: false });

      if (bonsError) throw bonsError;

      // Charger les groupes existants
      const { data: groupesData, error: groupesError } = await supabase
        .from('groupes_bl')
        .select('*')
        .order('created_at', { ascending: false });

      if (groupesError) throw groupesError;

      setBons(bonsData || []);
      setGroupes(groupesData || []);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectBl = (blId: string) => {
    setSelectedBls(prev =>
      prev.includes(blId)
        ? prev.filter(id => id !== blId)
        : [...prev, blId]
    );
  };

  const creerGroupe = async () => {
    if (selectedBls.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un BL",
        variant: "destructive"
      });
      return;
    }

    if (!nomGroupe.trim()) {
      toast({
        title: "Erreur", 
        description: "Veuillez saisir un nom pour le groupe",
        variant: "destructive"
      });
      return;
    }

    try {
      const blsSelectionnees = bons.filter(bl => selectedBls.includes(bl.id));
      const montantTotal = blsSelectionnees.reduce((sum, bl) => sum + Number(bl.montant_total), 0);

      // Créer le groupe
      const { data: groupeData, error: groupeError } = await supabase
        .from('groupes_bl')
        .insert({
          nom: nomGroupe,
          montant_total: montantTotal,
          nombre_bl: blsSelectionnees.length
        })
        .select()
        .single();

      if (groupeError) throw groupeError;

      // Créer les liaisons
      const liaisons = selectedBls.map(blId => ({
        groupe_id: groupeData.id,
        bon_entree_id: blId
      }));

      const { error: liaisonsError } = await supabase
        .from('liaison_groupe_bl')
        .insert(liaisons);

      if (liaisonsError) throw liaisonsError;

      // Mettre à jour le statut des BL
      const { error: updateError } = await supabase
        .from('bons_entree')
        .update({ statut: 'Groupé' })
        .in('id', selectedBls);

      if (updateError) throw updateError;

      toast({
        title: "Groupe créé",
        description: `Le groupe "${nomGroupe}" a été créé avec ${blsSelectionnees.length} BL(s)`,
      });

      // Recharger les données
      fetchData();
      setSelectedBls([]);
      setNomGroupe("");

    } catch (error) {
      console.error('Erreur lors de la création du groupe:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le groupe",
        variant: "destructive"
      });
    }
  };

  const ouvrirDetailsGroupe = (groupe: GroupeBL) => {
    setSelectedGroupe(groupe);
    setDetailsModalOpen(true);
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'En attente': return 'bg-yellow-100 text-yellow-800';
      case 'Groupé': return 'bg-blue-100 text-blue-800';
      case 'Traité': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <Merge className="w-6 h-6" />
            Groupage des Bons de Livraison
          </CardTitle>
          <CardDescription>
            Regroupez plusieurs BL en un seul groupe pour faciliter la gestion
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Actions de groupage */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-3">Créer un nouveau groupe</h4>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Nom du groupe..."
                value={nomGroupe}
                onChange={(e) => setNomGroupe(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={creerGroupe}
                disabled={selectedBls.length === 0 || !nomGroupe.trim()}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              >
                <Merge className="w-4 h-4 mr-2" />
                Créer Groupe ({selectedBls.length})
              </Button>
            </div>
          </div>

          {/* BL en attente */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              BL en attente de groupage ({bons.length})
            </h3>
            <div className="rounded-lg border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedBls(bons.map(bl => bl.id));
                          } else {
                            setSelectedBls([]);
                          }
                        }}
                        checked={selectedBls.length === bons.length && bons.length > 0}
                      />
                    </TableHead>
                    <TableHead>Numéro BL</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bons.map((bl) => (
                    <TableRow 
                      key={bl.id} 
                      className={`hover:bg-gray-50 ${selectedBls.includes(bl.id) ? 'bg-blue-50' : ''}`}
                    >
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedBls.includes(bl.id)}
                          onChange={() => toggleSelectBl(bl.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{bl.numero_bl}</TableCell>
                      <TableCell>{bl.fournisseur}</TableCell>
                      <TableCell>{new Date(bl.date_bl).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>{Number(bl.montant_total).toFixed(3)} TND</TableCell>
                      <TableCell>
                        <Badge className={getStatutColor(bl.statut)}>
                          {bl.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Groupes existants */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Merge className="w-5 h-5" />
              Groupes existants ({groupes.length})
            </h3>
            <div className="grid gap-4">
              {groupes.map((groupe) => (
                <Card key={groupe.id} className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg text-green-800">{groupe.nom}</CardTitle>
                        <CardDescription className="flex items-center gap-1 text-green-600">
                          <Calendar className="w-4 h-4" />
                          Créé le {new Date(groupe.date_creation).toLocaleDateString('fr-FR')}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-blue-300 text-blue-700 hover:bg-blue-200"
                          onClick={() => ouvrirDetailsGroupe(groupe)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          Détails
                        </Button>
                        <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-200">
                          <Download className="w-4 h-4 mr-2" />
                          Exporter
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-700">{groupe.nombre_bl}</div>
                        <div className="text-sm text-green-600">BL groupés</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-700">{Number(groupe.montant_total).toFixed(3)} TND</div>
                        <div className="text-sm text-green-600">Montant total</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal des détails */}
      <GroupeDetailsModal
        groupe={selectedGroupe}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </div>
  );
};

export default GroupageModule;
