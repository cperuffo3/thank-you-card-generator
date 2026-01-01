"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/utils/tailwind";
import { MapPin, CheckCircle, AlertCircle, Edit2, Loader2 } from "lucide-react";
import { validateAddress } from "@/services/address-validation";

export interface AddressData {
  address1: string;
  address2: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface AddressValidationStatus {
  isVerified: boolean;
  formattedAddress?: string;
  validationError?: string;
}

export interface AddressAutocompleteProps {
  value: AddressData;
  onChange: (address: AddressData) => void;
  onValidationChange?: (status: AddressValidationStatus) => void;
  isVerified?: boolean;
  formattedAddress?: string;
  validationError?: string;
  googleMapsApiKey?: string;
  className?: string;
}

interface PlacePrediction {
  placeId: string;
  text: string;
  mainText: string;
  secondaryText: string;
}

interface PlacesAutocompleteResponse {
  suggestions?: Array<{
    placePrediction?: {
      placeId: string;
      text: { text: string };
      structuredFormat: {
        mainText: { text: string };
        secondaryText: { text: string };
      };
    };
  }>;
}

interface PlaceDetailsResponse {
  addressComponents?: Array<{
    longText: string;
    shortText: string;
    types: string[];
  }>;
  formattedAddress?: string;
}

interface TextSearchResponse {
  places?: Array<{
    id: string;
    formattedAddress?: string;
    addressComponents?: Array<{
      longText: string;
      shortText: string;
      types: string[];
    }>;
  }>;
}

interface SuggestedAddress {
  placeId: string;
  formattedAddress: string;
  addressData: Partial<AddressData>;
}

// Parse Place Details response into address components
function parseAddressComponents(
  response: PlaceDetailsResponse
): Partial<AddressData> {
  const result: Partial<AddressData> = {};

  if (!response.addressComponents) return result;

  let streetNumber = "";
  let route = "";

  for (const component of response.addressComponents) {
    const types = component.types;

    if (types.includes("street_number")) {
      streetNumber = component.longText;
    } else if (types.includes("route")) {
      route = component.longText;
    } else if (types.includes("locality")) {
      result.city = component.longText;
    } else if (types.includes("administrative_area_level_1")) {
      result.state = component.shortText;
    } else if (types.includes("postal_code")) {
      result.zip = component.longText;
    } else if (types.includes("country")) {
      result.country = component.longText;
    } else if (types.includes("sublocality_level_1") && !result.city) {
      result.city = component.longText;
    }
  }

  if (streetNumber || route) {
    result.address1 = [streetNumber, route].filter(Boolean).join(" ");
  }

  return result;
}

// Fetch autocomplete predictions using Places API (New)
async function fetchAutocompletePredictions(
  apiKey: string,
  input: string
): Promise<PlacePrediction[]> {
  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:autocomplete",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify({
          input,
          includedPrimaryTypes: ["street_address", "subpremise", "premise"],
        }),
      }
    );

    if (!response.ok) {
      console.error("Places API error:", response.status);
      return [];
    }

    const data: PlacesAutocompleteResponse = await response.json();

    if (!data.suggestions) return [];

    return data.suggestions
      .filter((s) => s.placePrediction)
      .map((s) => ({
        placeId: s.placePrediction!.placeId,
        text: s.placePrediction!.text.text,
        mainText: s.placePrediction!.structuredFormat.mainText.text,
        secondaryText: s.placePrediction!.structuredFormat.secondaryText.text,
      }));
  } catch (error) {
    console.error("Failed to fetch predictions:", error);
    return [];
  }
}

// Fetch place details using Places API (New)
async function fetchPlaceDetails(
  apiKey: string,
  placeId: string
): Promise<Partial<AddressData> | null> {
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "addressComponents,formattedAddress",
        },
      }
    );

    if (!response.ok) {
      console.error("Place Details API error:", response.status);
      return null;
    }

    const data: PlaceDetailsResponse = await response.json();
    return parseAddressComponents(data);
  } catch (error) {
    console.error("Failed to fetch place details:", error);
    return null;
  }
}

