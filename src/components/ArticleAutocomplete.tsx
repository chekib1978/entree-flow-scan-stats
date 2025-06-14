
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

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    console.log('Fetching articles...');
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('designation');

      if (error) {
        console.error('Erreur Supabase:', error);
        throw error;
      }
      
      console.log('Articles récupérés:', data?.length || 0);
      
      const cleanedArticles = (data || []).map(article => ({
        ...article,
        designation: article.designation.trim()
      }));
      
      setArticles(cleanedArticles);
      console.log('Articles nettoyés:', cleanedArticles);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchValue: string) => {
    console.log('Recherche pour:', searchValue);
    onValueChange(searchValue);
    
    if (searchValue.length >= 2) {
      const searchLower = searchValue.trim().toLowerCase();
      console.log('Terme de recherche nettoyé:', searchLower);
      
      const filtered = articles.filter(article => {
        const match = article.designation.toLowerCase().startsWith(searchLower);
        console.log(`Article "${article.designation}" startsWith match: ${match}`);
        return match;
      });
      
      console.log('Articles filtrés avec startsWith:', filtered.length);
      setFilteredArticles(filtered);
    } else {
      console.log('Recherche trop courte, reset des résultats');
      setFilteredArticles([]);
    }
  };

  const handleSelect = (article: Article) => {
    console.log('Article sélectionné:', article);
    onSelect(article);
    setOpen(false);
  };

  const displayedArticles = filteredArticles.slice(0, 10);
  console.log('Articles à afficher:', displayedArticles.length);

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
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Tapez pour rechercher..."
            value={value}
            onValueChange={handleSearch}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm">Chargement...</div>
            ) : (
              <>
                {value.length >= 2 && displayedArticles.length === 0 ? (
                  <CommandEmpty>Aucun article trouvé pour "{value}"</CommandEmpty>
                ) : value.length < 2 ? (
                  <div className="py-6 text-center text-sm text-gray-500">
                    Tapez au moins 2 caractères pour rechercher
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
                            value === article.designation ? "opacity-100" : "opacity-0"
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
