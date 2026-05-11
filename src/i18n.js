// Global i18n helper — used by every component to look up translations
// without prop-drilling. Reads the current language from localStorage on
// each call so a language switch takes effect on the next render.
import { createTranslator } from "./lang.js";

export function getLang() {
  return localStorage.getItem("form16_lang") || "ru";
}

export function t(key, vars = {}) {
  return createTranslator(getLang())(key, vars);
}
