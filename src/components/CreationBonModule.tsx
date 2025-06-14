
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Package } from "lucide-react";
import { useBLForm } from "@/hooks/useBLForm";
import BLFormHeader from "./bon-livraison/BLFormHeader";
import BLLineItem from "./bon-livraison/BLLineItem";
import BLFormActions from "./bon-livraison/BLFormActions";

const CreationBonModule = () => {
  const {
    numeroBL,
    setNumeroBL,
    fournisseur,
    setFournisseur,
    dateBL,
    setDateBL,
    notes,
    setNotes,
    lignes,
    loading,
    ajouterLigne,
    supprimerLigne,
    mettreAJourLigne,
    handleArticleSelect,
    handleArticleValueChange,
    calculerMontantTotal,
    sauvegarderBL
  } = useBLForm();

  useEffect(() => {
    ajouterLigne();
  }, []);

  return (
    <div className="space-y-6">
      <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-blue-700">
            <Package className="w-6 h-6" />
            Création d'un Nouveau Bon de Livraison
          </CardTitle>
          <CardDescription>
            Saisissez les informations du bon de livraison et ajoutez les articles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <BLFormHeader
            numeroBL={numeroBL}
            setNumeroBL={setNumeroBL}
            fournisseur={fournisseur}
            setFournisseur={setFournisseur}
            dateBL={dateBL}
            setDateBL={setDateBL}
            notes={notes}
            setNotes={setNotes}
          />

          {/* Articles */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Articles</h3>
              <Button onClick={ajouterLigne} size="sm" className="bg-green-500 hover:bg-green-600">
                <Plus className="w-4 h-4 mr-2" />
                Ajouter Article
              </Button>
            </div>

            <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[40%]">Désignation</TableHead>
                    <TableHead className="w-[15%]">Quantité</TableHead>
                    <TableHead className="w-[20%]">Prix Unitaire</TableHead>
                    <TableHead className="w-[20%]">Montant</TableHead>
                    <TableHead className="w-[5%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lignes.map((ligne) => (
                    <BLLineItem
                      key={ligne.id}
                      ligne={ligne}
                      onArticleSelect={handleArticleSelect}
                      onValueChange={handleArticleValueChange}
                      onUpdateLine={mettreAJourLigne}
                      onDeleteLine={supprimerLigne}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <BLFormActions
            montantTotal={calculerMontantTotal()}
            onSave={sauvegarderBL}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default CreationBonModule;
