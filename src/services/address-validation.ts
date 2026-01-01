// Google Address Validation API Service
// https://developers.google.com/maps/documentation/address-validation

// Common country name to ISO 3166-1 alpha-2 code mapping
const COUNTRY_NAME_TO_CODE: Record<string, string> = {
  "united states": "US",
  usa: "US",
  "u.s.a.": "US",
  "u.s.": "US",
  "united states of america": "US",
  canada: "CA",
  "united kingdom": "GB",
  "great britain": "GB",
  england: "GB",
  australia: "AU",
  germany: "DE",
  france: "FR",
  italy: "IT",
  spain: "ES",
  mexico: "MX",
  japan: "JP",
  china: "CN",
  india: "IN",
  brazil: "BR",
  netherlands: "NL",
  belgium: "BE",
  switzerland: "CH",
  austria: "AT",
  ireland: "IE",
  "new zealand": "NZ",
  sweden: "SE",
  norway: "NO",
  denmark: "DK",
  finland: "FI",
  portugal: "PT",
  greece: "GR",
  poland: "PL",
  "czech republic": "CZ",
  czechia: "CZ",
  "south korea": "KR",
  korea: "KR",
  singapore: "SG",
  "hong kong": "HK",
  taiwan: "TW",
  philippines: "PH",
  thailand: "TH",
  vietnam: "VN",
  indonesia: "ID",
  malaysia: "MY",
  "south africa": "ZA",
  argentina: "AR",
  chile: "CL",
  colombia: "CO",
  peru: "PE",
  israel: "IL",
  "united arab emirates": "AE",
  uae: "AE",
  "saudi arabia": "SA",
  russia: "RU",
  ukraine: "UA",
  turkey: "TR",
  egypt: "EG",
};

/**
 * Convert a country name or code to an ISO 3166-1 alpha-2 code
 */
function normalizeCountryCode(country: string | undefined): string {
  if (!country) return "US";

  // If it's already a 2-letter code, return it uppercase
  if (country.length === 2) {
    return country.toUpperCase();
  }

  // Try to find it in our mapping
  const normalized = country.toLowerCase().trim();
  const code = COUNTRY_NAME_TO_CODE[normalized];
  if (code) {
    return code;
  }

  // Default to US if we can't determine the country
  return "US";
}

export interface AddressValidationResult {
  isValid: boolean;
  formattedAddress?: string;
  addressComponents?: {
    streetNumber?: string;
    route?: string;
    locality?: string;
    administrativeAreaLevel1?: string;
    postalCode?: string;
    country?: string;
  };
  verdict?: {
    inputGranularity?: string;
    validationGranularity?: string;
    geocodeGranularity?: string;
    addressComplete?: boolean;
    hasUnconfirmedComponents?: boolean;
    hasInferredComponents?: boolean;
    hasReplacedComponents?: boolean;
  };
  error?: string;
}

export interface AddressInput {
  address1: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

interface GoogleAddressValidationResponse {
  result: {
    verdict: {
      inputGranularity?: string;
      validationGranularity?: string;
      geocodeGranularity?: string;
      addressComplete?: boolean;
      hasUnconfirmedComponents?: boolean;
      hasInferredComponents?: boolean;
      hasReplacedComponents?: boolean;
    };
    address: {
      formattedAddress: string;
      addressComponents: Array<{
        componentName: {
          text: string;
          languageCode: string;
        };
        componentType: string;
        confirmationLevel: string;
      }>;
    };
  };
  responseId: string;
}

/**
 * Validates an address using Google Address Validation API
 */
export async function validateAddress(
  apiKey: string,
  address: AddressInput,
): Promise<AddressValidationResult> {
  if (!apiKey) {
    return {
      isValid: false,
      error: "Google Maps API key is required",
    };
  }

  // Build the address lines array
  const addressLines: string[] = [];
  if (address.address1) {
    addressLines.push(address.address1);
  }
  if (address.address2) {
    addressLines.push(address.address2);
  }
  // Add city, state, zip as a combined line
  const cityStateZip = [address.city, address.state, address.zip]
    .filter(Boolean)
    .join(", ");
  if (cityStateZip) {
    addressLines.push(cityStateZip);
  }

  if (addressLines.length === 0) {
    return {
      isValid: false,
      error: "No address provided",
    };
  }

  try {
    const response = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: {
            regionCode: normalizeCountryCode(address.country),
            addressLines,
          },
          enableUspsCass: normalizeCountryCode(address.country) === "US",
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        isValid: false,
        error: errorData.error?.message || `API error: ${response.status}`,
      };
    }

    const data: GoogleAddressValidationResponse = await response.json();

    // Extract address components
    const components: AddressValidationResult["addressComponents"] = {};
    for (const component of data.result.address.addressComponents) {
      const type = component.componentType;
      const text = component.componentName.text;

      switch (type) {
        case "street_number":
          components.streetNumber = text;
          break;
        case "route":
          components.route = text;
          break;
        case "locality":
          components.locality = text;
          break;
        case "administrative_area_level_1":
          components.administrativeAreaLevel1 = text;
          break;
        case "postal_code":
          components.postalCode = text;
          break;
        case "country":
          components.country = text;
          break;
      }
    }

