# Upcoming Research

[nisra-tech-lab.github.io/upcoming-research](https://nisra-tech-lab.github.io/upcoming-research/)

Web application for maintaining the upcoming research publications data used by the NISRA publications system.

## Application

The application is deployed using GitHub Pages.

Users sign in with GitHub and must have a verified `.gov.uk` email address before they can view or edit the upcoming research data.

Users can:

- add publications
- edit publications
- remove publications
- make multiple changes before submitting them
- discard pending changes

Submitting changes does not modify the live data directly.

## How submissions work

The application reads the current `upcoming-research.csv` from the
`NISRA-Tech-Lab/latest-publications` repository.

Changes are made in the browser until the user selects **Submit changes for review**.

The application then sends the updated CSV and a summary of the changes to a Cloudflare Worker.

The Worker:

1. verifies the GitHub user and their verified `.gov.uk` email address
2. checks that `upcoming-research.csv` has not changed since the user loaded it
3. creates a new branch in `NISRA-Tech-Lab/latest-publications`
4. commits the updated `upcoming-research.csv` to that branch
5. opens a pull request against `main`

The live `main` branch is therefore not changed until the pull request is reviewed and merged.

## Repositories

### `upcoming-research`

Contains the GitHub Pages application.

Key areas include:

- `app.js` – application state and UI workflow
- `modules/` – application UI modules
- `utils/` – CSV, publication, organisation, validation and GitHub authentication utilities

### `latest-publications`

Contains the publication data and the existing publication processing workflow.

The upcoming research application modifies:

`upcoming-research.csv`

Changes from the application arrive as pull requests and should be reviewed before merging.

The repository also contains GitHub Actions used by the existing publications process. Some of these workflows push generated changes directly to `main`, so this should be considered before changing branch protection rules.

## Authentication

GitHub OAuth is used for user sign-in.

A Cloudflare Worker handles server-side authentication and GitHub API operations. GitHub App credentials and OAuth secrets are stored as Cloudflare secrets and must not be committed to either repository.

## Reviewing submissions

For normal maintenance:

1. Open the pull request created by the application.
2. Review the changes to `upcoming-research.csv`.
3. Merge the pull request if the changes are valid.
4. Close the pull request without merging if the changes should not be accepted.

The submission branch can be deleted after the pull request is merged or closed.
