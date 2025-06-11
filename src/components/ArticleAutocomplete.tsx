
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
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('designation');

      if (error) throw error;
      
      const cleanedArticles = (data || []).map(article => ({
        ...article,
        designation: article.designation.trim()
      }));
      
      setArticles(cleanedArticles);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
    }
  };

  const handleSearch = (searchValue: string) => {
    onValueChange(searchValue);
    
    if (searchValue.length >= 2) {
      const searchLower = searchValue.trim().toLowerCase();
      const filtered = articles.filter(article => 
        article.designation.toLowerCase().includes(searchLower)
      );
      setFilteredArticles(filtered);
    } else {
      setFilteredArticles([]);
    }
  };

  const handleSelect = (article: Article) => {
    onSelect(article);
    setOpen(false);
  };

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
        <Command>
          <CommandInput
            placeholder="Tapez pour rechercher..."
            value={value}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>Aucun article trouvé.</CommandEmpty>
            <CommandGroup>
              {filteredArticles.slice(0, 10).map((article) => (
                <CommandItem
                  key={article.id}
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ArticleAutocomplete;
