
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";

interface BLFormActionsProps {
  montantTotal: number;
  onSave: () => void;
  loading: boolean;
}

const BLFormActions = ({ montantTotal, onSave, loading }: BLFormActionsProps) => {
  return (
    <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
      <div className="text-lg font-semibold">
        Montant Total: <span className="text-blue-700">{montantTotal.toFixed(3)} TND</span>
      </div>
      <Button 
        onClick={onSave}
        disabled={loading}
        className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
      >
        <Save className="w-4 h-4 mr-2" />
        {loading ? "Sauvegarde..." : "Sauvegarder BL"}
      </Button>
    </div>
  );
};

export default BLFormActions;
