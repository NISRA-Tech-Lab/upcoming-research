const CLIENT_ID = "Iv23ct4v4O55j4eNDlPG";

const REDIRECT_URI =
  "https://nisra-tech-lab.github.io/upcoming-research/";

const TOKEN_KEY = "github_access_token";
const STATE_KEY = "github_oauth_state";

const AUTH_ENDPOINT = "https://upcoming-research-auth.brian-quinn.workers.dev/";

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

export async function exchangeCodeForToken(code) {
  const response = await fetch(AUTH_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      code,
      redirect_uri: REDIRECT_URI
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.error ??
      "Unable to complete GitHub authentication."
    );
  }

  if (!data.access_token) {
    throw new Error(
      "GitHub did not return an access token."
    );
  }

  sessionStorage.setItem(
    TOKEN_KEY,
    data.access_token
  );

  sessionStorage.removeItem(STATE_KEY);

  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );

  return data.access_token;
}

export async function getAuthenticatedUser() {
  const token = getAccessToken();

  console.log(
    "Token available to getAuthenticatedUser:",
    Boolean(token)
  );

  if (!token) {
    return null;
  }

  const response = await fetch(
    "https://api.github.com/user",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    }
  );

  console.log(
    "GitHub /user response status:",
    response.status
  );

  if (response.status === 401) {
    logoutFromGitHub();
    return null;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to retrieve GitHub user: HTTP ${response.status}`
    );
  }

  const user = await response.json();

  console.log(
    "Authenticated GitHub user:",
    user.login
  );

  return user;
}

export async function hasVerifiedGovUkEmail() {
  const token = getAccessToken();

  if (!token) {
    return false;
  }

  const response = await fetch(
    "https://api.github.com/user/emails",
    {
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28"
      }
    }
  );

  if (response.status === 401) {
    logoutFromGitHub();
    return false;
  }

  if (!response.ok) {
    throw new Error(
      `Unable to retrieve GitHub email addresses: HTTP ${response.status}`
    );
  }

  const emails = await response.json();

  return emails.some(email =>
    email.verified === true &&
    email.email.toLowerCase().endsWith(".gov.uk")
  );
}