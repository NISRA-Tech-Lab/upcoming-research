import {
  loadPublications,
  renderPublications
} from "./utils/publications.js";

import {
  loadOrganisations
} from "./utils/organisations.js";

import {
  initialisePublicationForm,
  openAddForm,
  openEditForm,
  setOrganisationOptions
} from "./modules/publicationForm.js";

import {
  stringifyCsv
} from "./utils/csv.js";

import {
  validatePublications
} from "./utils/validation.js";

const statusMessage = document.querySelector("#status-message");

let publications = [];
let allowedOrganisationCodes = [];

async function init() {
  try {
    const [
      loadedPublications,
      organisations
    ] = await Promise.all([
      loadPublications(),
      loadOrganisations()
    ]);

    publications = loadedPublications;

    // Store organisation codes for full dataset validation
    allowedOrganisationCodes = organisations.map(
      organisation => organisation.code
    );

    // Populate the organisation dropdown
    setOrganisationOptions(organisations);

    initialisePublicationForm({
      onSubmit: savePublication
    });

    document
      .querySelector("#add-entry")
      .addEventListener("click", openAddForm);

    render();

    statusMessage.textContent = "";
  } catch (error) {
    console.error(error);

    statusMessage.textContent =
      "Unable to load upcoming research publications.";

    statusMessage.classList.add("text-danger");
  }
}

function render() {
  renderPublications(publications, {
    onEdit: (publication, index) => {
      openEditForm(publication, index);
    },
    onRemove: removePublication
  });
}

function savePublication({ publication, editingIndex }) {
  const updatedPublications = [...publications];

  if (editingIndex === null) {
    updatedPublications.push(publication);
  } else {
    updatedPublications[editingIndex] = publication;
  }

  const errors = validatePublications(
    updatedPublications,
    {
      allowedOrganisations: allowedOrganisationCodes
    }
  );

  if (errors.length > 0) {
    alert(errors.join("\n"));
    return;
  }

  publications = updatedPublications;

  render();

  const csv = stringifyCsv(publications);
  console.log(csv);
}

function removePublication(publication, index) {
  const confirmed = window.confirm(
    `Remove "${publication.title}"?`
  );

  if (!confirmed) {
    return;
  }

  const updatedPublications = publications.filter(
    (_, publicationIndex) => publicationIndex !== index
  );

  const errors = validatePublications(
    updatedPublications,
    {
      allowedOrganisations: allowedOrganisationCodes
    }
  );

  if (errors.length > 0) {
    alert(errors.join("\n"));
    return;
  }

  publications = updatedPublications;

  render();

  const csv = stringifyCsv(publications);
  console.log(csv);
}

init();