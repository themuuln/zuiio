import DefaultTheme from "vitepress/theme";
import "./style.css";
import TutorialStep from "./components/TutorialStep.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("TutorialStep", TutorialStep);
  },
};
