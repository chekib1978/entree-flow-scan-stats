import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Camera, Plus, FileText, CheckCircle, X, Lightbulb, Focus, Usb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { BonEntree } from "@/types/database";
import { BrowserMultiFormatReader, DecodeHintType, BarcodeFormat } from '@zxing/library';

const QRScannerModule = () => {
  const [blsScannés, setBLsScannés] = useState<BonEntree[]>([]);
  const [scannerActif, setScannerActif] = useState(false);
  const [usbScannerActif, setUsbScannerActif] = useState(false);
  const [codeSaisi, setCodeSaisi] = useState("");
  const [loading, setLoading] = useState(true);
  const [scanError, setScanError] = useState<string>("");
  const [usbBuffer, setUsbBuffer] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const codeReader = useRef<BrowserMultiFormatReader | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef<boolean>(false);
  const usbTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchBLsScannés();
    initializeCodeReader();
    
    return () => {
      arreterScanner();
      arreterUSBScanner();
    };
  }, []);

  // Gestionnaire pour le scanner USB
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!usbScannerActif) return;

      // La plupart des scanners USB envoient Enter à la fin
      if (event.key === 'Enter') {
        if (usbBuffer.trim()) {
          console.log('Code USB reçu:', usbBuffer);
          creerBLDepuisQR(usbBuffer.trim());
          setUsbBuffer("");
        }
        return;
      }

      // Ignorer les touches de contrôle
      if (event.key.length > 1) return;

      // Ajouter le caractère au buffer
      setUsbBuffer(prev => prev + event.key);

      // Reset du timeout - si pas d'activité pendant 100ms, on considère que c'est fini
      if (usbTimeoutRef.current) {
        clearTimeout(usbTimeoutRef.current);
      }
      
      usbTimeoutRef.current = setTimeout(() => {
        if (usbBuffer.trim()) {
          console.log('Code USB reçu (timeout):', usbBuffer);
          creerBLDepuisQR(usbBuffer.trim());
          setUsbBuffer("");
        }
      }, 100);
    };

    if (usbScannerActif) {
      document.addEventListener('keydown', handleKeyPress);
      return () => {
        document.removeEventListener('keydown', handleKeyPress);
        if (usbTimeoutRef.current) {
          clearTimeout(usbTimeoutRef.current);
        }
      };
    }
  }, [usbScannerActif, usbBuffer]);

  const initializeCodeReader = () => {
    try {
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
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

  const demarrerUSBScanner = () => {
    if (scannerActif) {
      toast({
        title: "Scanner caméra actif",
        description: "Arrêtez d'abord le scanner caméra avant d'activer le scanner USB",
        variant: "destructive"
      });
      return;
    }

    setUsbScannerActif(true);
    setUsbBuffer("");
    setScanError("");
    
    toast({
      title: "Scanner USB activé",
      description: "Scannez un QR code avec votre lecteur USB",
    });
  };

  const arreterUSBScanner = () => {
    setUsbScannerActif(false);
    setUsbBuffer("");
    if (usbTimeoutRef.current) {
      clearTimeout(usbTimeoutRef.current);
    }
  };

  const demarrerScanner = async () => {
    if (usbScannerActif) {
      toast({
        title: "Scanner USB actif",
        description: "Arrêtez d'abord le scanner USB avant d'activer la caméra",
        variant: "destructive"
      });
      return;
    }

    if (scanningRef.current) {
      console.log('Scanner déjà en cours...');
      return;
    }

    setScanError("");
    setScannerActif(true);
    scanningRef.current = true;
    
    try {
      console.log('Démarrage scanner caméra...');
      
      await new Promise(resolve => setTimeout(resolve, 300));
      const videoElement = await waitForVideoElement();
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, min: 15 }
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

      await new Promise(resolve => setTimeout(resolve, 1500));

      if (!scanningRef.current) return;

      console.log('Démarrage détection QR caméra...');
      
      if (codeReader.current) {
        codeReader.current.decodeFromVideoDevice(
          undefined,
          videoElement,
          (result, error) => {
            if (result && scanningRef.current) {
              console.log('QR Code détecté caméra:', result.getText());
              scanningRef.current = false;
              creerBLDepuisQR(result.getText());
              return;
            }
            
            if (error && !error.name.includes('NotFoundException')) {
              console.warn('Erreur scan caméra:', error.name);
            }
          }
        );
      }
      
      toast({
        title: "Scanner caméra activé",
        description: "Positionnez le QR code devant la caméra",
      });

    } catch (error: any) {
      console.error('Erreur scanner caméra:', error);
      
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
    console.log('Arrêt du scanner caméra...');
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
      const donnéesBL = JSON.parse(donnéesQR);
      
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

      const bonId = `BL-QR-${Date.now()}`;

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

      await fetchBLsScannés();
      
      toast({
        title: "BL créé avec succès !",
        description: `Le BL ${donnéesBL.numero_bl} a été ajouté automatiquement`,
      });

      // Arrêter tous les scanners
      arreterScanner();
      arreterUSBScanner();

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
    const totalArticles = blsScannés.length * 2;
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
            Scanner QR Code - Caméra & Lecteur USB
          </CardTitle>
          <CardDescription>
            Utilisez la caméra de votre laptop ou un lecteur de code-barres USB pour scanner les QR codes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Conseils pour la lecture */}
          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-800">Recommandations :</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    <li>• <strong>Lecteur USB recommandé</strong> : Plus rapide et précis</li>
                    <li>• Caméra laptop : Éclairage suffisant requis</li>
                    <li>• Maintenir une distance de 15-25 cm avec la caméra</li>
                    <li>• Éviter les reflets sur le papier</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zone de scan */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Scanner USB */}
            <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Usb className="w-5 h-5" />
                  Scanner USB (Recommandé)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!usbScannerActif ? (
                  <div className="text-center space-y-4">
                    <div className="w-full h-32 bg-green-100 rounded-lg flex items-center justify-center border-2 border-dashed border-green-300">
                      <div className="text-center">
                        <Usb className="w-12 h-12 text-green-400 mx-auto mb-2" />
                        <p className="text-sm text-green-600">Lecteur USB prêt</p>
                      </div>
                    </div>
                    <Button 
                      onClick={demarrerUSBScanner}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                    >
                      <Usb className="w-4 h-4 mr-2" />
                      Activer Scanner USB
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-full h-32 bg-green-200 rounded-lg flex items-center justify-center border-2 border-green-400">
                      <div className="text-center">
                        <div className="w-6 h-6 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
                        <p className="text-sm text-green-700 font-medium">Scanner USB Actif</p>
                        {usbBuffer && (
                          <p className="text-xs text-green-600 mt-1">
                            Lecture: {usbBuffer.substring(0, 20)}...
                          </p>
                        )}
                      </div>
                    </div>
                    <p className="text-green-700 font-medium">En attente du scan USB</p>
                    <p className="text-sm text-gray-600">Scannez un QR code avec votre lecteur</p>
                    <Button 
                      onClick={arreterUSBScanner}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Arrêter Scanner USB
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Scanner caméra */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Scanner Caméra
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!scannerActif ? (
                  <div className="text-center space-y-4">
                    <div className="w-full h-32 bg-blue-100 rounded-lg flex items-center justify-center border-2 border-dashed border-blue-300">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                        <p className="text-sm text-blue-600">Caméra laptop</p>
                      </div>
                    </div>
                    {scanError && (
                      <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
                        <p className="font-medium">Erreur:</p>
                        <p>{scanError}</p>
                      </div>
                    )}
                    <Button 
                      onClick={demarrerScanner}
                      className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      Démarrer Caméra
                    </Button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="relative w-full h-32 bg-black rounded-lg overflow-hidden">
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
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-20 h-20 border-2 border-green-400 rounded-lg">
                          <Focus className="w-4 h-4 text-green-400 mx-auto mt-6" />
                        </div>
                      </div>
                    </div>
                    <p className="text-green-700 font-medium">Caméra active</p>
                    <Button 
                      onClick={arreterScanner}
                      variant="outline"
                      className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Arrêter Caméra
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Saisie manuelle */}
            <Card className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Saisie Manuelle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Input
                    placeholder="Collez les données du QR..."
                    value={codeSaisi}
                    onChange={(e) => setCodeSaisi(e.target.value)}
                    className="text-sm"
                  />
                  <Button 
                    onClick={traiterCodeSaisi}
                    disabled={!codeSaisi.trim()}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer BL
                  </Button>
                  <Button 
                    onClick={simulerDetectionQR}
                    variant="outline"
                    className="w-full text-xs"
                  >
                    Test avec exemple
                  </Button>
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
