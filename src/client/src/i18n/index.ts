import { en, Messages } from './locales/en';
import { es } from './locales/es';

/**
 * Lightweight i18n: plain dictionaries per language, Spanish by default and
 * English as fallback for any missing key. Keys are dotted paths into the
 * English dictionary (e.g. `channels.columns.capacity`), so they are type
 * checked. Add new strings to `locales/en/<namespace>.ts` first, then to the
 * matching Spanish file.
 */

export const LANGUAGES = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: Language = 'es';
const STORAGE_KEY = 'thub-language';

type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };
export type PartialMessages = DeepPartial<Messages>;

type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${P}${K}`
    : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];

export type TranslationKey = Leaves<Messages>;
export type TranslationVars = Record<string, string | number>;

const dictionaries: Record<Language, PartialMessages> = { en, es };

const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some(l => l.code === value);

const readStoredLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(stored)) return stored;
  } catch {
    // Storage unavailable (private mode, previews)
  }
  return DEFAULT_LANGUAGE;
};

let currentLanguage: Language = readStoredLanguage();

export const getLanguage = (): Language => currentLanguage;

/** Locale for number/date formatting. */
export const getLocale = (): string =>
  currentLanguage === 'es' ? 'es-ES' : 'en-US';

/**
 * Persists the language and reloads, so every string (including memoised
 * table columns) is rendered again in the new language.
 */
export const setLanguage = (language: Language) => {
  if (!isLanguage(language) || language === currentLanguage) return;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Keep the change for this session only
  }
  currentLanguage = language;
  window.location.reload();
};

const lookup = (messages: PartialMessages, key: string): string | undefined => {
  let node: any = messages;
  for (const part of key.split('.')) {
    if (node == null || typeof node !== 'object') return undefined;
    node = node[part];
  }
  return typeof node === 'string' ? node : undefined;
};

const interpolate = (text: string, vars?: TranslationVars) =>
  vars
    ? text.replace(/\{(\w+)\}/g, (match, name) =>
        vars[name] !== undefined ? String(vars[name]) : match
      )
    : text;

export const translate = (
  language: Language,
  key: TranslationKey,
  vars?: TranslationVars
): string =>
  interpolate(
    lookup(dictionaries[language], key) ?? lookup(en, key) ?? key,
    vars
  );

/** Translate with the active language (usable outside React). */
export const t = (key: TranslationKey, vars?: TranslationVars): string =>
  translate(currentLanguage, key, vars);

export const useTranslation = () => ({
  t,
  language: currentLanguage,
  setLanguage,
});

if (typeof document !== 'undefined') {
  document.documentElement.lang = currentLanguage;
}
