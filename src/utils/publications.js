import { parseCsv } from "./csv.js";

const CSV_URL =
  "https://raw.githubusercontent.com/NISRA-Tech-Lab/latest-publications/refs/heads/main/upcoming-research.csv";

export async function loadPublications() {
  const response = await fetch(CSV_URL);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const csv = await response.text();

  return parseCsv(csv);
}

const publicationList = document.querySelector("#publication-list");

export function renderPublications(
  publications,
  {
    onEdit,
    onRemove,
    canEdit = false
  } = {}
) {
  publicationList.replaceChildren();

  if (publications.length === 0) {
    publicationList.innerHTML = `
      <div class="alert alert-info">
        There are currently no upcoming research publications.
      </div>
    `;
    return;
  }

  publications.forEach((publication, index) => {
    const article = document.createElement("article");

    article.className = "card mb-3";

    article.innerHTML = `
      <div class="card-body">
        <h2 class="h5 card-title"></h2>

        <p class="mb-1">
          <strong>Date:</strong>
          <span class="publication-date"></span>
        </p>

        <p class="mb-1">
          <strong>Organisation:</strong>
          <span class="publication-org"></span>
        </p>

        <p class="mb-1">
          <strong>Status:</strong>
          <span class="publication-status"></span>
        </p>

        <p class="mb-3 text-secondary publication-summary"></p>

        <div class="d-flex gap-2">
          <button
            type="button"
            class="btn btn-outline-primary btn-sm edit-entry"
          >
            Edit
          </button>

          <button
            type="button"
            class="btn btn-outline-danger btn-sm remove-entry"
          >
            Remove
          </button>
        </div>
      </div>
    `;

    article.querySelector(".card-title").textContent =
      publication.title;

    article.querySelector(".publication-date").textContent =
      publication.display_date;

    article.querySelector(".publication-org").textContent =
      publication.org;

    article.querySelector(".publication-status").textContent =
      formatStatus(publication.status);

    article.querySelector(".publication-summary").textContent =
      publication.summary;

  const editButton = article.querySelector(".edit-entry");
  const removeButton = article.querySelector(".remove-entry");

  editButton.disabled = !canEdit;
  removeButton.disabled = !canEdit;

  editButton
    .addEventListener("click", () => {
      onEdit?.(publication, index);
    });

  removeButton
    .addEventListener("click", () => {
      onRemove?.(publication, index);
    });

    publicationList.append(article);
  });
}

function formatStatus(status) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}