
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface BLFormHeaderProps {
  numeroBL: string;
  setNumeroBL: (value: string) => void;
  fournisseur: string;
  setFournisseur: (value: string) => void;
  dateBL: string;
  setDateBL: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
}

const BLFormHeader = ({
  numeroBL,
  setNumeroBL,
  fournisseur,
  setFournisseur,
  dateBL,
  setDateBL,
  notes,
  setNotes
}: BLFormHeaderProps) => {
  return (
    <>
      {/* Informations générales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="numeroBL">Numéro BL *</Label>
          <Input
            id="numeroBL"
            value={numeroBL}
            onChange={(e) => setNumeroBL(e.target.value)}
            placeholder="Ex: BL-2024-001"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="fournisseur">Fournisseur *</Label>
          <Input
            id="fournisseur"
            value={fournisseur}
            onChange={(e) => setFournisseur(e.target.value)}
            placeholder="Nom du fournisseur"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="dateBL">Date BL *</Label>
          <Input
            id="dateBL"
            type="date"
            value={dateBL}
            onChange={(e) => setDateBL(e.target.value)}
          />
        </div>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes additionnelles..."
          rows={3}
        />
      </div>
    </>
  );
};

export default BLFormHeader;
