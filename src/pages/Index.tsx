import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, FileText, QrCode, BarChart3, Plus } from "lucide-react";
import ArticlesModule from "@/components/ArticlesModule";
import GroupageModule from "@/components/GroupageModule";
import QRScannerModule from "@/components/QRScannerModule";
import StatisticsModule from "@/components/StatisticsModule";
import CreationBonModule from "@/components/CreationBonModule";
import DashboardCards from "@/components/DashboardCards";
import GestionBLModule from "@/components/GestionBLModule";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Gestion des Bons d'Entrée
          </h1>
          <p className="text-muted-foreground text-lg">
            Application moderne de gestion et suivi des bons d'entrée
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-white/50 backdrop-blur-sm border shadow-sm">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Tableau de Bord
            </TabsTrigger>
            <TabsTrigger value="creation" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nouveau BL
            </TabsTrigger>
            <TabsTrigger value="gestion" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Gestion BL
            </TabsTrigger>
            <TabsTrigger value="articles" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Articles
            </TabsTrigger>
            <TabsTrigger value="groupage" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Groupage BL
            </TabsTrigger>
            <TabsTrigger value="scanner" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              Scanner QR
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          {/* Dashboard */}
          <TabsContent value="dashboard" className="space-y-6">
            <DashboardCards />
          </TabsContent>

          {/* Creation Module */}
          <TabsContent value="creation">
            <CreationBonModule />
          </TabsContent>

          {/* Gestion Module */}
          <TabsContent value="gestion">
            <GestionBLModule />
          </TabsContent>

          {/* Articles Module */}
          <TabsContent value="articles">
            <ArticlesModule />
          </TabsContent>

          {/* Groupage Module */}
          <TabsContent value="groupage">
            <GroupageModule />
          </TabsContent>

          {/* QR Scanner Module */}
          <TabsContent value="scanner">
            <QRScannerModule />
          </TabsContent>

          {/* Statistics Module */}
          <TabsContent value="statistics">
            <StatisticsModule />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
