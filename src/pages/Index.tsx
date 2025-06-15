
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, FileText, QrCode, BarChart3, Plus, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import ArticlesModule from "@/components/ArticlesModule";
import GroupageModule from "@/components/GroupageModule";
import QRScannerModule from "@/components/QRScannerModule";
import StatisticsModule from "@/components/StatisticsModule";
import CreationBonModule from "@/components/CreationBonModule";
import DashboardCards from "@/components/DashboardCards";
import GestionBLModule from "@/components/GestionBLModule";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabItems = [
    { value: "dashboard", label: "Tableau de Bord", icon: BarChart3 },
    { value: "creation", label: "Nouveau BL", icon: Plus },
    { value: "gestion", label: "Gestion BL", icon: FileText },
    { value: "articles", label: "Articles", icon: Package },
    { value: "groupage", label: "Groupage BL", icon: FileText },
    { value: "scanner", label: "Scanner QR", icon: QrCode },
    { value: "statistics", label: "Statistiques", icon: BarChart3 },
  ];

  const TabButton = ({ item, isActive }: { item: typeof tabItems[0], isActive: boolean }) => (
    <button
      onClick={() => setActiveTab(item.value)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors w-full text-left ${
        isActive 
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      <item.icon className="w-4 h-4" />
      <span className="truncate">{item.label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto p-3 sm:p-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Gestion des Bons d'Entrée
          </h1>
          <p className="text-muted-foreground text-sm sm:text-lg">
            Application moderne de gestion et suivi des bons d'entrée
          </p>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden mb-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="w-full justify-start">
                <Menu className="w-4 h-4 mr-2" />
                Navigation - {tabItems.find(item => item.value === activeTab)?.label}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[400px]">
              <div className="py-4">
                <h2 className="text-lg font-semibold mb-4">Navigation</h2>
                <div className="space-y-2">
                  {tabItems.map((item) => (
                    <TabButton 
                      key={item.value} 
                      item={item} 
                      isActive={activeTab === item.value}
                    />
                  ))}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="hidden lg:grid w-full grid-cols-7 bg-white/50 backdrop-blur-sm border shadow-sm">
            {tabItems.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="flex items-center gap-2">
                <item.icon className="w-4 h-4" />
                <span className="hidden xl:inline">{item.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Tablet Navigation */}
          <div className="hidden md:grid lg:hidden grid-cols-2 gap-2 mb-6">
            {tabItems.map((item) => (
              <TabButton 
                key={item.value} 
                item={item} 
                isActive={activeTab === item.value}
              />
            ))}
          </div>

          {/* Content */}
          <div className="w-full overflow-x-auto">
            {/* Dashboard */}
            <TabsContent value="dashboard" className="space-y-6 mt-0">
              <DashboardCards />
            </TabsContent>

            {/* Creation Module */}
            <TabsContent value="creation" className="mt-0">
              <CreationBonModule />
            </TabsContent>

            {/* Gestion Module */}
            <TabsContent value="gestion" className="mt-0">
              <GestionBLModule />
            </TabsContent>

            {/* Articles Module */}
            <TabsContent value="articles" className="mt-0">
              <ArticlesModule />
            </TabsContent>

            {/* Groupage Module */}
            <TabsContent value="groupage" className="mt-0">
              <GroupageModule />
            </TabsContent>

            {/* QR Scanner Module */}
            <TabsContent value="scanner" className="mt-0">
              <QRScannerModule />
            </TabsContent>

            {/* Statistics Module */}
            <TabsContent value="statistics" className="mt-0">
              <StatisticsModule />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
