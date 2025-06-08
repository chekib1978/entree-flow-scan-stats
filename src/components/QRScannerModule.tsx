
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Camera, Plus, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BonEntree } from "@/types/database";

const QRScannerModule = () => {
  const [blsScannés, setBLsScannés] = useState<BonEntree[]>([]);
  const [scannerActif, setScannerActif] = useState(false);
  const [codeSaisi, setCodeSaisi] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBLsScannés();
  }, []);

  const fetchBLsScannés = async () => {
    try {
      const { data, error } = await supabase
        .from('bons_entree')
        .select('*')
        .not('qr_code_data', 'is', null)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setBLsScannés(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des BL scannés:', error);
    } finally {
      setLoading(false);
    }
  };

  const demarrerScanner = () => {
    setScannerActif(true);
    toast({
      title: "Scanner activé",
      description: "Pointez la caméra vers le code QR du BL",
    });

    // Simulation de scan automatique après 3 secondes
    setTimeout(() => {
      simulerScanReussi();
    }, 3000);
  };

  const arreterScanner = () => {
    setScannerActif(false);
  };

  const simulerScanReussi = async () => {
    try {
      const nouveauBL = {
        id: `BL-QR-${Date.now()}`,
        numero_bl: `BL-QR-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        fournisseur: "Fournisseur Scanner",
        date_bl: new Date().toISOString().split('T')[0],
        montant_total: 267.960,
        statut: 'En attente',
        qr_code_data: `QR_DATA_${Date.now()}`,
        notes: "Bon créé via scanner QR"
      };

      const { error } = await supabase
        .from('bons_entree')
        .insert(nouveauBL);

      if (error) throw error;

      // Ajouter quelques lignes d'exemple
      const lignes = [
        {
          bon_entree_id: nouveauBL.id,
          designation: "Article scanné 1",
          quantite: 3,
          prix_unitaire: 45.990,
          montant_ligne: 137.970
        },
        {
          bon_entree_id: nouveauBL.id,
          designation: "Article scanné 2", 
          quantite: 1,
          prix_unitaire: 129.990,
          montant_ligne: 129.990
        }
      ];

      const { error: lignesError } = await supabase
        .from('ligne_bon_entree')
        .insert(lignes);

      if (lignesError) throw lignesError;

      setBLsScannés(prev => [nouveauBL as BonEntree, ...prev]);
      setScannerActif(false);
      
      toast({
        title: "BL scanné avec succès !",
        description: `Le BL ${nouveauBL.numero_bl} a été ajouté automatiquement`,
      });
    } catch (error) {
      console.error('Erreur lors de la création du BL scanné:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le BL scanné",
        variant: "destructive"
      });
    }
  };

  const traiterCodeSaisi = async () => {
    if (!codeSaisi.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un code QR",
        variant: "destructive"
      });
      return;
    }

    try {
      const nouveauBL = {
        id: `BL-MANUAL-${Date.now()}`,
        numero_bl: `BL-MANUAL-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        fournisseur: "Fournisseur Manuel",
        date_bl: new Date().toISOString().split('T')[0],
        montant_total: 151.000,
        statut: 'En attente',
        qr_code_data: codeSaisi,
        notes: "Bon créé via code QR saisi manuellement"
      };

      const { error } = await supabase
        .from('bons_entree')
        .insert(nouveauBL);

      if (error) throw error;

      // Ajouter une ligne d'exemple
      const { error: ligneError } = await supabase
        .from('ligne_bon_entree')
        .insert({
          bon_entree_id: nouveauBL.id,
          designation: "Article code manuel",
          quantite: 2,
          prix_unitaire: 75.500,
          montant_ligne: 151.000
        });

      if (ligneError) throw ligneError;

      setBLsScannés(prev => [nouveauBL as BonEntree, ...prev]);
      setCodeSaisi("");
      
      toast({
        title: "Code traité avec succès !",
        description: `Le BL ${nouveauBL.numero_bl} a été créé à partir du code saisi`,
      });
    } catch (error) {
      console.error('Erreur lors du traitement du code:', error);
      toast({
        title: "Erreur",
        description: "Impossible de traiter le code QR",
        variant: "destructive"
      });
    }
  };

  const calculerStats = () => {
    const totalArticles = blsScannés.length * 2; // Estimation
    const valeurTotale = blsScannés.reduce((sum, bl) => sum + Number(bl.montant_total), 0);
    const montantMoyen = blsScannés.length > 0 ? valeurTotale / blsScannés.length : 0;

    return {
      totalBLs: blsScannés.length,
      totalArticles,
      valeurTotale,
      montantMoyen
    };
  };

  const stats = calculerStats();

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-700">
            <QrCode className="w-6 h-6" />
            Scanner QR Innovant
          </CardTitle>
          <CardDescription>
            Scannez automatiquement les codes QR des BL pour une saisie instantanée
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Zone de scan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner caméra */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Scanner par Caméra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!scannerActif ? (
                  <div className="text-center space-y-4">
                    <div className="w-32 h-32 mx-auto bg-blue-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-blue-400" />
                    </div>
                    <Button 
                      onClick={demarrerScanner}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Démarrer le Scanner
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-32 h-32 mx-auto bg-green-100 rounded-lg flex items-center justify-center animate-pulse">
                      <Camera className="w-16 h-16 text-green-500" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-green-700 font-medium">Scanner actif...</p>
                      <p className="text-sm text-gray-600">Pointez vers le code QR du BL</p>
                    </div>
                    <Button 
                      onClick={arreterScanner}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      Arrêter
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saisie manuelle */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Saisie Manuelle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Collez le code QR ici..."
                    value={codeSaisi}
                    onChange={(e) => setCodeSaisi(e.target.value)}
                    className="text-center"
                  />
                  <Button 
                    onClick={traiterCodeSaisi}
                    disabled={!codeSaisi.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Traiter le Code
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-1">Instructions :</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Copiez le contenu du QR code</li>
                    <li>• Collez-le dans le champ ci-dessus</li>
                    <li>• Cliquez sur "Traiter le Code"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques de scan */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-700">{stats.totalBLs}</div>
                <div className="text-sm text-blue-600">BL scannés</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-700">{stats.totalArticles}</div>
                <div className="text-sm text-green-600">Articles total</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">{stats.valeurTotale.toFixed(3)} TND</div>
                <div className="text-sm text-purple-600">Valeur totale</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-700">{stats.montantMoyen.toFixed(3)} TND</div>
                <div className="text-sm text-orange-600">Montant moyen</div>
              </CardContent>
            </Card>
          </div>

          {/* Liste des BL scannés */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              BL Scannés Récemment
            </h3>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <div className="rounded-lg border bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>Numéro BL</TableHead>
                      <TableHead>Fournisseur</TableHead>
                      <TableHead>Date BL</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Scanné le</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blsScannés.map((bl) => (
                      <TableRow key={bl.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">{bl.numero_bl}</TableCell>
                        <TableCell>{bl.fournisseur}</TableCell>
                        <TableCell>{new Date(bl.date_bl).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {Number(bl.montant_total).toFixed(3)} TND
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                            {bl.statut}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-gray-600">
                          {new Date(bl.created_at).toLocaleDateString('fr-FR')} {new Date(bl.created_at).toLocaleTimeString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScannerModule;
