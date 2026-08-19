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

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export function parseDisplayDate(displayDate) {
  if (!displayDate) {
    throw new Error("Display date is empty.");
  }

  const rangeMatch = displayDate.match(
    /^([A-Za-z]+)\s+(\d{4})\s+to\s+([A-Za-z]+)\s+(\d{4})$/
  );

  if (rangeMatch) {
    const [, startMonthName, startYear, endMonthName, endYear] = rangeMatch;

    return {
      type: "range",
      startMonth: toMonthInput(startMonthName, startYear),
      endMonth: toMonthInput(endMonthName, endYear)
    };
  }

  const monthMatch = displayDate.match(
    /^([A-Za-z]+)\s+(\d{4})$/
  );

  if (monthMatch) {
    const [, monthName, year] = monthMatch;

    return {
      type: "month",
      month: toMonthInput(monthName, year)
    };
  }

  const exactMatch = displayDate.match(
    /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/
  );

  if (exactMatch) {
    const [, day, monthName, year] = exactMatch;

    const monthIndex = getMonthIndex(monthName);

    return {
      type: "exact",
      exactDate: [
        year,
        String(monthIndex + 1).padStart(2, "0"),
        String(day).padStart(2, "0")
      ].join("-")
    };
  }

  throw new Error(`Unrecognised display date: ${displayDate}`);
}

function toMonthInput(monthName, year) {
  const monthIndex = getMonthIndex(monthName);

  return `${year}-${String(monthIndex + 1).padStart(2, "0")}`;
}

function getMonthIndex(monthName) {
  const monthIndex = MONTHS.findIndex(
    month => month.toLowerCase() === monthName.toLowerCase()
  );

  if (monthIndex === -1) {
    throw new Error(`Invalid month: ${monthName}`);
  }

  return monthIndex;
}