
import { useState, useEffect } from "react";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "@/types/database";

interface ArticleAutocompleteProps {
  value: string;
  onSelect: (article: Article) => void;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const ArticleAutocomplete = ({ value, onSelect, onValueChange, placeholder = "Rechercher un article..." }: ArticleAutocompleteProps) => {
  const [open, setOpen] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    fetchAllArticles();
  }, []);

  const fetchAllArticles = async () => {
    console.log('Récupération de TOUS les articles...');
    setLoading(true);
    try {
      let allArticles: Article[] = [];
      let from = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore) {
        console.log(`Récupération du batch ${from} à ${from + batchSize - 1}`);
        
        const { data, error, count } = await supabase
          .from('articles')
          .select('*', { count: 'exact' })
          .order('designation')
          .range(from, from + batchSize - 1);

        if (error) {
          console.error('Erreur Supabase:', error);
          throw error;
        }

        if (data && data.length > 0) {
          allArticles = [...allArticles, ...data];
          console.log(`Articles récupérés dans ce batch: ${data.length}, Total: ${allArticles.length}`);
        }

        // Vérifier s'il y a plus d'articles
        hasMore = data && data.length === batchSize;
        from += batchSize;

        // Log du count total pour la première requête
        if (from === batchSize && count !== null) {
          console.log(`Nombre total d'articles dans la base: ${count}`);
        }
      }
      
      console.log(`TOTAL FINAL d'articles récupérés: ${allArticles.length}`);
      
      const cleanedArticles = allArticles.map(article => ({
        ...article,
        designation: article.designation.trim()
      }));
      
      setArticles(cleanedArticles);
      
      // Vérifier spécifiquement les articles commençant par CL
      const clArticles = cleanedArticles.filter(a => a.designation.toLowerCase().startsWith('cl'));
      console.log('Articles commençant par CL:', clArticles.length, clArticles.map(a => a.designation));
      
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchValue: string) => {
    console.log('Recherche pour:', searchValue);
    setSearchValue(searchValue);
    onValueChange(searchValue);
    
    // Si on efface le champ, réinitialiser la sélection
    if (searchValue.length === 0) {
      setSelectedArticle(null);
    }
    
    if (searchValue.length >= 2) {
      const searchLower = searchValue.trim().toLowerCase();
      console.log('Terme de recherche nettoyé:', searchLower);
      console.log('Nombre total d\'articles à filtrer:', articles.length);
      
      const filtered = articles.filter(article => {
        const articleDesignation = article.designation.toLowerCase().trim();
        const match = articleDesignation.startsWith(searchLower);
        return match;
      });
      
      console.log('Articles filtrés avec startsWith:', filtered.length);
      if (searchLower === 'cl') {
        console.log('Articles filtrés pour "cl":', filtered.map(a => a.designation));
      }
      setFilteredArticles(filtered);
    } else {
      console.log('Recherche trop courte, reset des résultats');
      setFilteredArticles([]);
    }
  };

  const handleSelect = (article: Article) => {
    console.log('Article sélectionné:', article);
    setSelectedArticle(article);
    setSearchValue("");
    onSelect(article);
    setOpen(false);
    setFilteredArticles([]);
  };

  const displayedArticles = filteredArticles.slice(0, 10);

  // Afficher le nom complet de l'article sélectionné ou la valeur de recherche
  const displayValue = selectedArticle ? selectedArticle.designation : searchValue;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          onClick={() => setOpen(true)}
        >
          {displayValue || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Tapez pour rechercher... (${articles.length} articles chargés)`}
            value={searchValue}
            onValueChange={handleSearch}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm">
                Chargement de tous les articles...
              </div>
            ) : (
              <>
                {searchValue.length >= 2 && displayedArticles.length === 0 ? (
                  <CommandEmpty>Aucun article trouvé pour "{searchValue}" parmi {articles.length} articles</CommandEmpty>
                ) : searchValue.length < 2 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    Tapez au moins 2 caractères pour rechercher parmi {articles.length} articles
                  </div>
                ) : null}
                
                {displayedArticles.length > 0 && (
                  <CommandGroup>
                    {displayedArticles.map((article) => (
                      <CommandItem
                        key={article.id}
                        value={article.designation}
                        onSelect={() => handleSelect(article)}
                        className="cursor-pointer"
                      >
                        <div className="flex flex-col w-full">
                          <div className="font-medium">{article.designation}</div>
                          <div className="text-sm text-gray-500">{Number(article.prix).toFixed(3)} TND</div>
                        </div>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedArticle?.designation === article.designation ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ArticleAutocomplete;
