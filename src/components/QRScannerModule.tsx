
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Camera, Plus, FileText, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BLScanne {
  id: string;
  numero: string;
  fournisseur: string;
  date: string;
  articles: { designation: string; quantite: number; prix: number }[];
  montantTotal: number;
  dateScann: string;
}

const QRScannerModule = () => {
  const [blsScannés, setBLsScannés] = useState<BLScanne[]>([
    {
      id: "1",
      numero: "BL-QR-001",
      fournisseur: "Tech Solutions",
      date: "2024-01-18",
      articles: [
        { designation: "Ordinateur portable", quantite: 2, prix: 899.99 },
        { designation: "Souris sans fil", quantite: 5, prix: 29.99 }
      ],
      montantTotal: 1949.93,
      dateScann: "2024-01-18 14:30"
    }
  ]);

  const [scannerActif, setScannerActif] = useState(false);
  const [codeSaisi, setCodeSaisi] = useState("");
  const { toast } = useToast();

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

  const simulerScanReussi = () => {
    const nouveauBL: BLScanne = {
      id: Date.now().toString(),
      numero: `BL-QR-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      fournisseur: "Fournisseur Scanner",
      date: new Date().toISOString().split('T')[0],
      articles: [
        { designation: "Article scanné 1", quantite: 3, prix: 45.99 },
        { designation: "Article scanné 2", quantite: 1, prix: 129.99 }
      ],
      montantTotal: 267.96,
      dateScann: new Date().toLocaleString('fr-FR')
    };

    setBLsScannés(prev => [nouveauBL, ...prev]);
    setScannerActif(false);
    
    toast({
      title: "BL scanné avec succès !",
      description: `Le BL ${nouveauBL.numero} a été ajouté automatiquement`,
    });
  };

  const traiterCodeSaisi = () => {
    if (!codeSaisi.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un code QR",
        variant: "destructive"
      });
      return;
    }

    // Simulation de traitement du code saisi
    const nouveauBL: BLScanne = {
      id: Date.now().toString(),
      numero: `BL-MANUAL-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      fournisseur: "Fournisseur Manuel",
      date: new Date().toISOString().split('T')[0],
      articles: [
        { designation: "Article code manuel", quantite: 2, prix: 75.50 }
      ],
      montantTotal: 151.00,
      dateScann: new Date().toLocaleString('fr-FR')
    };

    setBLsScannés(prev => [nouveauBL, ...prev]);
    setCodeSaisi("");
    
    toast({
      title: "Code traité avec succès !",
      description: `Le BL ${nouveauBL.numero} a été créé à partir du code saisi`,
    });
  };

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
                <div className="text-2xl font-bold text-blue-700">{blsScannés.length}</div>
                <div className="text-sm text-blue-600">BL scannés</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-700">
                  {blsScannés.reduce((sum, bl) => sum + bl.articles.length, 0)}
                </div>
                <div className="text-sm text-green-600">Articles total</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-700">
                  €{blsScannés.reduce((sum, bl) => sum + bl.montantTotal, 0).toFixed(2)}
                </div>
                <div className="text-sm text-purple-600">Valeur totale</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-700">
                  {blsScannés.length > 0 ? (blsScannés.reduce((sum, bl) => sum + bl.montantTotal, 0) / blsScannés.length).toFixed(2) : '0.00'}
                </div>
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
            <div className="rounded-lg border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Numéro BL</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Date BL</TableHead>
                    <TableHead>Articles</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Scanné le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blsScannés.map((bl) => (
                    <TableRow key={bl.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{bl.numero}</TableCell>
                      <TableCell>{bl.fournisseur}</TableCell>
                      <TableCell>{bl.date}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {bl.articles.length} articles
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          €{bl.montantTotal.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{bl.dateScann}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QRScannerModule;