    // Determine if address is valid based on verdict
    // We consider an address valid if it's complete and geocodable to at least PREMISE level
    // We allow:
    // - Inferred/replaced components (Google standardizes addresses)
    // - Unconfirmed sub-premise (apartment/unit) - the building address is still valid
    const verdict = data.result.verdict;
    const isAtLeastPremiseLevel =
      verdict.geocodeGranularity === "PREMISE" ||
      verdict.geocodeGranularity === "SUB_PREMISE" ||
      verdict.validationGranularity === "PREMISE" ||
      verdict.validationGranularity === "SUB_PREMISE";

    const isValid = verdict.addressComplete === true && isAtLeastPremiseLevel;

    return {
      isValid,
      formattedAddress: data.result.address.formattedAddress,
      addressComponents: components,
      verdict: {
        inputGranularity: verdict.inputGranularity,
        validationGranularity: verdict.validationGranularity,
        geocodeGranularity: verdict.geocodeGranularity,
        addressComplete: verdict.addressComplete,
        hasUnconfirmedComponents: verdict.hasUnconfirmedComponents,
        hasInferredComponents: verdict.hasInferredComponents,
        hasReplacedComponents: verdict.hasReplacedComponents,
      },
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export interface ApiKeyValidationResult {
  isValid: boolean;
  addressValidationApi: {
    enabled: boolean;
    error?: string;
  };
  placesApi: {
    enabled: boolean;
    error?: string;
  };
}

/**
 * Verifies that a Google Maps API key is valid for Address Validation API
 */
async function verifyAddressValidationApi(
  apiKey: string,
): Promise<{ enabled: boolean; error?: string }> {
  try {
    const response = await fetch(
      `https://addressvalidation.googleapis.com/v1:validateAddress?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: {
            regionCode: "US",
            addressLines: ["1600 Amphitheatre Pkwy", "Mountain View, CA 94043"],
          },
        }),
      },
    );

    if (response.ok) {
      return { enabled: true };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

    if (response.status === 403) {
      if (
        errorMessage.includes("not enabled") ||
        errorMessage.includes("API has not been used")
      ) {
        return {
          enabled: false,
          error: "Address Validation API is not enabled",
        };
      }
      return {
        enabled: false,
        error: "API key not authorized for Address Validation API",
      };
    }

    if (response.status === 401) {
      return { enabled: false, error: "Invalid API key" };
    }

    return { enabled: false, error: errorMessage };
  } catch (err) {
    return {
      enabled: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Verifies that a Google Maps API key is valid for Places API (Autocomplete)
 */
async function verifyPlacesApi(
  apiKey: string,
): Promise<{ enabled: boolean; error?: string }> {
  try {
    // Use the Places API (New) autocomplete endpoint
    const response = await fetch(
      `https://places.googleapis.com/v1/places:autocomplete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
        },
        body: JSON.stringify({
          input: "1600 Amphitheatre",
          locationBias: {
            circle: {
              center: { latitude: 37.7749, longitude: -122.4194 },
              radius: 5000.0,
            },
          },
        }),
      },
    );

    if (response.ok) {
      return { enabled: true };
    }

    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error?.message || `HTTP ${response.status}`;

    if (response.status === 403) {
      if (
        errorMessage.includes("not enabled") ||
        errorMessage.includes("API has not been used")
      ) {
        return { enabled: false, error: "Places API (New) is not enabled" };
      }
      return { enabled: false, error: "API key not authorized for Places API" };
    }

    if (response.status === 401) {
      return { enabled: false, error: "Invalid API key" };
    }

    return { enabled: false, error: errorMessage };
  } catch (err) {
    return {
      enabled: false,
      error: err instanceof Error ? err.message : "Network error",
    };
  }
}

/**
 * Verifies that a Google Maps API key is valid for all required APIs
 */
export async function verifyGoogleMapsApiKey(apiKey: string): Promise<boolean> {
  const result = await verifyGoogleMapsApiKeyDetailed(apiKey);
  return result.isValid;
}

/**
 * Verifies that a Google Maps API key is valid and returns detailed status for each API
 */
export async function verifyGoogleMapsApiKeyDetailed(
  apiKey: string,
): Promise<ApiKeyValidationResult> {
  if (!apiKey || apiKey.length < 30) {
    return {
      isValid: false,
      addressValidationApi: { enabled: false, error: "API key is too short" },
      placesApi: { enabled: false, error: "API key is too short" },
    };
  }

  // Verify both APIs in parallel
  const [addressValidationResult, placesResult] = await Promise.all([
    verifyAddressValidationApi(apiKey),
    verifyPlacesApi(apiKey),
  ]);

  return {
    isValid: addressValidationResult.enabled && placesResult.enabled,
    addressValidationApi: addressValidationResult,
    placesApi: placesResult,
  };
}

/**
 * Batch validate multiple addresses
 */
export async function validateAddresses(
  apiKey: string,
  addresses: AddressInput[],
  onProgress?: (completed: number, total: number) => void,
): Promise<Map<number, AddressValidationResult>> {
  const results = new Map<number, AddressValidationResult>();

  for (let i = 0; i < addresses.length; i++) {
    const result = await validateAddress(apiKey, addresses[i]);
    results.set(i, result);

    if (onProgress) {
      onProgress(i + 1, addresses.length);
    }

    // Add a small delay to avoid rate limiting
    if (i < addresses.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  return results;
}
