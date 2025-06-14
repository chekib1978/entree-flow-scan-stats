import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Upload, Plus, Search, Edit, Trash2, FileCheck, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/database";
import { parseExcelFile } from "@/utils/excelParser";

const ArticlesModule = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger les articles depuis la base de données.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExcelImport = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setImporting(true);
      toast({
        title: "Import en cours",
        description: `Traitement du fichier ${file.name}...`,
      });

      try {
        const { articles: parsedArticles, errors: parseErrors } = await parseExcelFile(file);
        
        if (parseErrors.length > 0) {
          const errorMessages = parseErrors.join("\n");
          console.error("Erreurs de parsing Excel:", errorMessages);
          toast({
            title: `Erreurs de formatage (${parseErrors.length})`,
            description: (
              <div className="max-h-40 overflow-y-auto">
                <p>Certaines lignes n'ont pas pu être lues :</p>
                <pre className="whitespace-pre-wrap text-xs">{errorMessages}</pre>
                <p className="mt-2">Veuillez vérifier le format du fichier Excel.</p>
              </div>
            ),
            variant: "destructive",
            duration: 10000, // Longue durée pour lire les erreurs
          });
          setImporting(false);
          return;
        }

        if (parsedArticles.length === 0) {
          toast({
            title: "Aucun article trouvé",
            description: "Aucun article valide n'a été trouvé dans le fichier Excel.",
            variant: "warning" // Changé en warning car ce n'est pas une erreur fatale
          });
          setImporting(false);
          return;
        }

        // Insérer les articles en base
        const { data: insertedData, error: insertError } = await supabase
          .from('articles')
          .insert(parsedArticles)
          .select();

        if (insertError) throw insertError;

        toast({
          title: "Importation Réussie",
          description: `${insertedData?.length || 0} article(s) importé(s) avec succès.`,
          variant: "success"
        });

        // Recharger la liste
        await fetchArticles();

      } catch (err) {
        const error = err as Error & { details?: string, hint?: string, code?: string };
        console.error("Erreur détaillée lors de l'importation:", error);

        let description = "Une erreur est survenue lors de l'importation.";
        if (error.message) {
          description = error.message;
        } else if (typeof err === 'string') {
          description = err;
        }
        
        // Si le message d'erreur est trop technique, on peut le simplifier
        if (error.code) { // Les erreurs Supabase ont souvent un code
            description = `Erreur de base de données (code: ${error.code}): ${error.message}.`;
            if (error.details) description += ` Détails: ${error.details}`;
        } else if (error.message && (error.message.includes("Excel") || error.message.includes("fichier"))) {
            description = `Problème avec le fichier Excel: ${error.message}`;
        }


        toast({
          title: "Échec de l'Importation",
          description: description,
          variant: "destructive",
          duration: 8000,
        });
      } finally {
        setImporting(false);
      }
    };
    input.click();
  };

  const deleteArticle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setArticles(prev => prev.filter(article => article.id !== id));
      toast({
        title: "Article supprimé",
        description: "L'article a été supprimé avec succès",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'article",
        variant: "destructive"
      });
    }
  };

  const deleteAllArticles = async () => {
    setDeletingAll(true);
    try {
      // Utilisation de la fonction RPC 'truncate_articles'
      const { error } = await supabase.rpc('truncate_articles');

      if (error) throw error;

      setArticles([]); // Vide la liste des articles localement
      toast({
        title: "Suppression Réussie",
        description: "Tous les articles ont été supprimés avec succès.",
        variant: "success",
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de tous les articles:', error);
      toast({
        title: "Erreur de Suppression",
        description: (error as Error).message || "Impossible de supprimer tous les articles.",
        variant: "destructive"
      });
    } finally {
      setDeletingAll(false);
    }
  };

  const filteredArticles = articles.filter(article =>
    article.designation.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (article.code_article && article.code_article.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
            <Package className="w-6 h-6" />
            Gestion des Articles
          </CardTitle>
          <CardDescription>
            Gérez votre base d'articles et importez depuis Excel. Formats supportés: .xlsx, .xls.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <Button 
              onClick={handleExcelImport}
              disabled={importing}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
            >
              {importing ? (
                <FileCheck className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {importing ? 'Import en cours...' : 'Importer Articles Excel'}
            </Button>
            <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Article (Manuel)
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-red-200 hover:bg-red-50 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={articles.length === 0 || deletingAll}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deletingAll ? 'Suppression...' : 'Supprimer Tout'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer la suppression totale</AlertDialogTitle>
                  <AlertDialogDescription>
                    Êtes-vous sûr de vouloir supprimer tous les articles ({articles.length}) ? Cette action est irréversible.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={deleteAllArticles}
                    disabled={deletingAll}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deletingAll ? 'Suppression en cours...' : 'Confirmer la Suppression'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex-1 min-w-[200px] sm:min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="search"
                  placeholder="Rechercher (Désignation, Code)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full" 
                />
              </div>
            </div>
          </div>

          {/* Instructions d'import */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm">
            <h4 className="font-semibold text-blue-800 mb-2">Format d'import Excel :</h4>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Colonne A : <strong>Désignation</strong> (nom de l'article) - <span className="italic">Obligatoire</span></li>
              <li>Colonne B : <strong>Prix</strong> (prix unitaire TND, ex: 1250.50 ou 1250,50) - <span className="italic">Obligatoire</span></li>
              <li>Colonne C : <strong>Code Article</strong> (ex: ART001) - <span className="italic">Optionnel</span></li>
              <li>Colonne D : <strong>Description</strong> (texte libre) - <span className="italic">Optionnel</span></li>
            </ul>
            <p className="mt-2 text-xs text-blue-600">La première ligne du fichier peut être un en-tête (elle sera ignorée si elle ne correspond pas à des données d'article valides).</p>
          </div>

          {/* Table des articles */}
          <div className="rounded-lg border bg-white shadow-sm overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 hover:bg-gray-100">
                  <TableHead className="w-[40%]">Désignation</TableHead>
                  <TableHead className="w-[15%]">Code</TableHead>
                  <TableHead className="w-[15%] text-right">Prix (TND)</TableHead>
                  <TableHead className="w-[15%]">Ajouté le</TableHead>
                  <TableHead className="w-[15%] text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-gray-500 py-10">
                      {searchTerm ? "Aucun article ne correspond à votre recherche." : "Aucun article dans la base. Importez un fichier Excel ou ajoutez des articles manuellement."}
                    </TableCell>
                  </TableRow>
                )}
                {filteredArticles.map((article) => (
                  <TableRow key={article.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium">{article.designation}</TableCell>
                    <TableCell>
                      <Badge variant={article.code_article ? "outline" : "secondary"} className={article.code_article ? "text-gray-600 border-gray-300" : "text-gray-500 bg-gray-100"}>
                        {article.code_article || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="bg-green-100 text-green-800 font-mono">
                        {Number(article.prix).toFixed(3)}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(article.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric'})}</TableCell>
                    <TableCell className="text-center">
                      <div className="flex gap-2 justify-center">
                        <Button size="icon" variant="outline" className="h-8 w-8">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="icon" 
                              variant="outline" 
                              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                              <AlertDialogDescription>
                                Êtes-vous sûr de vouloir supprimer l'article "{article.designation}" ?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => deleteArticle(article.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Statistiques */}
          {articles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t mt-6">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 shadow">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-700">{articles.length}</div>
                <div className="text-sm text-blue-600">Total articles</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 shadow">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-700">
                  {articles.reduce((sum, article) => sum + Number(article.prix), 0).toFixed(3)} TND
                </div>
                <div className="text-sm text-green-600">Valeur totale du stock</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200 shadow">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-700">
                  {articles.length > 0 ? (articles.reduce((sum, article) => sum + Number(article.prix), 0) / articles.length).toFixed(3) : '0.000'} TND
                </div>
                <div className="text-sm text-purple-600">Prix moyen par article</div>
              </CardContent>
            </Card>
          </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticlesModule;
