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

/* ======================= USERNAME FIELD ======================= */
/* ============================================================== */
describe("Username field properties", () => {
  /**
   * This test checks if the username field is rendered correctly with the hardcoded attributes.
   */
  it("Renders the username hardcoded attributes correctly", async () => {
    /* ------------- RETRIEVE HTML ELEMENTS ------------- */
    const wrapper = mount(SignupForm, {
      global: {
        plugins: [vuetify],
      },
    });
    const usernameTextField = wrapper.findComponent({ ref: "usernameField" });
    const inputField = usernameTextField.find("input");

    /* ------------- CREATE TESTS ------------- */
    // input field
    expect(inputField.exists()).toBe(true);
    expect(inputField.attributes("required")).toBeDefined();

    // v-text-field
    expect(usernameTextField.props("label")).toBe("Username");
    expect(usernameTextField.props("counter")).toBe(20);
  });

  /**
   * This test checks if v-model is updating the username correctly.
   */
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

/* ======================= EMAIL FIELD ======================= */
/* =========================================================== */
describe("Email field properties", () => {
  /**
   * This test checks if the email field is rendered correctly with the hardcoded attributes.
   */
  it("Renders the email hardcoded attributes correctly", async () => {
    // Retrieve the HTML elements necessary for testing
    const wrapper = mount(SignupForm, {
      global: {
        plugins: [vuetify],
      },
    });
    const emailTextField = wrapper.findComponent({ ref: "emailField" });
    const inputField = emailTextField.find("input");

    /* ------------- CREATE TESTS ------------- */
    // input field
    expect(inputField.exists()).toBe(true);
    expect(inputField.attributes("required")).toBeDefined();

    // v-text-field
    expect(emailTextField.props("label")).toBe("E-mail");
    expect(emailTextField.props("type")).toBe("email");
  });
});

/* ======================= PASSWORD FIELD ======================= */
/* ============================================================== */

/* ======================= CONFIRM PASSWORD FIELD ======================= */
/* ====================================================================== */
