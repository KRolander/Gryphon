/* ======================= IMPORTS ======================= */
// store core
import { defineStore } from 'pinia';

// types
import type { User } from '../types/User';

/* ======================= CONFIG ======================= */
export const usUserStore = defineStore('user', {
  state() {
    return {
      user: null as User,
    };
  },
  getters: {
    getUser: (state): User => state.user,
  },
  actions: {
    setUser(user: User) {
      this.user = user;
    },
    clearUser() {
      this.user = null;
    },
  },
});
