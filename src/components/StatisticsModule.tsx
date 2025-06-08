
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Download, TrendingUp, Package, Euro, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StatistiqueArticle {
  designation: string;
  quantiteTotale: number;
  montantTotal: number;
  nombreBL: number;
  prixMoyen: number;
}

const StatisticsModule = () => {
  const [statistiques] = useState<StatistiqueArticle[]>([
    { designation: "Ordinateur portable", quantiteTotale: 45, montantTotal: 40495.55, nombreBL: 12, prixMoyen: 899.90 },
    { designation: "Souris sans fil", quantiteTotale: 123, montantTotal: 3687.77, nombreBL: 8, prixMoyen: 29.99 },
    { designation: "Clavier mécanique", quantiteTotale: 67, montantTotal: 6029.33, nombreBL: 15, prixMoyen: 89.99 },
    { designation: "Écran 24 pouces", quantiteTotale: 23, montantTotal: 6899.77, nombreBL: 6, prixMoyen: 299.99 },
    { designation: "Casque audio", quantiteTotale: 89, montantTotal: 7121.11, nombreBL: 11, prixMoyen: 79.99 },
  ]);

  const { toast } = useToast();

  const exporterExcel = () => {
    toast({
      title: "Export en cours",
      description: "Le fichier Excel des statistiques est en cours de génération...",
    });

    // Simulation d'export
    setTimeout(() => {
      toast({
        title: "Export terminé",
        description: "Les statistiques ont été exportées avec succès !",
      });
    }, 2000);
  };

  const dataChart = statistiques.map(stat => ({
    name: stat.designation.length > 15 ? stat.designation.substring(0, 15) + '...' : stat.designation,
    quantite: stat.quantiteTotale,
    montant: stat.montantTotal
  }));

  const dataPie = statistiques.slice(0, 5).map(stat => ({
    name: stat.designation,
    value: stat.montantTotal
  }));

  const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  const totaux = {
    articlesUniques: statistiques.length,
    quantiteTotale: statistiques.reduce((sum, stat) => sum + stat.quantiteTotale, 0),
    montantTotal: statistiques.reduce((sum, stat) => sum + stat.montantTotal, 0),
    blTotal: statistiques.reduce((sum, stat) => sum + stat.nombreBL, 0)
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl text-blue-700">
                <BarChart3 className="w-6 h-6" />
                Statistiques et Analytics
              </CardTitle>
              <CardDescription>
                Analysez les quantités et montants des articles dans vos BL groupés
              </CardDescription>
            </div>
            <Button 
              onClick={exporterExcel}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Exporter Excel
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Résumé général */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <Package className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{totaux.articlesUniques}</div>
                <div className="text-sm text-blue-100">Articles uniques</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <TrendingUp className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{totaux.quantiteTotale}</div>
                <div className="text-sm text-green-100">Quantité totale</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <Euro className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">€{totaux.montantTotal.toFixed(2)}</div>
                <div className="text-sm text-purple-100">Montant total</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0">
              <CardContent className="p-4 text-center">
                <FileText className="w-8 h-8 mx-auto mb-2" />
                <div className="text-2xl font-bold">{totaux.blTotal}</div>
                <div className="text-sm text-orange-100">BL traités</div>
              </CardContent>
            </Card>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique en barres - Quantités */}
            <Card className="bg-white border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quantités par Article</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={dataChart}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="quantite" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Graphique camembert - Répartition des montants */}
            <Card className="bg-white border shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Répartition des Montants</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={dataPie}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {dataPie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Montant']} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Tableau détaillé */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Détail par Article
            </h3>
            <div className="rounded-lg border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>Désignation</TableHead>
                    <TableHead>Quantité Totale</TableHead>
                    <TableHead>Montant Total</TableHead>
                    <TableHead>Nombre de BL</TableHead>
                    <TableHead>Prix Moyen</TableHead>
                    <TableHead>Performance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statistiques.map((stat, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{stat.designation}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {stat.quantiteTotale} unités
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          €{stat.montantTotal.toFixed(2)}
                        </Badge>
                      </TableCell>
                      <TableCell>{stat.nombreBL} BL</TableCell>
                      <TableCell>€{stat.prixMoyen.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full"
                            style={{ 
                              width: `${(stat.montantTotal / Math.max(...statistiques.map(s => s.montantTotal))) * 100}%` 
                            }}
                          ></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Insights et recommandations */}
          <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
            <CardHeader>
              <CardTitle className="text-lg text-indigo-800">📊 Insights Automatiques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <h5 className="font-semibold text-indigo-700 mb-1">Article le plus rentable</h5>
                  <p className="text-sm text-gray-600">
                    {statistiques.reduce((max, stat) => stat.montantTotal > max.montantTotal ? stat : max).designation}
                    <span className="text-green-600 font-medium"> (€{statistiques.reduce((max, stat) => stat.montantTotal > max.montantTotal ? stat : max).montantTotal.toFixed(2)})</span>
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <h5 className="font-semibold text-indigo-700 mb-1">Article le plus commandé</h5>
                  <p className="text-sm text-gray-600">
                    {statistiques.reduce((max, stat) => stat.quantiteTotale > max.quantiteTotale ? stat : max).designation}
                    <span className="text-blue-600 font-medium"> ({statistiques.reduce((max, stat) => stat.quantiteTotale > max.quantiteTotale ? stat : max).quantiteTotale} unités)</span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatisticsModule;
