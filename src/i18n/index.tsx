import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import thRaw from './ui.th.json';
import enRaw from './ui.en.json';
import type { Lang } from './types';

export type { Lang, TFn } from './types';

export const LANG_STORAGE_KEY = 'pedsdose.lang';

const th = thRaw as Record<string, string>;
const en = enRaw as Record<string, string>;
const tables: Record<Lang, Record<string, string>> = { th, en };
const warned = new Set<string>();

export function translate(
  lang: Lang,
  key: string,
  params?: Record<string, string | number>,
): string {
  let s = tables[lang][key] ?? tables.en[key];
  if (s === undefined) {
    if (import.meta.env.DEV && !warned.has(key)) {
      warned.add(key);
      console.warn(`[i18n] missing key: ${key}`);
    }
    return key;
  }
  if (params) for (const [k, v] of Object.entries(params)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

function readStored(): Lang | null {
  try {
    const v = localStorage.getItem(LANG_STORAGE_KEY);
    return v === 'th' || v === 'en' ? v : null;
  } catch {
    return null;
  }
}

const Ctx = createContext<{ lang: Lang; setLang: (l: Lang) => void } | null>(null);

export function LanguageProvider({
  children,
  initial,
}: {
  children: ReactNode;
  initial?: Lang;
}) {
  const [lang, setLangState] = useState<Lang>(() => initial ?? readStored() ?? 'th');
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const value = useMemo(() => ({ lang, setLang }), [lang, setLang]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang() {
  const v = useContext(Ctx);
  if (!v) throw new Error('useLang outside LanguageProvider');
  return v;
}

export function useT() {
  const { lang } = useLang();
  return useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang],
  );
}
