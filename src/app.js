import {
  loadPublications,
  renderPublications
} from "./utils/publications.js";

import {
  initialisePublicationForm,
  openAddForm,
  openEditForm
} from "./modules/publicationForm.js";

const statusMessage = document.querySelector("#status-message");

let publications = [];

async function init() {
  try {
    publications = await loadPublications();

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
}

init();