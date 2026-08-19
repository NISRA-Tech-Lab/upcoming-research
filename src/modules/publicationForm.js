import {
  getDateValues,
  parseDisplayDate
} from "../utils/dates.js";

const modalElement = document.querySelector("#publication-modal");
const publicationModal = new bootstrap.Modal(modalElement);

const publicationForm = document.querySelector("#publication-form");
const modalTitle = document.querySelector("#publication-modal-title");

const titleInput = document.querySelector("#title");
const summaryInput = document.querySelector("#summary");
const urlInput = document.querySelector("#url");
const organisationInput = document.querySelector("#organisation");
const statusInput = document.querySelector("#status");

const exactDateFields = document.querySelector("#exact-date-fields");
const monthDateFields = document.querySelector("#month-date-fields");
const rangeDateFields = document.querySelector("#range-date-fields");

const exactDateInput = document.querySelector("#exact-date");
const monthInput = document.querySelector("#publication-month");
const rangeStartInput = document.querySelector("#range-start");
const rangeEndInput = document.querySelector("#range-end");

const displayDatePreview =
  document.querySelector("#display-date-preview");

const releaseDatePreview =
  document.querySelector("#release-date-preview");

let editingIndex = null;
let submitHandler = null;

export function initialisePublicationForm({ onSubmit }) {
  submitHandler = onSubmit;

  document
    .querySelectorAll('input[name="date-type"]')
    .forEach(input => {
      input.addEventListener("change", () => {
        updateDateFields();
        updateDatePreview();
      });
    });

  [
    exactDateInput,
    monthInput,
    rangeStartInput,
    rangeEndInput
  ].forEach(input => {
    input.addEventListener("change", updateDatePreview);
  });

  publicationForm.addEventListener("submit", handleSubmit);
}

export function openAddForm() {
  editingIndex = null;

  modalTitle.textContent = "Add publication";

  publicationForm.reset();
  publicationForm.classList.remove("was-validated");

  document.querySelector("#date-type-exact").checked = true;

  updateDateFields();
  updateDatePreview();

  publicationModal.show();
}

export function openEditForm(publication, index) {
  editingIndex = index;

  modalTitle.textContent = "Edit publication";

  publicationForm.reset();
  publicationForm.classList.remove("was-validated");

  titleInput.value = publication.title;
  summaryInput.value = publication.summary;
  urlInput.value = publication.url;
  organisationInput.value = publication.org;
  statusInput.value = publication.status;

  const parsedDate = parseDisplayDate(publication.display_date);

  document.querySelector(
    `input[name="date-type"][value="${parsedDate.type}"]`
  ).checked = true;

  exactDateInput.value = "";
  monthInput.value = "";
  rangeStartInput.value = "";
  rangeEndInput.value = "";

  if (parsedDate.type === "exact") {
    exactDateInput.value = parsedDate.exactDate;
  }

  if (parsedDate.type === "month") {
    monthInput.value = parsedDate.month;
  }

  if (parsedDate.type === "range") {
    rangeStartInput.value = parsedDate.startMonth;
    rangeEndInput.value = parsedDate.endMonth;
  }

  updateDateFields();
  updateDatePreview();

  publicationModal.show();
}

function handleSubmit(event) {
  event.preventDefault();

  if (!publicationForm.checkValidity()) {
    publicationForm.classList.add("was-validated");
    return;
  }

  let dateValues;

  try {
    dateValues = getCurrentDateValues();
  } catch (error) {
    alert(error.message);
    return;
  }

  if (!dateValues) {
    alert("Choose a publication date.");
    return;
  }

  const publication = {
    title: titleInput.value.trim(),
    summary: summaryInput.value.trim(),
    url: urlInput.value.trim(),
    release_date: dateValues.releaseDate,
    display_date: dateValues.displayDate,
    org: organisationInput.value,
    updated: new Date().toISOString(),
    status: statusInput.value
  };

  submitHandler?.({
    publication,
    editingIndex
  });

  publicationModal.hide();
}

function updateDateFields() {
  const type = getSelectedDateType();

  exactDateFields.classList.toggle("d-none", type !== "exact");
  monthDateFields.classList.toggle("d-none", type !== "month");
  rangeDateFields.classList.toggle("d-none", type !== "range");
}

function updateDatePreview() {
  try {
    const values = getCurrentDateValues();

    if (!values) {
      displayDatePreview.textContent = "—";
      releaseDatePreview.textContent = "—";
      return;
    }

    displayDatePreview.textContent = values.displayDate;
    releaseDatePreview.textContent = values.releaseDate;
  } catch {
    displayDatePreview.textContent = "Invalid date selection";
    releaseDatePreview.textContent = "—";
  }
}

function getCurrentDateValues() {
  return getDateValues(
    getSelectedDateType(),
    {
      exactDate: exactDateInput.value,
      month: monthInput.value,
      startMonth: rangeStartInput.value,
      endMonth: rangeEndInput.value
    }
  );
}

function getSelectedDateType() {
  return document.querySelector(
    'input[name="date-type"]:checked'
  ).value;
}

export function setOrganisationOptions(organisations) {
  organisationInput.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose an organisation";

  organisationInput.append(placeholder);

  for (const organisation of organisations) {
    const option = document.createElement("option");

    option.value = organisation.code;
    option.textContent = organisation.name;

    organisationInput.append(option);
  }
}