import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { QrCode, Camera, Plus, FileText, CheckCircle, X } from "lucide-react";
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
  const { toast } = useToast();

  useEffect(() => {
    fetchBLsScannés();
    // Initialiser le lecteur de code avec des paramètres optimisés pour laptop
    initializeCodeReader();
    
    return () => {
      // Nettoyer lors du démontage
      arreterScanner();
    };
  }, []);

  const initializeCodeReader = () => {
    try {
      // Configuration optimisée pour les caméras laptop
      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
      hints.set(DecodeHintType.TRY_HARDER, true);
      hints.set(DecodeHintType.CHARACTER_SET, 'UTF-8');
      
      codeReader.current = new BrowserMultiFormatReader(hints);
      console.log('Code reader initialisé avec paramètres optimisés pour laptop');
    } catch (error) {
      console.error('Erreur initialisation code reader:', error);
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

  const waitForVideoElement = async (maxAttempts = 20): Promise<HTMLVideoElement> => {
    for (let i = 0; i < maxAttempts; i++) {
      console.log(`Tentative ${i + 1}/${maxAttempts} pour accéder à l'élément vidéo...`);
      
      if (videoRef.current) {
        console.log('Élément vidéo trouvé !');
        return videoRef.current;
      }
      
      // Attendre 100ms avant la prochaine tentative
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    throw new Error("Impossible d'accéder à l'élément vidéo après plusieurs tentatives. L'interface n'est peut-être pas encore prête.");
  };

  const demarrerScanner = async () => {
    setScanError("");
    
    try {
      console.log('Démarrage du scanner optimisé pour laptop...');
      
      // D'abord s'assurer que l'état permet d'afficher l'élément vidéo
      setScannerActif(true);
      
      // Attendre un peu que React mette à jour l'interface
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Maintenant attendre que l'élément vidéo soit disponible
      const videoElement = await waitForVideoElement();
      
      console.log('Élément vidéo prêt, demande d\'accès à la caméra laptop...');
      
      // Configuration optimisée pour caméras laptop
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user', // Caméra frontale pour laptop
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          // Paramètres additionnels pour améliorer la qualité
          focusMode: 'auto',
          exposureMode: 'auto',
          whiteBalanceMode: 'auto'
        }
      });

      console.log('Accès caméra laptop obtenu, configuration du stream...');
      streamRef.current = stream;

      // Vérifier que l'élément vidéo est toujours là
      if (!videoRef.current) {
        throw new Error("Élément vidéo perdu pendant l'initialisation");
      }

      // Configurer le flux vidéo
      videoElement.srcObject = stream;
      
      // Attendre que la vidéo soit prête et stable
      await new Promise((resolve, reject) => {
        const video = videoElement;
        
        const onLoadedData = () => {
          console.log('Vidéo laptop chargée et prête');
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
          resolve(true);
        };
        
        const onError = (error: Event) => {
          console.error('Erreur chargement vidéo laptop:', error);
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
          reject(new Error("Erreur lors du chargement de la vidéo"));
        };
        
        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('error', onError);
        
        // Démarrer la lecture
        video.play().catch(reject);
      });

      // Attendre que la vidéo soit vraiment stable avant de scanner
      await new Promise(resolve => setTimeout(resolve, 1000));

      console.log('Stream vidéo laptop démarré, initialisation du scanner optimisé...');

      // Réinitialiser le scanner avec des paramètres optimisés
      if (!codeReader.current) {
        initializeCodeReader();
      }

      // Configuration de scan optimisée pour laptop avec plus de tentatives
      let scanAttempts = 0;
      const maxScanAttempts = 10;
      
      const startScanning = () => {
        console.log(`Démarrage scan QR (tentative ${scanAttempts + 1}/${maxScanAttempts})`);
        
        codeReader.current?.decodeFromVideoDevice(
          undefined,
          videoElement,
          (result, error) => {
            if (result) {
              console.log('QR Code détecté avec succès:', result.getText());
              creerBLDepuisQR(result.getText());
              return;
            }
            
            // Ne logguer les erreurs que si c'est pas une NotFoundException normale
            if (error && error.name !== 'NotFoundException' && error.name !== 'NotFoundException2') {
              console.error('Erreur de détection QR non-standard:', error);
            }
            
            // Si on a trop d'échecs, on peut essayer de redémarrer le scanner
            scanAttempts++;
            if (scanAttempts >= maxScanAttempts) {
              console.log('Redémarrage du scanner après plusieurs tentatives...');
              scanAttempts = 0;
              // Petit délai avant de redémarrer
              setTimeout(() => {
                if (scannerActif && codeReader.current) {
                  codeReader.current.reset();
                  setTimeout(startScanning, 500);
                }
              }, 2000);
            }
          }
        );
      };

      startScanning();
      
      toast({
        title: "Scanner laptop activé",
        description: "Caméra laptop démarrée - Présentez le code QR clairement",
      });

    } catch (error: any) {
      console.error('Erreur détaillée accès caméra laptop:', error);
      
      let messageErreur = "Impossible d'accéder à la caméra laptop";
      
      if (error.name === 'NotAllowedError') {
        messageErreur = "Accès à la caméra refusé. Veuillez autoriser l'accès à la caméra dans votre navigateur et réessayer.";
      } else if (error.name === 'NotFoundError') {
        messageErreur = "Aucune caméra trouvée sur ce laptop.";
      } else if (error.name === 'NotReadableError') {
        messageErreur = "Caméra en cours d'utilisation par une autre application.";
      } else if (error.message) {
        messageErreur = error.message;
      }
      
      setScanError(messageErreur);
      toast({
        title: "Erreur caméra laptop",
        description: messageErreur,
        variant: "destructive"
      });
      
      // Nettoyer en cas d'erreur
      arreterScanner();
    }
  };

  const arreterScanner = () => {
    console.log('Arrêt du scanner laptop...');
    setScannerActif(false);
    setScanError("");
    
    // Arrêter le flux vidéo
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('Track arrêté:', track.kind);
      });
      streamRef.current = null;
    }
    
    // Nettoyer le lecteur QR
    if (codeReader.current) {
      codeReader.current.reset();
    }
    
    // Nettoyer l'élément vidéo
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
            Scanner QR Optimisé Laptop
          </CardTitle>
          <CardDescription>
            Scanner optimisé pour caméras laptop - Maintenez le QR code stable et bien éclairé
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
                  Scanner Caméra Laptop
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!scannerActif ? (
                  <div className="text-center space-y-4">
                    <div className="w-64 h-48 mx-auto bg-blue-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-blue-400" />
                    </div>
                    {scanError && (
                      <div className="text-red-600 text-sm bg-red-50 p-3 rounded border border-red-200">
                        <p className="font-medium">Erreur:</p>
                        <p>{scanError}</p>
                        <p className="text-xs mt-2 text-red-500">
                          Assurez-vous d'autoriser l'accès à la caméra dans votre navigateur
                        </p>
                      </div>
                    )}
                    <div className="space-y-3">
                      <Button 
                        onClick={demarrerScanner}
                        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                      >
                        <Camera className="w-4 h-4 mr-2" />
                        Démarrer Scanner Laptop
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
                    {/* Aperçu de la caméra */}
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
                      {/* Overlay pour le cadre de scan optimisé */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-36 border-2 border-green-400 rounded-lg bg-transparent">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                        </div>
                      </div>
                      {/* Indicateur de scan actif */}
                      <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs">
                        Laptop Scanner Actif
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-green-700 font-medium">Scanner laptop actif - Caméra optimisée</p>
                      <p className="text-sm text-gray-600">Maintenez le QR code stable et bien éclairé</p>
                      <p className="text-xs text-gray-500">
                        Tips: Évitez les reflets, tenez le code à 20-30cm de la caméra
                      </p>
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
