
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Plus, Search, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Article {
  id: string;
  designation: string;
  prix: number;
  dateAjout: string;
}

const ArticlesModule = () => {
  const [articles, setArticles] = useState<Article[]>([
    { id: "1", designation: "Ordinateur portable Dell", prix: 899.99, dateAjout: "2024-01-15" },
    { id: "2", designation: "Souris sans fil Logitech", prix: 29.99, dateAjout: "2024-01-16" },
    { id: "3", designation: "Clavier mécanique", prix: 89.99, dateAjout: "2024-01-17" },
  ]);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const handleExcelImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx,.xls';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Simulation d'import Excel
        toast({
          title: "Import réussi",
          description: `Le fichier ${file.name} a été importé avec succès.`,
        });
        
        // Ajouter des articles simulés
        const newArticles: Article[] = [
          { id: Date.now().toString(), designation: "Article importé 1", prix: 45.99, dateAjout: new Date().toISOString().split('T')[0] },
          { id: (Date.now() + 1).toString(), designation: "Article importé 2", prix: 67.50, dateAjout: new Date().toISOString().split('T')[0] },
        ];
        setArticles(prev => [...prev, ...newArticles]);
      }
    };
    input.click();
  };

  const filteredArticles = articles.filter(article =>
    article.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-700">
            <Upload className="w-6 h-6" />
            Gestion des Articles
          </CardTitle>
          <CardDescription>
            Gérez votre base d'articles et importez depuis Excel
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              onClick={handleExcelImport}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-md"
            >
              <Upload className="w-4 h-4 mr-2" />
              Importer Excel
            </Button>
            <Button variant="outline" className="border-blue-200 hover:bg-blue-50">
              <Plus className="w-4 h-4 mr-2" />
              Nouvel Article
            </Button>
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher un article..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Instructions d'import */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Format d'import Excel requis :</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Colonne A : <strong>Désignation</strong> (nom de l'article)</p>
              <p>• Colonne B : <strong>Prix</strong> (prix unitaire)</p>
              <p>• Formats acceptés : .xlsx, .xls</p>
            </div>
          </div>

          {/* Table des articles */}
          <div className="rounded-lg border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Désignation</TableHead>
                  <TableHead>Prix</TableHead>
                  <TableHead>Date d'ajout</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((article) => (
                  <TableRow key={article.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">{article.designation}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        €{article.prix.toFixed(2)}
                      </Badge>
                    </TableCell>
                    <TableCell>{article.dateAjout}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0">
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:bg-red-50">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-700">{articles.length}</div>
                <div className="text-sm text-blue-600">Total articles</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-700">
                  €{articles.reduce((sum, article) => sum + article.prix, 0).toFixed(2)}
                </div>
                <div className="text-sm text-green-600">Valeur totale</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-purple-700">
                  €{(articles.reduce((sum, article) => sum + article.prix, 0) / articles.length).toFixed(2)}
                </div>
                <div className="text-sm text-purple-600">Prix moyen</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ArticlesModule;
