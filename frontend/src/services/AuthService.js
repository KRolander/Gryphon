/* ======================= IMPORTS ======================= */
import Api from "./Api";

/* ======================= CONFIG ======================= */
export default {
  /* Create a new account for the user */
  signup(userData) {
    return Api().post("auth/signup", userData);
  },

  /* Login the user */
  login(userData) {
    return Api().post("auth/login", userData);
  },

  /* Recover password */
  recoverPassword() {
    //TODO: Implement password recovery logic
  },
};
