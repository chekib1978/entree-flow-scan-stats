
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus, Merge, Download, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BL {
  id: string;
  numero: string;
  fournisseur: string;
  date: string;
  articles: number;
  montant: number;
  statut: 'En attente' | 'Groupé' | 'Traité';
}

interface GroupeBL {
  id: string;
  nom: string;
  bls: BL[];
  dateCreation: string;
  montantTotal: number;
}

const GroupageModule = () => {
  const [bls, setBls] = useState<BL[]>([
    { id: "1", numero: "BL-2024-001", fournisseur: "Fournisseur A", date: "2024-01-15", articles: 5, montant: 1250.00, statut: 'En attente' },
    { id: "2", numero: "BL-2024-002", fournisseur: "Fournisseur B", date: "2024-01-16", articles: 3, montant: 890.50, statut: 'En attente' },
    { id: "3", numero: "BL-2024-003", fournisseur: "Fournisseur A", date: "2024-01-17", articles: 7, montant: 2100.75, statut: 'En attente' },
  ]);

  const [groupes, setGroupes] = useState<GroupeBL[]>([
    {
      id: "1",
      nom: "Groupe Janvier 2024",
      bls: [
        { id: "4", numero: "BL-2024-004", fournisseur: "Fournisseur C", date: "2024-01-10", articles: 4, montant: 750.00, statut: 'Groupé' }
      ],
      dateCreation: "2024-01-20",
      montantTotal: 750.00
    }
  ]);

  const [selectedBls, setSelectedBls] = useState<string[]>([]);
  const [nomGroupe, setNomGroupe] = useState("");
  const { toast } = useToast();

  const toggleSelectBl = (blId: string) => {
    setSelectedBls(prev =>
      prev.includes(blId)
        ? prev.filter(id => id !== blId)
        : [...prev, blId]
    );
  };

  const creerGroupe = () => {
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

    const blsSelectionnees = bls.filter(bl => selectedBls.includes(bl.id));
    const montantTotal = blsSelectionnees.reduce((sum, bl) => sum + bl.montant, 0);

    const nouveauGroupe: GroupeBL = {
      id: Date.now().toString(),
      nom: nomGroupe,
      bls: blsSelectionnees.map(bl => ({ ...bl, statut: 'Groupé' as const })),
      dateCreation: new Date().toISOString().split('T')[0],
      montantTotal
    };

    setGroupes(prev => [...prev, nouveauGroupe]);
    setBls(prev => prev.filter(bl => !selectedBls.includes(bl.id)));
    setSelectedBls([]);
    setNomGroupe("");

    toast({
      title: "Groupe créé",
      description: `Le groupe "${nomGroupe}" a été créé avec ${blsSelectionnees.length} BL(s)`,
    });
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'En attente': return 'bg-yellow-100 text-yellow-800';
      case 'Groupé': return 'bg-blue-100 text-blue-800';
      case 'Traité': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              BL en attente de groupage
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
                            setSelectedBls(bls.map(bl => bl.id));
                          } else {
                            setSelectedBls([]);
                          }
                        }}
                        checked={selectedBls.length === bls.length && bls.length > 0}
                      />
                    </TableHead>
                    <TableHead>Numéro BL</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bls.map((bl) => (
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
                      <TableCell className="font-medium">{bl.numero}</TableCell>
                      <TableCell>{bl.fournisseur}</TableCell>
                      <TableCell>{bl.date}</TableCell>
                      <TableCell>{bl.articles}</TableCell>
                      <TableCell>€{bl.montant.toFixed(2)}</TableCell>
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
              Groupes existants
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
                          Créé le {groupe.dateCreation}
                        </CardDescription>
                      </div>
                      <Button size="sm" variant="outline" className="border-green-300 text-green-700 hover:bg-green-200">
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-700">{groupe.bls.length}</div>
                        <div className="text-sm text-green-600">BL groupés</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-700">
                          {groupe.bls.reduce((sum, bl) => sum + bl.articles, 0)}
                        </div>
                        <div className="text-sm text-green-600">Articles total</div>
                      </div>
                      <div className="text-center p-3 bg-white rounded-lg">
                        <div className="text-2xl font-bold text-green-700">€{groupe.montantTotal.toFixed(2)}</div>
                        <div className="text-sm text-green-600">Montant total</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h5 className="font-medium text-green-800">BL inclus :</h5>
                      <div className="flex flex-wrap gap-2">
                        {groupe.bls.map((bl) => (
                          <Badge key={bl.id} variant="secondary" className="bg-white text-green-700">
                            {bl.numero} - €{bl.montant.toFixed(2)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupageModule;
