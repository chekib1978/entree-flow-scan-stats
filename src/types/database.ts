
export interface Article {
  id: string;
  designation: string;
  prix: number;
  code_article?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface BonEntree {
  id: string;
  numero_bl: string;
  fournisseur: string;
  date_bl: string;
  montant_total: number;
  statut: string;
  notes?: string;
  qr_code_data?: string;
  created_at: string;
  updated_at: string;
}

export interface LigneBonEntree {
  id: string;
  bon_entree_id: string;
  article_id?: string;
  designation: string;
  quantite: number;
  prix_unitaire: number;
  montant_ligne: number;
  created_at: string;
}

export interface GroupeBL {
  id: string;
  nom: string;
  date_creation: string;
  montant_total: number;
  nombre_bl: number;
  statut: string;
  created_at: string;
  updated_at: string;
}

export interface LiaisonGroupeBL {
  id: string;
  groupe_id: string;
  bon_entree_id: string;
  created_at: string;
}
