const MONTH_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric"
});

const EXACT_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric"
});

export function getDateValues(type, values) {
  if (type === "exact") {
    return getExactDateValues(values.exactDate);
  }

  if (type === "month") {
    return getMonthValues(values.month);
  }

  if (type === "range") {
    return getRangeValues(values.startMonth, values.endMonth);
  }

  throw new Error(`Unknown date type: ${type}`);
}

function getExactDateValues(value) {
  if (!value) {
    return null;
  }

  const date = parseDateInput(value);

  return {
    displayDate: EXACT_DATE_FORMATTER.format(date),
    releaseDate: toReleaseTimestamp(date)
  };
}

function getMonthValues(value) {
  if (!value) {
    return null;
  }

  const { year, month } = parseMonthInput(value);
  const lastDay = new Date(Date.UTC(year, month, 0));

  return {
    displayDate: MONTH_FORMATTER.format(lastDay),
    releaseDate: toReleaseTimestamp(lastDay)
  };
}

function getRangeValues(startValue, endValue) {
  if (!startValue || !endValue) {
    return null;
  }

  const start = parseMonthInput(startValue);
  const end = parseMonthInput(endValue);

  const startDate = new Date(
    Date.UTC(start.year, start.month - 1, 1)
  );

  const endDate = new Date(
    Date.UTC(end.year, end.month, 0)
  );

  if (endDate < startDate) {
    throw new Error("End month must not be earlier than start month.");
  }

  return {
    displayDate:
      `${MONTH_FORMATTER.format(startDate)} to ${MONTH_FORMATTER.format(endDate)}`,
    releaseDate: toReleaseTimestamp(endDate)
  };
}

function parseDateInput(value) {
  const [year, month, day] = value.split("-").map(Number);

  return new Date(Date.UTC(year, month - 1, day));
}

function parseMonthInput(value) {
  const [year, month] = value.split("-").map(Number);

  return { year, month };
}

function toReleaseTimestamp(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");

  return `${year}-${month}-${day}T09:30:00Z`;
}