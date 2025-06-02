/* ======================= IMPORTS ======================= */
const { credentials } = require('@grpc/grpc-js');
const keycloakApiClient = require('../keycloakApiClient.js');

/* ======================= CONFIG ======================= */
/**
 * Creates a new user in Keycloak with the provided user data and realm name.
 * @param {object} userData - The data of the user to be created
 * @param {string} realmName - The name of the realm in which the user will be created
 * @param {string} adminAccessToken - The access token of the admin user
 */
async function createUser(userData, realmName, adminAccessToken) {
  // Create the parameters for the axios request
  const endpoint = `/admin/realms/users/${realmName}`;
  const body = {
    username: userData.username,
    email: userData.email,
    emailVerified: userData.emailVerified || false,
    credentials: [
      {
        type: 'password',
        value: userData.password,
        temporary: false, // Set to false to avoid requiring password change on first login
      },
    ],
    enabled: userData.enabled || true,
    requiredActions: userData.requiredActions || [],
    groups: userData.groups || [],
    // firstName: userData.firstName || '', // optional
    // lastName: userData.lastName || '', // optional
  };
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminAccessToken}`,
  };

  // Try creating the user
  try {
    const userCreationResponse = await keycloakApiClient.post(endpoint, body, {
      headers,
    });

    // Check that the response status is 201 - Created
    if (userCreationResponse.status === 201) {
      return userCreationResponse.data;
    }

    // Throw error if the user creation failed
    throw new Error(
      `User creation failed with status code: ${userCreationResponse.status}`
    );
  } catch (error) {
    throw new Error(
      `User Creation failed with the following error: ${error.message}`
    );
  }
}

/**
 * Logs in a user to Keycloak using the provided credentials.
 *
 * @param {object} userData - The data of the user to be logged in
 * @returns {string} The access token of the logged-in user
 * @throws {Error} If the login fails or the user is not found
 */
async function loginUser(userData, realmName) {
  // Create the parameters for the axios request
  const endpoint = `/realms/${realmName}/protocol/openid-connect/token`;
  const body = {
    client_id: 'admin-cli',
    username: userData.username,
    password: userData.password,
    grant_type: 'password',
    scope: 'openid',
  };
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded',
  };

  // Try logging the user
  try {
    const loginResponse = await keycloakApiClient.post(endpoint, body, {
      headers,
    });

    // Check that the response status is 200 - OK
    if (loginResponse.status !== 200) {
      throw new Error(`Login failed with status code: ${loginResponse.status}`);
    }

    const token = loginResponse.data.access_token;

    return token;
  } catch (error) {
    throw new Error(`Login failed with the following error: ${error.message}`);
  }
}

/**
 * Get a user's data from Keycloak using their access token.
 *
 * @param {string} userAccessToken - The access token of the user
 * @param {string} realmName - The name of the realm in which the user exists
 * @returns {object} The user's data
 * @throws {Error} If the request fails or the user is not found
 */
async function getUserData(userAccessToken, realmName) {
  const endpoint = `/realms/${realmName}/protocol/openid-connect/userinfo`;
  const headers = {
    Authorization: `Bearer ${userAccessToken}`,
  };

  console.log(userAccessToken);

  try {
    const getUserDataResponse = await keycloakApiClient.get(endpoint, {
      headers,
    });

    // Check that the response status is 200 - OK
    if (getUserDataResponse.status !== 200) {
      throw new Error(
        `User data fetch failed with status code: ${loginResponse.status}`
      );
    }

    // console.log('User Data:', getUserDataResponse.data);

    return getUserDataResponse.data;
  } catch (error) {
    throw new Error(
      `Fetching user data failed with the following error:\n ${error.message}`
    );
  }
}

module.exports = {
  createUser,
  loginUser,
  getUserData,
};
