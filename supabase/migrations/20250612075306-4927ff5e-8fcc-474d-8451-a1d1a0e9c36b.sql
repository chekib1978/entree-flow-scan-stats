
-- Recréer la fonction truncate_articles avec TRUNCATE au lieu de DELETE
CREATE OR REPLACE FUNCTION public.truncate_articles()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  truncate table public.articles restart identity;
end;
$function$
