/* ======================= IMPORTS ======================= */
// core
import { mount } from "@vue/test-utils";
import { describe, it, expect, vi } from "vitest";

// component
import SignupForm from "../../../src/components/auth/SignupForm.vue";
import vuetify from "@/plugins/vuetify";
/* ======================= CONFIG ======================= */
describe("Page text", () => {
  it("Renders the correct welcome message ", () => {
    const wrapper = mount(SignupForm);
    expect(wrapper.text()).toContain("Welcome toThe Signup Page");
  });

  it("Renders the correct form data", () => {
    const wrapper = mount(SignupForm);
    expect(wrapper.text()).toContain("Signup");
  });
});

describe("Username field properties", () => {
  it("Renders the username hardcoded fields correctly", async () => {
    // Define the fields used for testing
    const wrapper = mount(SignupForm, {
      global: {
        plugins: [vuetify],
      },
    });
    const usernameTextField = wrapper.findComponent({ name: "VTextField" });
    const inputField = wrapper.find("input#signupUsernamneField");

    /* --------------- Test the hardcoded attributes --------------- */
    expect(inputField.exists()).toBe(true);
    expect(usernameTextField.props("label")).toBe("Username");
    expect(usernameTextField.props("counter")).toBe(20);
    expect(inputField.attributes("required")).toBeDefined();
  });

  it("Executes v-model correctly", async () => {
    const updateUsernameSpy = vi.fn();

    const wrapper = mount(SignupForm, {
      global: {
        plugins: [vuetify],
      },
      props: {
        username: "",
        "onUpdate:username": updateUsernameSpy,
      },
    });

    const usernameTextField = wrapper.findComponent({ name: "VTextField" });
    await usernameTextField.setValue("updated_username");
    expect(updateUsernameSpy).toHaveBeenCalledWith("updated_username");
  });
});
