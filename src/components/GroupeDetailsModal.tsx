
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GroupeBL } from "@/types/database";

interface GroupeDetailsModalProps {
  groupe: GroupeBL | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DetailArticle {
  designation: string;
  article_id: string | null;
  quantite_totale: number;
  prix_unitaire_moyen: number;
  montant_total_article: number;
}

const GroupeDetailsModal = ({ groupe, open, onOpenChange }: GroupeDetailsModalProps) => {
  const [details, setDetails] = useState<DetailArticle[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (groupe && open) {
      fetchGroupeDetails();
    }
  }, [groupe, open]);

  const fetchGroupeDetails = async () => {
    if (!groupe) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_groupe_details', {
        groupe_id_param: groupe.id
      });

      if (error) throw error;
      setDetails(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des détails:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculerMontantTotalGroupe = () => {
    return details.reduce((total, article) => total + Number(article.montant_total_article), 0);
  };

  if (!groupe) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="w-5 h-5" />
            Détails du groupe : {groupe.nom}
          </DialogTitle>
          <DialogDescription>
            Rapport détaillé des articles présents dans ce groupe de BL
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Résumé du groupe */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{groupe.nombre_bl}</div>
              <div className="text-sm text-blue-600">BL groupés</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{details.length}</div>
              <div className="text-sm text-blue-600">Articles différents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">{calculerMontantTotalGroupe().toFixed(3)} TND</div>
              <div className="text-sm text-blue-600">Montant total</div>
            </div>
          </div>

          {/* Tableau des détails */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Désignation Article</TableHead>
                  <TableHead className="text-center">Quantité Totale</TableHead>
                  <TableHead className="text-center">Prix Unitaire Moyen</TableHead>
                  <TableHead className="text-center">Montant Total Article</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="animate-pulse">Chargement des détails...</div>
                    </TableCell>
                  </TableRow>
                ) : details.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Aucun détail disponible
                    </TableCell>
                  </TableRow>
                ) : (
                  details.map((article, index) => (
                    <TableRow key={index} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{article.designation}</TableCell>
                      <TableCell className="text-center">{article.quantite_totale}</TableCell>
                      <TableCell className="text-center">{Number(article.prix_unitaire_moyen).toFixed(3)} TND</TableCell>
                      <TableCell className="text-center font-semibold">{Number(article.montant_total_article).toFixed(3)} TND</TableCell>
                    </TableRow>
                  ))
                )}
                {details.length > 0 && (
                  <TableRow className="bg-blue-50 font-bold">
                    <TableCell>TOTAL GÉNÉRAL</TableCell>
                    <TableCell className="text-center">
                      {details.reduce((sum, article) => sum + Number(article.quantite_totale), 0)}
                    </TableCell>
                    <TableCell className="text-center">-</TableCell>
                    <TableCell className="text-center text-blue-700">
                      {calculerMontantTotalGroupe().toFixed(3)} TND
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <Button className="bg-green-600 hover:bg-green-700">
              <Download className="w-4 h-4 mr-2" />
              Exporter Excel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GroupeDetailsModal;
