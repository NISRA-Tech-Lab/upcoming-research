const ALLOWED_STATUSES = [
  "provisional",
  "confirmed",
  "delayed"
];

export function validatePublication(publication, dateType) {
  const errors = [];

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

  return errors;
}