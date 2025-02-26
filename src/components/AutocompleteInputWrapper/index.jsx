import React, { useState, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import AutocompleteInput from "../AutocompleteInput";

const AutocompleteInputWrapper = ({
  category = "track",
  value = [],
  field = "",
  ...props
}) => {
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debounced function to fetch suggestions from Elasticsearch
  const fetchSuggestions = useCallback(
    debounce(async (searchTerm) => {
      if (!searchTerm || searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/search/suggest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            field,
            category,
            query: searchTerm,
            size: 10,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to fetch suggestions");
        }

        const data = await response.json();
        // Assuming the response contains an array of suggestions
        // Modify this based on your actual Elasticsearch response structure
        const newSuggestions = data.suggestions.map((item) => item.text);
        setSuggestions(
          newSuggestions.filter((suggestion) => !value.includes(suggestion))
        );
      } catch (error) {
        console.error("Error fetching suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [field, value]
  );

  useEffect(() => {
    fetchSuggestions(inputValue);
    return () => {
      fetchSuggestions.cancel();
    };
  }, [inputValue, fetchSuggestions]);
  return (
    <AutocompleteInput
      value={value}
      onInputType={setInputValue}
      suggestions={suggestions}
      isLoading={isLoading}
      {...props}
    />
  );
};

export default AutocompleteInputWrapper;
