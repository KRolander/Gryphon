/* ======================= IMPORTS ======================= */
// store core
import { defineStore } from 'pinia';
import { del, get, set } from 'idb-keyval';

// types
import type { User } from '../types/User';

// utils
import { deleteSessionKey } from '../utils/crypto';

/* ======================= CONFIG ======================= */
export const useUserStore = defineStore('user', {
  state() {
    return {
      user: null as User,
    };
  },
  getters: {
    getUser: (state): User => state.user,
    getUsername: (state): string => state.user.username,
    getEmail: (state): string => state.user.email,
  },
  actions: {
    /**
     * Sets the value of the user in the store
     * @param user The new value of the user variable
     */
    async setUser(user: User) {
      this.user = user;
      await set('user', user);
    },

    /**
     * Loads the user from the Index DB
     */
    async loadUser() {
      const savedUser = await get<User>('user');
      if (savedUser) {
        this.user = savedUser;
      }
    },

    /**
     * Resets the value of the user variable to null
     * ! ONLY TO BE USED BY LOGOUT !
     */
    async clearUser() {
      // Reset the local user
      this.user = null;

      // Delete the session
      await del('user');
    },

    /**
     * Log out the user. This process implies:
     * 1. Deleting the access_token from localStorage
     * 2. Deleting the session key from IndexDB
     */
    async logout() {
      // Check if the user is null
      if (!this.user) throw new Error('There is no user in the store');

      // I. Delete the access_token from localStorage
      localStorage.removeItem('access_token');

      // II. Delete the session key from IndexDB
      await deleteSessionKey(this.user.id);

      await this.clearUser();

      // Send the user back to the login page
      this.$router.push({ name: 'auth' });
    },
  },
});
