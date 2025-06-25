/* ======================= IMPORTS ======================= */
import Api from "./Api";

/* ======================= CONFIG ======================= */
export default {
  /**
   * Registers a new user account.
   *
   * @param {Object} userData - User data for account creation.
   * @param {string} userData.username - Username of the new user.
   * @param {string} userData.email - Email address of the new user.
   * @param {string} userData.password - Password for the new account.
   * @returns {Promise<import('axios').AxiosResponse>} Axios response promise.
   */
  signup(userData) {
    return Api().post("auth/signup", userData);
  },

  /**
   * Logs in an existing user with credentials.
   *
   * @param {Object} userData - User login data.
   * @param {string} userData.username - User's username.
   * @param {string} userData.password - User's password.
   * @returns {Promise<import('axios').AxiosResponse>} Axios response promise containing tokens or user info.
   */
  login(userData) {
    return Api().post("auth/login", userData);
  },

  /* Recover password */
  recoverPassword() {
    //TODO: Implement password recovery logic
  },
};
