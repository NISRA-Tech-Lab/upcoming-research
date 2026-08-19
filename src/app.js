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
} from "./utils/csv.js"

const statusMessage = document.querySelector("#status-message");

let publications = [];

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
  if (editingIndex === null) {
    publications.push(publication);
  } else {
    publications[editingIndex] = publication;
  }

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

  publications.splice(index, 1);

  render();

  const csv = stringifyCsv(publications);
  console.log(csv);
}

init();