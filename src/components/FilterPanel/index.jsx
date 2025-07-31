"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Search, Filter, X, ChevronsUpDown } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSelector, useDispatch } from "react-redux";
import {
  setFilter,
  deleteFilter,
  selectFilters,
} from "@/store/reducer/streamfilters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FilterSliderWrapper from "../FilterSliderWrapper";
import AutocompleteInput from "../AutocompleteInput";
import AutocompleteInputWrapper from "../AutocompleteInputWrapper";
import useStore from "@/store/strore";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

const CATEGORIES = {
  location: "Location",
  station: "Station",
  event: "Event",
  artist: "Artist",
  track: "Track",
};

// Debounce function to delay search execution
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};

const FilterControl = ({ filter, category, value, onChange }) => {
  const isRangeType = filter.type.includes("conditional");

  if (isRangeType) {
    const [min, max] =
      filter.range ?? (filter.type.includes("Year") ? [1900, 2024] : [0, 100]);
    return (
      <div className="space-y-2">
        <FilterSliderWrapper
          min={min}
          max={max}
          category={category}
          step={1}
          mode={value?.mode || "range"}
          value={value?.value || [min, max]}
          onValueChange={onChange}
          className="w-full"
        />
      </div>
    );
  }

  return (
    <AutocompleteInputWrapper
      value={Array.isArray(value?.value) ? value.value : []}
      onChange={(newValue) => onChange({ value: newValue })}
      placeholder={`Search ${filter.label.toLowerCase()}`}
      filterKey={filter.label}
      field={filter.field}
      category={category}
    />
  );
};

const CategorySection = ({
  category,
  filters,
  activeFilters,
  onFilterChange,
  onToggleFilter,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const categoryFilters = filters.filter((f) => f.field.startsWith(category));
  const categoryFiltersDefault = categoryFilters.filter((f) => f.default);

  if (categoryFilters.length === 0) return null;

  return (
    <div className="space-y-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
        <div className="flex items-center justify-between space-x-4 px-4">
          <h3 className="font-medium text-sm text-gray-500">
            {CATEGORIES[category]}
          </h3>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              <ChevronsUpDown className="h-4 w-4" />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>

        <div className="space-y-4">
          {!isOpen ? (
            categoryFiltersDefault.map((filter) => {
              const isActive = filter.field in activeFilters;
              return (
                <div key={filter.field} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isActive}
                        onChange={() => onToggleFilter(filter)}
                        className="h-4 w-4"
                      />
                      {filter.label}
                    </label>
                  </div>
                  {isActive && (
                    <FilterControl
                      category={category}
                      filter={filter}
                      value={activeFilters[filter.field]}
                      onChange={(value) => onFilterChange(filter.field, value)}
                    />
                  )}
                </div>
              );
            })
          ) : (
            <CollapsibleContent className="space-y-2">
              {categoryFilters.map((filter) => {
                const isActive = filter.field in activeFilters;
                return (
                  <div key={filter.field} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => onToggleFilter(filter)}
                          className="h-4 w-4"
                        />
                        {filter.label}
                      </label>
                    </div>
                    {isActive && (
                      <FilterControl
                        category={category}
                        filter={filter}
                        value={activeFilters[filter.field]}
                        onChange={(value) =>
                          onFilterChange(filter.field, value)
                        }
                      />
                    )}
                  </div>
                );
              })}
            </CollapsibleContent>
          )}
        </div>
      </Collapsible>
    </div>
  );
};

