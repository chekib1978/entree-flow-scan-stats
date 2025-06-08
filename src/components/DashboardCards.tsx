
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, FileText, TrendingUp, Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalArticles: number;
  totalBons: number;
  totalGroupes: number;
  valeurTotale: number;
}

const DashboardCards = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    totalBons: 0,
    totalGroupes: 0,
    valeurTotale: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Compter les articles
        const { count: articlesCount } = await supabase
          .from('articles')
          .select('*', { count: 'exact', head: true });

        // Compter les bons d'entrée
        const { count: bonsCount } = await supabase
          .from('bons_entree')
          .select('*', { count: 'exact', head: true });

        // Compter les groupes
        const { count: groupesCount } = await supabase
          .from('groupes_bl')
          .select('*', { count: 'exact', head: true });

        // Calculer la valeur totale
        const { data: montants } = await supabase
          .from('bons_entree')
          .select('montant_total');

        const valeurTotale = montants?.reduce((sum, item) => sum + Number(item.montant_total), 0) || 0;

        setStats({
          totalArticles: articlesCount || 0,
          totalBons: bonsCount || 0,
          totalGroupes: groupesCount || 0,
          valeurTotale
        });
      } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gradient-to-br from-slate-100 to-slate-200 border-0 shadow-lg animate-pulse">
            <CardContent className="p-6">
              <div className="h-20 bg-slate-300 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
          <Package className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalArticles.toLocaleString()}</div>
          <p className="text-xs text-blue-100">Articles référencés</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">BL Traités</CardTitle>
          <FileText className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalBons.toLocaleString()}</div>
          <p className="text-xs text-green-100">Bons d'entrée enregistrés</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">BL Groupés</CardTitle>
          <TrendingUp className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalGroupes.toLocaleString()}</div>
          <p className="text-xs text-purple-100">Groupes créés</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
          <Coins className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.valeurTotale.toFixed(3)} TND</div>
          <p className="text-xs text-orange-100">Montant total des BL</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCards;
