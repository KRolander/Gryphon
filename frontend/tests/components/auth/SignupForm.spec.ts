/* ======================= IMPORTS ======================= */
// core
import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";

// component
import SignupForm from "../../../src/components/auth/SignupForm.vue";
/* ======================= CONFIG ======================= */
describe("SignupForm.vue", () => {
  it("renders the correct message", () => {
    const wrapper = mount(SignupForm);
    expect(wrapper.text()).toContain("The Signup Page");
  });
});
