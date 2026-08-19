const ALLOWED_STATUSES = [
  "provisional",
  "confirmed",
  "delayed"
];

const EXPECTED_FIELDS = [
  "title",
  "summary",
  "url",
  "release_date",
  "display_date",
  "org",
  "updated",
  "status"
];

export function validatePublication(
  publication,
  {
    dateType,
    allowedOrganisations = []
  } = {}
) {
  const errors = [];

  if (!publication.title?.trim()) {
    errors.push("Title is required.");
  }

  if (!publication.summary?.trim()) {
    errors.push("Summary is required.");
  }

  if (publication.url && !isValidHttpsUrl(publication.url)) {
    errors.push("URL must be a valid HTTPS URL.");
  }

  if (!isValidIsoDateTime(publication.release_date)) {
    errors.push("Release date is invalid.");
  }

  if (
    isValidIsoDateTime(publication.release_date) &&
    !isReleaseTime0930(publication.release_date)
  ) {
    errors.push("Release date must be set to 09:30.");
  }

  if (!isValidDisplayDate(publication.display_date)) {
    errors.push("Display date is not in a supported format.");
  }

  if (!publication.org) {
    errors.push("Organisation is required.");
  } else if (
    allowedOrganisations.length > 0 &&
    !allowedOrganisations.includes(publication.org)
  ) {
    errors.push("Organisation is not recognised.");
  }

  if (!ALLOWED_STATUSES.includes(publication.status)) {
    errors.push("Invalid status.");
  }

  if (
    publication.status === "confirmed" &&
    dateType !== "exact"
  ) {
    errors.push(
      "Confirmed status requires an exact publication date."
    );
  }

  if (!isValidIsoDateTime(publication.updated)) {
    errors.push("Updated timestamp is invalid.");
  }

  return errors;
}

export function validatePublications(
  publications,
  {
    allowedOrganisations = []
  } = {}
) {
  const errors = [];

  if (!Array.isArray(publications)) {
    return ["Publication data is invalid."];
  }

  publications.forEach((publication, index) => {
    const rowNumber = index + 1;

    const missingFields = EXPECTED_FIELDS.filter(
      field => !(field in publication)
    );

    if (missingFields.length > 0) {
      errors.push(
        `Row ${rowNumber} is missing fields: ${missingFields.join(", ")}.`
      );
    }

    if (
      allowedOrganisations.length > 0 &&
      !allowedOrganisations.includes(publication.org)
    ) {
      errors.push(
        `Row ${rowNumber} has an unrecognised organisation.`
      );
    }

    if (!ALLOWED_STATUSES.includes(publication.status)) {
      errors.push(
        `Row ${rowNumber} has an invalid status.`
      );
    }

    if (!isValidIsoDateTime(publication.release_date)) {
      errors.push(
        `Row ${rowNumber} has an invalid release date.`
      );
    }

    if (
      isValidIsoDateTime(publication.release_date) &&
      !isReleaseTime0930(publication.release_date)
    ) {
      errors.push(
        `Row ${rowNumber} release date is not set to 09:30.`
      );
    }

    if (!isValidDisplayDate(publication.display_date)) {
      errors.push(
        `Row ${rowNumber} has an invalid display date.`
      );
    }
  });

  errors.push(...findDuplicateErrors(publications));

  return errors;
}

function isValidHttpsUrl(value) {
  try {
    const url = new URL(value);

    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function isValidIsoDateTime(value) {
  if (!value) {
    return false;
  }

  const date = new Date(value);

  return !Number.isNaN(date.getTime());
}

function isReleaseTime0930(value) {
  const match = value.match(
    /^\d{4}-\d{2}-\d{2}T09:30(?::00)?(?:Z|[+-]\d{2}:\d{2})?$/
  );

  return Boolean(match);
}

function isValidDisplayDate(value) {
  if (!value) {
    return false;
  }

  const exactDate =
    /^\d{1,2} [A-Za-z]+ \d{4}$/;

  const monthWindow =
    /^[A-Za-z]+ \d{4}$/;

  const twoMonthWindow =
    /^[A-Za-z]+ \d{4} to [A-Za-z]+ \d{4}$/;

  return (
    exactDate.test(value) ||
    monthWindow.test(value) ||
    twoMonthWindow.test(value)
  );
}

function findDuplicateErrors(publications) {
  const errors = [];
  const seen = new Map();

  publications.forEach((publication, index) => {
    const key = [
      publication.title?.trim().toLowerCase(),
      publication.display_date?.trim().toLowerCase(),
      publication.org?.trim().toLowerCase()
    ].join("|");

    if (seen.has(key)) {
      const firstIndex = seen.get(key);

      errors.push(
        `Rows ${firstIndex + 1} and ${index + 1} appear to be duplicate publications.`
      );
    } else {
      seen.set(key, index);
    }
  });

  return errors;
}