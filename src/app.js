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

import {
  loginWithGitHub,
  getGitHubCallbackParams,
  exchangeCodeForToken,
  getAuthenticatedUser,
  logoutFromGitHub,
  hasVerifiedGovUkEmail,
  submitChange
} from "./utils/githubAuth.js";

const statusMessage = document.querySelector("#status-message");

const loginButton =
  document.querySelector("#github-login");

const userContainer =
  document.querySelector("#github-user");

const usernameElement =
  document.querySelector("#github-username");

const logoutButton =
  document.querySelector("#github-logout");

const addEntryButton =
  document.querySelector("#add-entry");

const publicationSection =
  document.querySelector("#publication-section");

const pendingChangesPanel =
  document.querySelector("#pending-changes-panel");

const pendingChangesList =
  document.querySelector("#pending-changes-list");

const submitChangesButton =
  document.querySelector("#submit-changes");

const discardChangesButton =
  document.querySelector("#discard-changes");

const submissionStatus =
  document.querySelector("#submission-status");

let publications = [];
let allowedOrganisationCodes = [];
let authenticatedUser = null;
let pendingChanges = [];
let sourceCsvSha = null;

async function init() {
  try {
    const callback =
      getGitHubCallbackParams();

    if (callback) {
      await exchangeCodeForToken(
        callback.code
      );
    }

    authenticatedUser =
      await getAuthenticatedUser();

    let isAuthorised = false;
    

    if (authenticatedUser) {
      isAuthorised =
        await hasVerifiedGovUkEmail();

      if (isAuthorised) {
        const [
          publicationData,
          organisations
        ] = await Promise.all([
          loadPublications(),
          loadOrganisations()
        ]);

        publications =
          publicationData.publications;

        sourceCsvSha =
          publicationData.sha;

        allowedOrganisationCodes =
          organisations.map(
            organisation => organisation.code
          );

        setOrganisationOptions(organisations);
      }
    }

    updateAuthenticationUi(
      authenticatedUser,
      isAuthorised
    );

    initialisePublicationForm({
      onSubmit: savePublication
    });

    addEntryButton.addEventListener(
      "click",
      openAddForm
    );

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
    onRemove: removePublication,
    canEdit: Boolean(authenticatedUser)
  });
  renderPendingChanges();
}

function savePublication({
  publication,
  editingIndex
}) {
  const updatedPublications = [...publications];

  const action =
    editingIndex === null
      ? "add"
      : "edit";

  if (editingIndex === null) {
    updatedPublications.push(publication);
  } else {
    updatedPublications[editingIndex] = publication;
  }

  const errors = validatePublications(
    updatedPublications,
    {
      allowedOrganisations:
        allowedOrganisationCodes
    }
  );

  if (errors.length > 0) {
    alert(errors.join("\n"));
    return;
  }

  publications = updatedPublications;

  pendingChanges.push({
    action,
    title: publication.title
  });

  render();
}

function removePublication(
  publication,
  index
) {
  const confirmed = window.confirm(
    `Remove "${publication.title}"?`
  );

  if (!confirmed) {
    return;
  }

  const updatedPublications =
    publications.filter(
      (_, publicationIndex) =>
        publicationIndex !== index
    );

  const errors = validatePublications(
    updatedPublications,
    {
      allowedOrganisations:
        allowedOrganisationCodes
    }
  );

  if (errors.length > 0) {
    alert(errors.join("\n"));
    return;
  }

  publications = updatedPublications;

  pendingChanges.push({
    action: "remove",
    title: publication.title
  });

  render();
}

loginButton.addEventListener(
  "click",
  loginWithGitHub
);

function updateAuthenticationUi(
  user,
  isAuthorised = false
) {
  authenticatedUser =
    user && isAuthorised
      ? user
      : null;

  if (user && isAuthorised) {
    loginButton.classList.add("d-none");
    userContainer.classList.remove("d-none");

    usernameElement.textContent =
      `@${user.login}`;

    addEntryButton.disabled = false;
    publicationSection.classList.remove("d-none");
  } else {
    loginButton.classList.toggle(
      "d-none",
      Boolean(user)
    );

    userContainer.classList.toggle(
      "d-none",
      !user
    );

    usernameElement.textContent =
      user
        ? `@${user.login} — no edit access`
        : "";

    addEntryButton.disabled = true;
    publicationSection.classList.add("d-none");
  }

  render();
}

logoutButton.addEventListener(
  "click",
  () => {
    logoutFromGitHub();
    updateAuthenticationUi(null);
  }
);

function renderPendingChanges() {
  pendingChangesList.replaceChildren();

  if (pendingChanges.length === 0) {
    pendingChangesPanel.classList.add("d-none");
    return;
  }

  pendingChangesPanel.classList.remove("d-none");

  for (const change of pendingChanges) {
    const item = document.createElement("li");

    const prefix =
      change.action === "add"
        ? "Added"
        : change.action === "edit"
          ? "Edited"
          : "Removed";

    item.textContent =
      `${prefix}: ${change.title}`;

    pendingChangesList.append(item);
  }
}

async function discardChanges() {
  const confirmed = window.confirm(
    "Discard all pending changes?"
  );

  if (!confirmed) {
    return;
  }

  try {
    const publicationData =
      await loadPublications();

    publications =
      publicationData.publications;

    sourceCsvSha =
      publicationData.sha;

    pendingChanges = [];

    render();
  } catch (error) {
    console.error(error);

    alert(
      "Unable to reload the current publications."
    );
  }
}

discardChangesButton.addEventListener(
  "click",
  discardChanges
);

async function submitPendingChanges() {
  if (pendingChanges.length === 0) {
    alert("There are no pending changes to submit.");
    return;
  }

  const csv =
    stringifyCsv(publications);

  submitChangesButton.disabled = true;
  discardChangesButton.disabled = true;

  submissionStatus.textContent =
    "Submitting changes...";

  try {
    await submitChange({
      csv,
      changes: pendingChanges,
      sourceSha: sourceCsvSha
    });

    pendingChanges = [];

    render();

    submissionStatus.textContent = "";

    alert(
      "Your changes have been submitted for review."
    );
  } catch (error) {
    console.error(error);

    submissionStatus.textContent = "";

    alert(
      error.message ??
      "Unable to submit changes for review."
    );
  } finally {
    submitChangesButton.disabled = false;
    discardChangesButton.disabled = false;
  }
}

submitChangesButton.addEventListener(
  "click",
  submitPendingChanges
);

init();