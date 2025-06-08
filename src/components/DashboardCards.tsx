
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, FileText, TrendingUp, Euro } from "lucide-react";

const DashboardCards = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Articles</CardTitle>
          <Package className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">2,847</div>
          <p className="text-xs text-blue-100">+12% ce mois</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">BL Traités</CardTitle>
          <FileText className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">1,234</div>
          <p className="text-xs text-green-100">+8% ce mois</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">BL Groupés</CardTitle>
          <TrendingUp className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">567</div>
          <p className="text-xs text-purple-100">+23% ce mois</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valeur Totale</CardTitle>
          <Euro className="h-4 w-4" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€45,231</div>
          <p className="text-xs text-orange-100">+15% ce mois</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardCards;
