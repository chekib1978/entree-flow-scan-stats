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
import { BrowserMultiFormatReader } from '@zxing/library';

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
    // Initialiser le lecteur de code
    codeReader.current = new BrowserMultiFormatReader();
    
    return () => {
      // Nettoyer lors du démontage
      arreterScanner();
    };
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

  const demarrerScanner = async () => {
    setScanError("");
    
    try {
      console.log('Vérification des permissions caméra...');
      
      // Vérifier d'abord si l'élément vidéo est disponible
      if (!videoRef.current) {
        console.log('Élément vidéo non trouvé, attente...');
        // Attendre un peu que l'élément soit rendu
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (!videoRef.current) {
          throw new Error("Impossible d'accéder à l'élément vidéo. Veuillez réessayer.");
        }
      }
      
      console.log('Élément vidéo trouvé, vérification des permissions...');
      
      // Demander l'accès à la caméra avec des contraintes simples
      console.log('Demande d\'accès à la caméra...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640, min: 320 },
          height: { ideal: 480, min: 240 }
        }
      });

      console.log('Accès caméra obtenu, configuration du stream...');
      streamRef.current = stream;

      // S'assurer que l'élément vidéo est toujours disponible
      if (!videoRef.current) {
        throw new Error("Élément vidéo perdu pendant l'initialisation");
      }

      // Configurer le flux vidéo
      videoRef.current.srcObject = stream;
      
      // Attendre que la vidéo soit prête
      await new Promise((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error("Élément vidéo non disponible"));
          return;
        }
        
        const video = videoRef.current;
        
        const onLoadedData = () => {
          console.log('Vidéo chargée et prête');
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
          resolve(true);
        };
        
        const onError = (error: Event) => {
          console.error('Erreur chargement vidéo:', error);
          video.removeEventListener('loadeddata', onLoadedData);
          video.removeEventListener('error', onError);
          reject(new Error("Erreur lors du chargement de la vidéo"));
        };
        
        video.addEventListener('loadeddata', onLoadedData);
        video.addEventListener('error', onError);
        
        // Démarrer la lecture
        video.play().catch(reject);
      });

      console.log('Stream vidéo démarré, initialisation du scanner...');

      // Initialiser le scanner QR
      if (!codeReader.current) {
        codeReader.current = new BrowserMultiFormatReader();
      }

      // Vérifier une dernière fois que l'élément vidéo est disponible
      if (!videoRef.current) {
        throw new Error("Élément vidéo perdu avant le démarrage du scanner");
      }

      // Démarrer la détection QR en continu
      codeReader.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            console.log('QR Code détecté:', result.getText());
            creerBLDepuisQR(result.getText());
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Erreur de détection QR:', error);
          }
        }
      );
      
      setScannerActif(true);
      
      toast({
        title: "Scanner activé",
        description: "Caméra démarrée - Pointez vers le code QR",
      });

    } catch (error: any) {
      console.error('Erreur détaillée accès caméra:', error);
      
      let messageErreur = "Impossible d'accéder à la caméra";
      
      if (error.name === 'NotAllowedError') {
        messageErreur = "Accès à la caméra refusé. Veuillez autoriser l'accès à la caméra et réessayer.";
      } else if (error.name === 'NotFoundError') {
        messageErreur = "Aucune caméra trouvée sur cet appareil.";
      } else if (error.name === 'NotReadableError') {
        messageErreur = "Caméra en cours d'utilisation par une autre application.";
      } else if (error.message) {
        messageErreur = error.message;
      }
      
      setScanError(messageErreur);
      toast({
        title: "Erreur caméra",
        description: messageErreur,
        variant: "destructive"
      });
      
      // Nettoyer en cas d'erreur
      arreterScanner();
    }
  };

  const arreterScanner = () => {
    console.log('Arrêt du scanner...');
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
            Scanner QR Avancé
          </CardTitle>
          <CardDescription>
            Scannez les codes QR des BL pour une création automatique avec données réelles
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
                        Démarrer le Scanner
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
                      {/* Overlay pour le cadre de scan */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-36 border-2 border-green-400 rounded-lg bg-transparent">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-400 rounded-tl-lg"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-400 rounded-tr-lg"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-400 rounded-bl-lg"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-400 rounded-br-lg"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <p className="text-green-700 font-medium">Scanner actif - Caméra en marche</p>
                      <p className="text-sm text-gray-600">Pointez vers le code QR du BL</p>
                      <p className="text-xs text-gray-500">
                        Format attendu: JSON avec numero_bl, fournisseur, date_bl
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
