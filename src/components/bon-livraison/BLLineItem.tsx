
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { Article } from "@/types/database";
import ArticleAutocomplete from "../ArticleAutocomplete";

interface LigneBL {
  id: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
  article_id?: string;
}

interface BLLineItemProps {
  ligne: LigneBL;
  onArticleSelect: (article: Article, lineId: string) => void;
  onValueChange: (value: string, lineId: string) => void;
  onUpdateLine: (id: string, champ: keyof LigneBL, valeur: any) => void;
  onDeleteLine: (id: string) => void;
}

const BLLineItem = ({
  ligne,
  onArticleSelect,
  onValueChange,
  onUpdateLine,
  onDeleteLine
}: BLLineItemProps) => {
  return (
    <TableRow>
      <TableCell>
        <ArticleAutocomplete
          value={ligne.designation}
          onSelect={(article) => onArticleSelect(article, ligne.id)}
          onValueChange={(value) => onValueChange(value, ligne.id)}
          placeholder="Rechercher un article..."
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min="1"
          value={ligne.quantite}
          onChange={(e) => onUpdateLine(ligne.id, 'quantite', parseInt(e.target.value) || 1)}
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.001"
          min="0"
          value={ligne.prix_unitaire}
          onChange={(e) => onUpdateLine(ligne.id, 'prix_unitaire', parseFloat(e.target.value) || 0)}
        />
      </TableCell>
      <TableCell>
        <div className="font-medium">
          {ligne.montant_ligne.toFixed(3)} TND
        </div>
      </TableCell>
      <TableCell>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onDeleteLine(ligne.id)}
          className="text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
};

export default BLLineItem;
