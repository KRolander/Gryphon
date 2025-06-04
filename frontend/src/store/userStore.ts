/* ======================= IMPORTS ======================= */
// store core
import { defineStore } from 'pinia';
import { get, set } from 'idb-keyval'
// types
import type { User } from '../types/User';

/* ======================= CONFIG ======================= */
export const useUserStore = defineStore('user', {
  state() {
    return {
      user: null as User,
    };
  },
  getters: {
    getUser: (state): User => state.user,
  },
  actions: {
    async setUser(user: User) {
      this.user = user;
      await set('user', user);
    },
    async loadUser() {
      const savedUser = await get<User>('user')
      if (savedUser) {
        this.user = savedUser
      }
    },
    clearUser() {
      this.user = null;
    },
  },
});