const FilterDialog = ({
  isOpen,
  onClose,
  availableFilters,
  activeFilters,
  onFilterChange,
  onToggleFilter,
  onApplyFilters,
}) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          // Apply filters when dialog closes
          onApplyFilters();
        }
        onClose(open);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">
              All Filters
            </TabsTrigger>
            <TabsTrigger value="active" className="flex-1">
              Active Filters
            </TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                {Object.keys(CATEGORIES).map((category) => (
                  <CategorySection
                    key={category}
                    category={category}
                    filters={availableFilters}
                    activeFilters={activeFilters}
                    onFilterChange={onFilterChange}
                    onToggleFilter={onToggleFilter}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="active">
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                {Object.keys(CATEGORIES).map((category) => (
                  <CategorySection
                    key={category}
                    category={category}
                    filters={availableFilters.filter(
                      (f) => f.field in activeFilters
                    )}
                    activeFilters={activeFilters}
                    onFilterChange={onFilterChange}
                    onToggleFilter={onToggleFilter}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

const AdvancedFilter = () => {
  const dispatch = useDispatch();
  const searchInputRef = useRef(null);

  const {
    setQuery,
    query,
    loading: { events: loadingEvents },
    search,
  } = useStore();

  const activeFilters = useSelector(selectFilters);

  const [searchQuery, setSearchQuery] = useState(query?.value ?? "");
  const [searchQueryCat, setSearchQueryCat] = useState(query?.key ?? "*");
  const [availableFilters, setAvailableFilters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);

  // Use debounce for search query with 800ms delay
  const debouncedSearchQuery = useDebounce(searchQuery, 800);
  // const debouncedSearchQueryCat = useDebounce(searchQueryCat, 800);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const response = await fetch("/api/filters/available");
        const data = await response.json();
        setAvailableFilters(data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching available filters:", error);
        setIsLoading(false);
      }
    };
    fetchFilters();
  }, []);

  // Effect to handle search on debounced query change
  useEffect(() => {
    // Track if this is the input being cleared
    const wasCleared = prevSearchQuery && !debouncedSearchQuery;

    // Store current query for next comparison
    setPrevSearchQuery(debouncedSearchQuery);

    // Always perform search when debounced value changes,
    // including when input is cleared
    if (debouncedSearchQuery !== query?.value || wasCleared) {
      handleSearch();
    }
  }, [debouncedSearchQuery, searchQueryCat]);

  const handleFilterChange = (field, value) => {
    dispatch(setFilter({ key: field, value }));
  };

  const handleToggleFilter = (filter) => {
    if (filter.field in activeFilters) {
      dispatch(deleteFilter({ key: filter.field }));
    } else {
      dispatch(
        setFilter({
          key: filter.field,
          value: filter.type.includes("conditional")
            ? { value: filter.range ?? [0, 100], mode: "range" }
            : { value: [] },
        })
      );
    }
  };

  const removeFilter = (field) => {
    dispatch(deleteFilter({ key: field }));
    // Trigger search after removing a filter
    setTimeout(handleSearch, 0);
  };

  const handleSearch = useCallback((input) => {
    // Update query in store (including when empty)
    const c = input?.searchQueryCat??searchQueryCat;
    const q = input?.searchQuery??searchQuery;
    setQuery({ key: c, value: q });

    // Trigger search with current filters and query
    // if (typeof search === "function") {
    //   search();
    // } else {
    //   console.warn("Search function not available in store");
    // }
  }, [searchQuery, searchQueryCat, setQuery, search]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Remove focus from input to indicate search is happening
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
      handleSearch();
    }
  };

  // Handle clicking outside the search input
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target) &&
        document.activeElement === searchInputRef.current
      ) {
        // User clicked outside while the input was focused
        handleSearch();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleSearch]);

  // Helper function to clear search
  const clearSearch = () => {
    setSearchQuery("");
    // Explicitly trigger search with empty query
    setTimeout(() => {
      setQuery({ key: searchQueryCat, value: "" });
      // search();
    }, 0);
  };

  const renderFilterTag = ([field, { value, mode }]) => {
    const filter = availableFilters.find((f) => f.field === field);
    if (!filter) return null;

    let valueTag = "";
    if (mode === "lower") {
      valueTag = `≤ ${value[0]}`;
    } else if (mode === "greater") {
      valueTag = `≥ ${value[0]}`;
    } else if (mode === "range") {
      valueTag = `${value[0]} - ${value[1]}`;
    } else {
      valueTag = Array.isArray(value) ? value.join(",") : value;
    }

    return (
      <Badge
        key={field}
        variant="secondary"
        className="flex items-center gap-1"
      >
        <span>
          {filter.label}: {valueTag}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-4 w-4 p-0 hover:bg-transparent"
          onClick={() => removeFilter(field)}
        >
          <X className="h-3 w-3" />
        </Button>
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex flex-1">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            ref={searchInputRef}
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="pl-8 pr-[104px] py-4"
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-[104px] top-1"
              onClick={clearSearch}
            >
              <X />
            </Button>
          )}
          <Select
            value={searchQueryCat}
            onValueChange={(value) => {
              setSearchQueryCat(value);
              handleSearch({searchQueryCat:value});
              // Trigger search when category changes
              // setTimeout(handleSearch, 0);
            }}
          >
            <SelectTrigger className="absolute right-0 top-0 w-[100px]">
              <SelectValue placeholder="*" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Search Category</SelectLabel>
                <SelectItem value="artist_sp_name">Artist</SelectItem>
                <SelectItem value="track_sp_name">Track</SelectItem>
                <SelectItem value="station_ar_genre">Genre</SelectItem>
                <SelectItem value="event_ma_id">Event ID</SelectItem>
                <SelectItem value="*">All</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => setIsFilterDialogOpen(true)}
        >
          <Filter className="h-4 w-4" />
          Advance Search ({Object.keys(activeFilters).length})
        </Button>
      </div>

      {loadingEvents && (
        <div className="text-sm text-gray-500">Searching...</div>
      )}

      <div className="flex flex-wrap gap-2">
        {Object.entries(activeFilters).map(renderFilterTag)}
      </div>

      <FilterDialog
        isOpen={isFilterDialogOpen}
        onClose={() => setIsFilterDialogOpen(false)}
        availableFilters={availableFilters}
        activeFilters={activeFilters}
        onFilterChange={handleFilterChange}
        onToggleFilter={handleToggleFilter}
        onApplyFilters={handleSearch}
      />
    </div>
  );
};

export default AdvancedFilter;
