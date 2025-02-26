import React, { useState, useEffect } from "react";
import { Search, Filter, X } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
const initialSuggestions = [];

const AutocompleteInput = ({
  value: initialValue,
  onChange,
  suggestions: initialSuggestions,
  placeholder = "Search...",
  isLoading = false,
  filterKey = "",
  onInputType = () => {},
}) => {
  // Ensure value and suggestions are always arrays
  const value = Array.isArray(initialValue) ? initialValue : [];
  const suggestions = Array.isArray(initialSuggestions)
    ? initialSuggestions
    : [];

  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const addValue = (newValue) => {
    if (!value.includes(newValue)) {
      const newValues = [...value, newValue];
      onChange?.(newValues);
    }
    setInputValue("");
  };

  const removeValue = (valueToRemove) => {
    const newValues = value.filter((v) => v !== valueToRemove);
    onChange?.(newValues);
  };

  const handleInputChange = (newValue) => {
    setInputValue(newValue);
    onInputType?.(newValue);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (open) setOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [open]);

  console.log(inputValue, suggestions);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full justify-start pl-8 text-left"
              onClick={(e) => {
                e.stopPropagation();
                setOpen(!open);
              }}
            >
              {inputValue || placeholder}
            </Button>
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="w-full p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <Command>
            <CommandInput
              value={inputValue}
              onValueChange={handleInputChange}
              placeholder={`Search ${filterKey.toLowerCase()}...`}
            />
            <CommandEmpty>
              {isLoading ? "Loading..." : "No results found."}
            </CommandEmpty>
            <CommandList>
              {suggestions.length > 0 && (
                <CommandGroup>
                  {suggestions.map((suggestion) => (
                    <CommandItem
                      key={suggestion}
                      onSelect={() => {
                        addValue(suggestion);
                        setOpen(false);
                      }}
                    >
                      {suggestion}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((item) => (
            <Badge
              key={item}
              variant="secondary"
              className="flex items-center gap-1"
            >
              {item}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => removeValue(item)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default AutocompleteInput;
