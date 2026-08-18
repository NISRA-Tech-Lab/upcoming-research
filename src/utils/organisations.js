const ORG_NAMES_URL =
  "https://raw.githubusercontent.com/NISRA-Tech-Lab/latest-publications/refs/heads/main/lookups/org_names.R";

export async function loadOrganisations() {
  const response = await fetch(ORG_NAMES_URL);

  if (!response.ok) {
    throw new Error(`Unable to load organisations: HTTP ${response.status}`);
  }

  const text = await response.text();

  return parseOrganisations(text);
}

function parseOrganisations(text) {
  const organisations = [];

  const pattern = /"([^"]+)"\s*=\s*"([^"]+)"/g;

  let match;

  while ((match = pattern.exec(text)) !== null) {
    organisations.push({
      name: match[1],
      code: match[2]
    });
  }

  if (organisations.length === 0) {
    throw new Error("No organisations found in org_names.R");
  }

  return organisations;
}

export function populateOrganisationSelect(
  selectElement,
  organisations
) {
  selectElement.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose an organisation";

  selectElement.append(placeholder);

  for (const organisation of organisations) {
    const option = document.createElement("option");

    option.value = organisation.code;
    option.textContent = organisation.name;

    selectElement.append(option);
  }
}