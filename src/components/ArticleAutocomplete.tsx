
import { useState, useEffect, useMemo } from "react";
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
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Charger le nombre total d'articles une seule fois
  useEffect(() => {
    const getTotalCount = async () => {
      const { count } = await supabase
        .from('articles')
        .select('*', { count: 'exact', head: true });
      setTotalCount(count || 0);
    };
    getTotalCount();
  }, []);

  const searchArticles = async (searchTerm: string) => {
    if (searchTerm.length < 2) {
      setArticles([]);
      return;
    }

    console.log('Recherche en temps réel pour:', searchTerm);
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .ilike('designation', `${searchTerm}%`)
        .order('designation')
        .limit(20);

      if (error) {
        console.error('Erreur lors de la recherche:', error);
        return;
      }

      console.log(`Trouvé ${data?.length || 0} articles pour "${searchTerm}"`);
      setArticles(data || []);
      
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setLoading(false);
    }
  };

  // Debounce pour éviter trop de requêtes
  useEffect(() => {
    const timer = setTimeout(() => {
      searchArticles(searchValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const handleSearch = (searchValue: string) => {
    console.log('Recherche pour:', searchValue);
    setSearchValue(searchValue);
    onValueChange(searchValue);
    
    // Si on efface le champ, réinitialiser la sélection
    if (searchValue.length === 0) {
      setSelectedArticle(null);
      setArticles([]);
    }
  };

  const handleSelect = (article: Article) => {
    console.log('Article sélectionné:', article);
    setSelectedArticle(article);
    setSearchValue("");
    onSelect(article);
    setOpen(false);
    setArticles([]);
  };

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
            placeholder={`Recherche rapide... (${totalCount} articles)`}
            value={searchValue}
            onValueChange={handleSearch}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm">
                Recherche en cours...
              </div>
            ) : (
              <>
                {searchValue.length >= 2 && articles.length === 0 && !loading ? (
                  <CommandEmpty>Aucun article trouvé pour "{searchValue}"</CommandEmpty>
                ) : searchValue.length < 2 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    Tapez au moins 2 caractères pour rechercher
                  </div>
                ) : null}
                
                {articles.length > 0 && (
                  <CommandGroup>
                    {articles.map((article) => (
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
