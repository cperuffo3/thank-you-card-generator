import type { Recipient } from "@/types/recipient";

type TitleCategory =
  | "dr"
  | "mr"
  | "mrs"
  | "ms"
  | "miss"
  | "prof"
  | "rev"
  | "hon"
  | "none";

const TITLE_CATEGORIES: Record<string, TitleCategory> = {
  "Dr.": "dr",
  "Mr.": "mr",
  "Mrs.": "mrs",
  "Ms.": "ms",
  Miss: "miss",
  "Prof.": "prof",
  "Rev.": "rev",
  "Hon.": "hon",
  "": "none",
};

const PLURAL_TITLES: Record<TitleCategory, string> = {
  dr: "Drs.",
  mr: "Messrs.",
  mrs: "Mmes.",
  ms: "Mses.",
  miss: "Misses",
  prof: "Profs.",
  rev: "Revs.",
  hon: "Hons.",
  none: "",
};

function getTitleCategory(title: string): TitleCategory {
  return TITLE_CATEGORIES[title] || "none";
}

function getPluralTitle(category: TitleCategory): string {
  return PLURAL_TITLES[category];
}

/**
 * Generates a formal address line following traditional etiquette rules.
 * Examples:
 * - "Mr. John Smith" (single person)
 * - "Mr. and Mrs. John Smith" (married couple, same last name)
 * - "Mr. John Smith and Ms. Jane Doe" (couple, different last names)
 * - "Drs. Michael and Emily Smith" (both doctors, same last name)
 * - "Dr. Michael Smith and Mrs. Emily Smith" (different titles, same last name)
 * - "Dr. Michael Smith and Dr. Emily Jones" (both doctors, different last names)
 *
 * The primary person always comes first.
 */
export function generateAddressTo(recipient: Partial<Recipient>): string {
  const {
    title = "",
    firstName = "",
    lastName = "",
    partnerTitle = "",
    partnerFirst = "",
    partnerLast = "",
  } = recipient;

  const hasPrimary = firstName || lastName;
  const hasPartner = partnerFirst || partnerLast;

  // No one to address
  if (!hasPrimary && !hasPartner) {
    return "";
  }

  // Single person (no partner)
  if (!hasPartner) {
    return formatSinglePerson(title, firstName, lastName);
  }

  // Two people
  const primaryCategory = getTitleCategory(title);
  const partnerCategory = getTitleCategory(partnerTitle);
  const sameLastName =
    lastName &&
    partnerLast &&
    lastName.toLowerCase() === partnerLast.toLowerCase();

  // Same title category and same last name - use plural title
  if (
    primaryCategory === partnerCategory &&
    sameLastName &&
    primaryCategory !== "none"
  ) {
    // "Drs. Michael and Emily Smith"
    const pluralTitle = getPluralTitle(primaryCategory);
    return `${pluralTitle} ${firstName} and ${partnerFirst} ${lastName}`;
  }

  // Same last name but different titles
  if (sameLastName) {
    // Both have no title: "Michael and Emily Smith"
    if (primaryCategory === "none" && partnerCategory === "none") {
      return `${firstName} and ${partnerFirst} ${lastName}`;
    }

    // Primary has title, partner doesn't: "Mr. Michael and Emily Smith"
    if (primaryCategory !== "none" && partnerCategory === "none") {
      return `${title} ${firstName} and ${partnerFirst} ${lastName}`;
    }

    // Partner has title, primary doesn't: "Michael and Mrs. Emily Smith"
    if (primaryCategory === "none" && partnerCategory !== "none") {
      return `${firstName} and ${partnerTitle} ${partnerFirst} ${lastName}`;
    }

    // Both have different titles: "Mr. and Mrs. Michael and Emily Smith" or
    // More traditional: "Mr. Michael and Mrs. Emily Smith"
    return `${title} ${firstName} and ${partnerTitle} ${partnerFirst} ${lastName}`;
  }

  // Different last names - full names for both
  const primaryFull = formatSinglePerson(title, firstName, lastName);
  const partnerFull = formatSinglePerson(
    partnerTitle,
    partnerFirst,
    partnerLast,
  );

  return `${primaryFull} and ${partnerFull}`;
}

function formatSinglePerson(
  title: string,
  firstName: string,
  lastName: string,
): string {
  const parts = [title, firstName, lastName].filter(Boolean);
  return parts.join(" ");
}

/**
 * Recalculates addressTo if not overridden by user.
 * Returns the new addressTo value (or existing if overridden).
 */
export function recalculateAddressTo(recipient: Recipient): string {
  if (recipient.addressToOverridden) {
    return recipient.addressTo;
  }
  return generateAddressTo(recipient);
}
