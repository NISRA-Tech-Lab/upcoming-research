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

let publications = [];
let allowedOrganisationCodes = [];
let authenticatedUser = null;

async function init() {
  try {
    const callback =
      getGitHubCallbackParams();

    if (callback) {
      const token = await exchangeCodeForToken(
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
          loadedPublications,
          organisations
        ] = await Promise.all([
          loadPublications(),
          loadOrganisations()
        ]);

        publications = loadedPublications;

        allowedOrganisationCodes =
          organisations.map(
            organisation => organisation.code
          );

        setOrganisationOptions(organisations);
      }
    }

    if (authenticatedUser && isAuthorised) {
      const submitTest =
        await testSubmitAuthorisation();

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
}

async function savePublication({
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

  const csv =
    stringifyCsv(updatedPublications);

  try {
    const result = await submitChange({
      csv,
      action,
      title: publication.title
    });

    console.log(
      "Submission dry run:",
      result
    );

    publications = updatedPublications;
    render();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
}

async function removePublication(
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

  const csv =
    stringifyCsv(updatedPublications);

  try {
    const result = await submitChange({
      csv,
      action: "remove",
      title: publication.title
    });

    console.log(
      "Submission dry run:",
      result
    );

    publications = updatedPublications;
    render();
  } catch (error) {
    console.error(error);
    alert(error.message);
  }
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

init();