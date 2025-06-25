// Vuetify
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

// Styles
import "@mdi/font/css/materialdesignicons.css";
import "vuetify/styles";

/**
 * Initializes and exports a Vuetify instance with global configuration.
 *
 * Includes all Vuetify components and directives, and sets the default theme.
 *
 * @returns {import("vuetify").Vuetify} Vuetify instance configured with components, directives, and themes.
 **/
export default createVuetify({
  components,
  directives,
  theme: {
    defaultTheme: "light",
  },
});
