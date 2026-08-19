const CLIENT_ID = "Iv23ct4v4O55j4eNDlPG";

const REDIRECT_URI =
  "https://nisra-tech-lab.github.io/upcoming-research/";

const TOKEN_KEY = "github_access_token";
const STATE_KEY = "github_oauth_state";

export function loginWithGitHub() {
  const state = generateRandomString();

  sessionStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    state
  });

  window.location.href =
    `https://github.com/login/oauth/authorize?${params.toString()}`;
}

export function getAccessToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function logoutFromGitHub() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(STATE_KEY);
}

function generateRandomString() {
  const values = new Uint32Array(8);

  crypto.getRandomValues(values);

  return Array.from(
    values,
    value => value.toString(16).padStart(8, "0")
  ).join("");
}

export function getGitHubCallbackParams() {
  const params = new URLSearchParams(
    window.location.search
  );

  const code = params.get("code");
  const returnedState = params.get("state");

  if (!code) {
    return null;
  }

  const expectedState =
    sessionStorage.getItem(STATE_KEY);

  if (
    !returnedState ||
    returnedState !== expectedState
  ) {
    throw new Error(
      "GitHub authentication state did not match."
    );
  }

  return {
    code,
    state: returnedState
  };
}