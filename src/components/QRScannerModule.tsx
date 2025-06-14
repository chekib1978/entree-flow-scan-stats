import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Camera, Plus, FileText, CheckCircle, X, Lightbulb, Focus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BonEntree } from "@/types/database";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

const QRScannerModule = () => {
  const [blsScannés, setBLsScannés] = useState<BonEntree[]>([]);
  const [scannerActif, setScannerActif] = useState(false);
  const [codeSaisi, setCodeSaisi] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanError, setScanError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchBLsScannés();
    initializeCodeReader();
    
    return () => {
      arreterScanner();
    };
  }, []);

  const initializeCodeReader = () => {
    try {
      const hints = new Map();
      // Optimisé pour QR codes sur papier
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
      // Améliorer la détection sur papier
      hints.set(DecodeHintType.PURE_BARCODE, false);
      
      codeReader.current = new BrowserMultiFormatReader(hints);
      console.log('Scanner QR initialisé pour lecture papier');
    } catch (error) {
      console.error('Erreur initialisation scanner:', error);
      codeReader.current = new BrowserMultiFormatReader();
    }
  };

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

  const waitForVideoElement = async (maxAttempts = 15): Promise<HTMLVideoElement> => {
    for (let i = 0; i < maxAttempts; i++) {
      if (videoRef.current) {
        return videoRef.current;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    throw new Error("Élément vidéo non accessible");
  };

  const demarrerScanner = async () => {
    if (scanningRef.current) {
      console.log('Scanner déjà en cours...');
      return;
    }

    setScanError("");
    setScannerActif(true);
    scanningRef.current = true;
    
    try {
      console.log('Démarrage scanner pour lecture papier...');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      const videoElement = await waitForVideoElement();
      
      // Optimisé pour la lecture de QR codes sur papier
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Caméra arrière si disponible
          width: { ideal: 1920, min: 1280 }, // Résolution plus élevée
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 } // Frame rate plus élevé
        }
      });

      streamRef.current = stream;
      videoElement.srcObject = stream;
      
      await new Promise((resolve, reject) => {
        const onLoadedData = () => {
          videoElement.removeEventListener('loadeddata', onLoadedData);
          videoElement.removeEventListener('error', onError);
          resolve(true);
        };
        
        const onError = (error: Event) => {
          videoElement.removeEventListener('loadeddata', onLoadedData);
          videoElement.removeEventListener('error', onError);
          reject(new Error("Erreur chargement vidéo"));
        };
        
        videoElement.addEventListener('loadeddata', onLoadedData);
        videoElement.addEventListener('error', onError);
        videoElement.play().catch(reject);
      });

      // Attendre stabilisation vidéo
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (!scanningRef.current) return;

      console.log('Démarrage détection QR pour papier...');
      
      // Scanner optimisé pour papier
      if (codeReader.current) {
        codeReader.current.decodeFromVideoDevice(
          undefined,
          videoElement,
          (result, error) => {
            if (result && scanningRef.current) {
              console.log('QR Code détecté sur papier:', result.getText());
              scanningRef.current = false;
              creerBLDepuisQR(result.getText());
              return;
            }
            
            // Log seulement les erreurs importantes
            if (error && !error.name.includes('NotFoundException')) {
              console.warn('Erreur scan papier:', error.name);
            }
          }
        );
      }
      
      toast({
        title: "Scanner activé pour papier",
        description: "Positionnez le document bien éclairé et stable",
      });

    } catch (error: any) {
      console.error('Erreur scanner papier:', error);
      
      let messageErreur = "Impossible d'accéder à la caméra";
      if (error.name === 'NotAllowedError') {
        messageErreur = "Accès caméra refusé. Autorisez l'accès dans votre navigateur.";
      } else if (error.name === 'NotFoundError') {
        messageErreur = "Aucune caméra trouvée.";
      } else if (error.name === 'NotReadableError') {
        messageErreur = "Caméra utilisée par une autre application.";
      }
      
      setScanError(messageErreur);
      toast({
        title: "Erreur caméra",
        description: messageErreur,
        variant: "destructive"
      });
      
      arreterScanner();
    }
  };

  const arreterScanner = () => {
    console.log('Arrêt du scanner...');
    scanningRef.current = false;
    setScannerActif(false);
    setScanError("");
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const traiterDonnéesQR = (donnéesQR: string) => {
    try {
      // Parser les données du QR code - format attendu: JSON
      const donnéesBL = JSON.parse(donnéesQR);
      
      // Validation des données requises
      if (!donnéesBL.numero_bl || !donnéesBL.fournisseur || !donnéesBL.date_bl) {
        throw new Error("Données QR incomplètes - numéro BL, fournisseur et date requis");
      }

      return {
        numero_bl: donnéesBL.numero_bl,
        fournisseur: donnéesBL.fournisseur,
        date_bl: donnéesBL.date_bl,
        montant_total: Number(donnéesBL.montant_total) || 0,
        notes: donnéesBL.notes || "BL créé via scanner QR",
        lignes: donnéesBL.lignes || []
      };
    } catch (error) {
      console.error('Erreur parsing QR:', error);
      throw new Error("Format de code QR non reconnu");
    }
  };

  const creerBLDepuisQR = async (donnéesQR: string) => {
    try {
      const donnéesBL = traiterDonnéesQR(donnéesQR);
      
      // Vérifier si le BL existe déjà
      const { data: blExistant } = await supabase
        .from('bons_entree')
        .select('id')
        .eq('numero_bl', donnéesBL.numero_bl)
        .single();

      if (blExistant) {
        toast({
          title: "BL déjà existant",
          description: `Le BL ${donnéesBL.numero_bl} existe déjà dans le système`,
          variant: "destructive"
        });
        return;
      }

      // Générer un ID unique pour le BL
      const bonId = `BL-QR-${Date.now()}`;

      // Créer le bon d'entrée
      const { error: bonError } = await supabase
        .from('bons_entree')
        .insert({
          id: bonId,
          numero_bl: donnéesBL.numero_bl,
          fournisseur: donnéesBL.fournisseur,
          date_bl: donnéesBL.date_bl,
          montant_total: donnéesBL.montant_total,
          notes: donnéesBL.notes,
          statut: 'En attente',
          qr_code_data: donnéesQR
        });

      if (bonError) throw bonError;

      // Créer les lignes si elles existent
      if (donnéesBL.lignes && donnéesBL.lignes.length > 0) {
        const lignesData = donnéesBL.lignes.map((ligne: any) => ({
          bon_entree_id: bonId,
          designation: ligne.designation,
          quantite: Number(ligne.quantite) || 1,
          prix_unitaire: Number(ligne.prix_unitaire) || 0,
          montant_ligne: Number(ligne.montant_ligne) || (Number(ligne.quantite) * Number(ligne.prix_unitaire)),
          article_id: ligne.article_id || null
        }));

        const { error: lignesError } = await supabase
          .from('ligne_bon_entree')
          .insert(lignesData);

        if (lignesError) throw lignesError;
      }

      // Actualiser la liste
      await fetchBLsScannés();
      
      toast({
        title: "BL créé avec succès !",
        description: `Le BL ${donnéesBL.numero_bl} a été ajouté automatiquement`,
      });

      // Arrêter le scanner
      arreterScanner();

    } catch (error) {
      console.error('Erreur création BL:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible de créer le BL depuis le QR code",
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

    await creerBLDepuisQR(codeSaisi);
    setCodeSaisi("");
  };

  // Simuler la détection QR pour la démo
  const simulerDetectionQR = () => {
    const exempleQR = JSON.stringify({
      numero_bl: `BL-${Date.now().toString().slice(-6)}`,
      fournisseur: "Fournisseur Scanné",
      date_bl: new Date().toISOString().split('T')[0],
      montant_total: 245.750,
      notes: "BL créé automatiquement via scanner QR",
      lignes: [
        {
          designation: "Article scanné A",
          quantite: 2,
          prix_unitaire: 75.500,
          montant_ligne: 151.000
        },
        {
          designation: "Article scanné B",
          quantite: 1,
          prix_unitaire: 94.750,
          montant_ligne: 94.750
        }
      ]
    });

    creerBLDepuisQR(exempleQR);
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
            Scanner QR Code - Lecture sur Papier
          </CardTitle>
          <CardDescription>
            Scanner optimisé pour lire les QR codes imprimés sur les feuilles BL
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Conseils pour la lecture sur papier */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-800">Conseils pour scanner sur papier :</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• Assurez-vous que l'éclairage est suffisant</li>
                    <li>• Tenez le document stable sans bouger</li>
                    <li>• Gardez une distance de 15-25 cm</li>
                    <li>• Évitez les reflets sur le papier</li>
                    <li>• Le QR code doit être bien visible et net</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zone de scan */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Scanner caméra */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Scanner Caméra (Papier)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!scannerActif ? (
                  <div className="text-center space-y-4">
                    <div className="w-64 h-48 mx-auto bg-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                      <div className="text-center">
                        <QrCode className="w-16 h-16 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-blue-600">Lecture QR sur papier</p>
                      </div>
                    </div>
                    {scanError && (
                      <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
                        <p className="font-medium">Erreur:</p>
                        <p>{scanError}</p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <Button 
                        onClick={demarrerScanner}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Démarrer Scanner Papier
                      </Button>
                      <Button 
                        onClick={simulerDetectionQR}
                        variant="outline"
                        className="w-full"
                      >
                        Tester avec données d'exemple
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="relative w-64 h-48 mx-auto bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover'
                        }}
                        autoPlay
                        muted
                        playsInline
                      />
                      {/* Zone de ciblage optimisée pour papier */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-52 h-40 border-3 border-green-400 rounded-lg bg-transparent relative">
                          {/* Coins de visée */}
                          <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                          <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                          <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                          <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                          
                          {/* Instructions dans le cadre */}
                          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <Focus className="w-6 h-6 text-green-400 mx-auto mb-1" />
                            <p className="text-xs text-green-400 font-medium">Centrez le QR</p>
                          </div>
                        </div>
                      </div>
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-3 py-1 rounded text-xs font-medium">
                        📄 Mode Papier Actif
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-green-700 font-medium">Scanner actif pour papier</p>
                      <p className="text-sm text-gray-600">Placez le QR code dans le cadre vert</p>
                      <p className="text-xs text-gray-500">Maintenez stable et bien éclairé</p>
                    </div>
                    <Button 
                      onClick={arreterScanner}
                      variant="outline"
                      className="border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Arrêter Scanner
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
                  Saisie Manuelle du QR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Collez les données du code QR (format JSON)..."
                    value={codeSaisi}
                    onChange={(e) => setCodeSaisi(e.target.value)}
                    className="text-sm"
                  />
                  <Button 
                    onClick={traiterCodeSaisi}
                    disabled={!codeSaisi.trim()}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer BL depuis QR
                  </Button>
                </div>
                <div className="text-sm text-gray-600">
                  <p className="font-medium mb-2">Format QR attendu (JSON):</p>
                  <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
{`{
  "numero_bl": "BL-001",
  "fournisseur": "Nom",
  "date_bl": "2024-01-01",
  "montant_total": 100.500,
  "lignes": [...]
}`}
                  </pre>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistiques */}
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
              BL Créés par Scanner QR
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
                      <TableHead>Créé le</TableHead>
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
                    {blsScannés.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Aucun BL scanné pour le moment. Utilisez le scanner pour créer votre premier BL automatiquement.
                        </TableCell>
                      </TableRow>
                    )}
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
