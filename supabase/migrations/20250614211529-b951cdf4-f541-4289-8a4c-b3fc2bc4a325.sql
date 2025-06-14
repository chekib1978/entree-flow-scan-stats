
-- Script de vidage sélectif de la base de données
-- Garder la table articles intacte, vider toutes les autres tables

-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = replica;

-- Vider les tables de liaison et mouvements en premier
TRUNCATE TABLE public.liaison_groupe_bl RESTART IDENTITY CASCADE;

-- Vider les lignes de bons d'entrée (mouvements détaillés)
TRUNCATE TABLE public.ligne_bon_entree RESTART IDENTITY CASCADE;

-- Vider les bons d'entrée principaux
TRUNCATE TABLE public.bons_entree RESTART IDENTITY CASCADE;

-- Vider les groupes de BL
TRUNCATE TABLE public.groupes_bl RESTART IDENTITY CASCADE;

-- Vider la table clients
TRUNCATE TABLE public.clients RESTART IDENTITY CASCADE;

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = DEFAULT;

-- Note: La table articles est préservée avec toutes ses données
-- Réinitialiser les séquences des tables vidées
SELECT setval(pg_get_serial_sequence('public.bons_entree', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.groupes_bl', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.clients', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.ligne_bon_entree', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.liaison_groupe_bl', 'id'), 1, false);
