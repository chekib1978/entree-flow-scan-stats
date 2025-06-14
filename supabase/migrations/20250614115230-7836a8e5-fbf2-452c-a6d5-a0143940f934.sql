
-- Créer une vue pour obtenir le détail des articles par groupe
CREATE OR REPLACE VIEW vue_detail_groupe_articles AS
SELECT 
  lg.groupe_id,
  lbe.designation,
  lbe.article_id,
  SUM(lbe.quantite) as quantite_totale,
  AVG(lbe.prix_unitaire) as prix_unitaire_moyen,
  SUM(lbe.montant_ligne) as montant_total_article
FROM liaison_groupe_bl lg
JOIN bons_entree be ON lg.bon_entree_id = be.id
JOIN ligne_bon_entree lbe ON be.id = lbe.bon_entree_id
GROUP BY lg.groupe_id, lbe.designation, lbe.article_id
ORDER BY lg.groupe_id, lbe.designation;

-- Créer une fonction pour obtenir les détails d'un groupe spécifique
CREATE OR REPLACE FUNCTION get_groupe_details(groupe_id_param uuid)
RETURNS TABLE(
  designation text,
  article_id uuid,
  quantite_totale bigint,
  prix_unitaire_moyen numeric,
  montant_total_article numeric
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    vdga.designation,
    vdga.article_id,
    vdga.quantite_totale,
    vdga.prix_unitaire_moyen,
    vdga.montant_total_article
  FROM vue_detail_groupe_articles vdga
  WHERE vdga.groupe_id = groupe_id_param
  ORDER BY vdga.designation;
END;
$$;