// Fetch suggested address using Text Search API (New)
// This is used to find a corrected address for failed validations
async function fetchTextSearchSuggestion(
  apiKey: string,
  addressQuery: string
): Promise<SuggestedAddress | null> {
  try {
    const response = await fetch(
      "https://places.googleapis.com/v1/places:searchText",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "places.id,places.formattedAddress,places.addressComponents",
        },
        body: JSON.stringify({
          textQuery: addressQuery,
          pageSize: 1,
        }),
      }
    );

    if (!response.ok) {
      console.error("Text Search API error:", response.status);
      return null;
    }

    const data: TextSearchResponse = await response.json();

    if (!data.places || data.places.length === 0) {
      return null;
    }

    const place = data.places[0];
    if (!place.formattedAddress) {
      return null;
    }

    // Parse address components from the text search result
    const addressData = parseAddressComponents({
      addressComponents: place.addressComponents,
      formattedAddress: place.formattedAddress,
    });

    return {
      placeId: place.id,
      formattedAddress: place.formattedAddress,
      addressData,
    };
  } catch (error) {
    console.error("Failed to fetch text search suggestion:", error);
    return null;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onValidationChange,
  isVerified: initialIsVerified,
  formattedAddress: initialFormattedAddress,
  validationError: initialValidationError,
  googleMapsApiKey,
  className,
}: AddressAutocompleteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedAddress, setSuggestedAddress] = useState<SuggestedAddress | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  // Local validation state - overrides props when set
  const [localValidation, setLocalValidation] = useState<AddressValidationStatus | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const suggestionFetchedRef = useRef(false);

  // Use local validation if available, otherwise use props
  const isVerified = localValidation?.isVerified ?? initialIsVerified;
  const formattedAddress = localValidation?.formattedAddress ?? initialFormattedAddress;
  const validationError = localValidation?.validationError ?? initialValidationError;

  // Check if we have an existing address
  const hasExistingAddress = useMemo(
    () => Boolean(value.address1 || value.city || value.state || value.zip),
    [value.address1, value.city, value.state, value.zip]
  );

  // Format the current address for display
  const displayAddress = useMemo(() => {
    if (!hasExistingAddress) return "";
    return [
      value.address1,
      value.address2,
      [value.city, value.state, value.zip].filter(Boolean).join(", "),
      value.country,
    ]
      .filter(Boolean)
      .join(", ");
  }, [hasExistingAddress, value]);

  // Fetch predictions when search input changes (debounced)
  const fetchPredictions = useCallback(
    async (input: string) => {
      if (!googleMapsApiKey || !input || input.length < 3) {
        setPredictions([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      const results = await fetchAutocompletePredictions(googleMapsApiKey, input);
      setPredictions(results);
      setShowSuggestions(results.length > 0);
      setIsLoading(false);
    },
    [googleMapsApiKey]
  );

  // Handle search input changes with debounce
  const handleSearchInputChange = useCallback(
    (newValue: string) => {
      setSearchInput(newValue);
      setShowSuggestions(true);

      // Clear existing debounce
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // Debounce the API call
      debounceRef.current = setTimeout(() => {
        fetchPredictions(newValue);
      }, 300);
    },
    [fetchPredictions]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Fetch suggested address when address validation has failed
  useEffect(() => {
    // Only fetch if:
    // - We have an API key
    // - Address validation failed (isVerified === false)
    // - We have an existing address to search for
    // - We haven't already fetched a suggestion
    if (
      !googleMapsApiKey ||
      isVerified !== false ||
      !hasExistingAddress ||
      suggestionFetchedRef.current
    ) {
      return;
    }

    suggestionFetchedRef.current = true;

    // Use an async IIFE to handle the async operation
    // The setState calls happen in callbacks after the async fetch completes
    (async () => {
      const suggestion = await fetchTextSearchSuggestion(googleMapsApiKey, displayAddress);
      // Only set the suggestion if it's different from the current address
      if (suggestion && suggestion.formattedAddress !== displayAddress) {
        setSuggestedAddress(suggestion);
      }
    })();
  }, [googleMapsApiKey, isVerified, hasExistingAddress, displayAddress]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectPrediction = useCallback(
    async (prediction: PlacePrediction) => {
      if (!googleMapsApiKey) return;

      setIsLoading(true);
      setShowSuggestions(false);

      const details = await fetchPlaceDetails(googleMapsApiKey, prediction.placeId);

      if (details) {
        const newAddress: AddressData = {
          address1: details.address1 || "",
          address2: value.address2, // Keep existing address2
          city: details.city || "",
          state: details.state || "",
          zip: details.zip || "",
          country: details.country || "",
        };

        // Update the address
        onChange(newAddress);
        setSearchInput("");
        setIsEditing(false);
        setIsLoading(false);

        // Run address validation on the selected address
        setIsValidating(true);
        setSuggestedAddress(null); // Clear any previous suggestion
        suggestionFetchedRef.current = false; // Reset suggestion fetch flag

        const validationResult = await validateAddress(googleMapsApiKey, {
          address1: newAddress.address1,
          address2: newAddress.address2,
          city: newAddress.city,
          state: newAddress.state,
          zip: newAddress.zip,
          country: newAddress.country,
        });

        const newValidationStatus: AddressValidationStatus = {
          isVerified: validationResult.isValid,
          formattedAddress: validationResult.formattedAddress,
          validationError: validationResult.error,
        };

        setLocalValidation(newValidationStatus);
        setIsValidating(false);

        // Notify parent of validation change
        onValidationChange?.(newValidationStatus);
      } else {
        setIsLoading(false);
      }
    },
    [googleMapsApiKey, onChange, value.address2, onValidationChange]
  );

  const startEditing = useCallback(() => {
    setIsEditing(true);
    setSearchInput(displayAddress);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [displayAddress]);

  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setSearchInput("");
    setPredictions([]);
  }, []);

  const acceptSuggestedAddress = useCallback(async () => {
    if (!suggestedAddress || !googleMapsApiKey) return;

    const newAddress: AddressData = {
      address1: suggestedAddress.addressData.address1 || "",
      address2: value.address2, // Keep existing address2
      city: suggestedAddress.addressData.city || "",
      state: suggestedAddress.addressData.state || "",
      zip: suggestedAddress.addressData.zip || "",
      country: suggestedAddress.addressData.country || "",
    };

    // Update the address immediately
    onChange(newAddress);
    setIsValidating(true);

    // Run address validation on the new address
    const validationResult = await validateAddress(googleMapsApiKey, {
      address1: newAddress.address1,
      address2: newAddress.address2,
      city: newAddress.city,
      state: newAddress.state,
      zip: newAddress.zip,
      country: newAddress.country,
    });

    const newValidationStatus: AddressValidationStatus = {
      isVerified: validationResult.isValid,
      formattedAddress: validationResult.formattedAddress,
      validationError: validationResult.error,
    };

    // Clear suggestion and update validation state together
    setSuggestedAddress(null);
    setLocalValidation(newValidationStatus);
    setIsValidating(false);

    // Notify parent of validation change
    onValidationChange?.(newValidationStatus);
  }, [suggestedAddress, googleMapsApiKey, onChange, value.address2, onValidationChange]);

  // Verified address display
  if (hasExistingAddress && isVerified && !isEditing) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Popover>
          <PopoverTrigger asChild>
            <div
              className="group flex h-11 cursor-pointer items-center gap-3 rounded-xl border-2 border-green-500 bg-green-50 px-4"
              onClick={startEditing}
            >
              <CheckCircle className="size-4 shrink-0 text-green-600" />
              <span className="flex-1 truncate text-sm text-green-800">
                {formattedAddress || displayAddress}
              </span>
              <Edit2 className="size-4 shrink-0 text-green-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto" side="top" sideOffset={8}>
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Address verified
              </span>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Validating state - show loading indicator while checking address
  if (hasExistingAddress && isValidating && !isEditing) {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <div className="flex h-11 items-center gap-3 rounded-xl border-2 border-blue-400 bg-blue-50 px-4">
          <Loader2 className="size-4 shrink-0 animate-spin text-blue-600" />
          <span className="flex-1 truncate text-sm text-blue-800">
            Validating address...
          </span>
        </div>
      </div>
    );
  }

  // Invalid address display
  if (hasExistingAddress && isVerified === false && !isEditing) {
    return (
      <div className={cn("flex flex-col gap-3", className)}>
        <Popover>
          <PopoverTrigger asChild>
            <div
              className="group flex h-11 cursor-pointer items-center gap-3 rounded-xl border-2 border-red-400 bg-red-50 px-4"
              onClick={startEditing}
            >
              <AlertCircle className="size-4 shrink-0 text-red-600" />
              <span className="flex-1 truncate text-sm text-red-800">
                {displayAddress}
              </span>
              <Edit2 className="size-4 shrink-0 text-red-600 opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto max-w-xs" side="top" sideOffset={8}>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 text-red-600" />
                <span className="text-sm font-medium text-red-800">
                  Address not verified
                </span>
              </div>
              {validationError && (
                <p className="text-xs text-red-600">{validationError}</p>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Suggested address correction */}
        {suggestedAddress && (
          <div className="flex flex-col gap-2 rounded-xl border-2 border-blue-400 bg-blue-50 p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="size-4 shrink-0 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                Did you mean this address?
              </span>
            </div>
            <p className="text-sm text-blue-700">{suggestedAddress.formattedAddress}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                onClick={acceptSuggestedAddress}
                disabled={isValidating}
                className="h-8 bg-blue-600 text-white hover:bg-blue-700"
              >
                Use this address
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSuggestedAddress(null)}
                disabled={isValidating}
                className="h-8 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
              >
                Dismiss
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Unverified/unknown or editing state - show autocomplete input
  return (
    <div ref={containerRef} className={cn("relative flex flex-col gap-2", className)}>
      {/* Show current address if exists and not editing */}
      {hasExistingAddress && !isEditing && (
        <div
          className="group flex h-11 cursor-pointer items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4"
          onClick={startEditing}
        >
          <MapPin className="size-4 shrink-0 text-gray-400" />
          <span className="flex-1 truncate text-sm text-gray-700">
            {displayAddress}
          </span>
          <Edit2 className="size-4 shrink-0 text-gray-400 opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      )}

      {/* Editing/input mode */}
      {(isEditing || !hasExistingAddress) && (
        <>
          <div className="relative">
            <MapPin className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-gray-400" />
            <Input
              ref={inputRef}
              value={searchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onFocus={() => {
                if (predictions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
              placeholder="Start typing an address..."
              className="h-11 rounded-xl border-2 border-gray-200 bg-white pr-10 pl-10 text-sm"
            />
            {isLoading && (
              <Loader2 className="absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-gray-400" />
            )}

            {/* Suggestions dropdown - positioned directly under input */}
            {showSuggestions && predictions.length > 0 && (
              <div className="absolute top-full right-0 left-0 z-50 mt-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                <ScrollArea className="h-60">
                  <div className="flex flex-col">
                    {predictions.map((prediction) => (
                      <button
                        key={prediction.placeId}
                        type="button"
                        className="flex w-full cursor-pointer flex-col gap-0.5 px-4 py-3 text-left hover:bg-gray-50"
                        onClick={() => handleSelectPrediction(prediction)}
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {prediction.mainText}
                        </span>
                        <span className="text-xs text-gray-500">
                          {prediction.secondaryText}
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </div>

          {/* Cancel button when editing */}
          {isEditing && hasExistingAddress && (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={cancelEditing}
              >
                Cancel
              </Button>
            </div>
          )}
        </>
      )}

      {/* Suggestion to use existing address */}
      {isEditing && hasExistingAddress && searchInput && predictions.length === 0 && !isLoading && (
        <button
          type="button"
          className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left hover:bg-gray-100"
          onClick={cancelEditing}
        >
          <MapPin className="size-4 text-gray-500" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-gray-700">
              Keep current address
            </span>
            <span className="text-xs text-gray-500">{displayAddress}</span>
          </div>
        </button>
      )}
    </div>
  );
}
