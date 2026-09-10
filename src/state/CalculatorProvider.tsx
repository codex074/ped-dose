import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { ViewId } from '@/clinical/filters';
import { LAST_KEY } from '@/hooks/useStarred';

export interface CalculatorState {
  weight: number | null;
  age: number | null;
  weightInput: string;
  ageInput: string;
  search: string;
  view: ViewId;
  selectedDrugId: string | null;
  expandedDetails: ReadonlySet<string>;
}

export interface CalculatorActions {
  setWeightInput(s: string): void;
  setAgeInput(s: string): void;
  setAgeFromYearsMonths(y: number, m: number): void;
  setSearch(s: string): void;
  setView(v: ViewId): void;
  selectDrug(id: string | null): void;
  toggleDetail(id: string): void;
  weightError: boolean;
  ageError: boolean;
}

/** '' -> {null,false}; NaN/<=0/>120 -> {null,true}. */
export function parseWeight(s: string): { value: number | null; error: boolean } {
  if (s.trim() === '') return { value: null, error: false };
  const n = Number(s);
  if (Number.isNaN(n) || n <= 0 || n > 120) return { value: null, error: true };
  return { value: n, error: false };
}

/** '' -> {null,false}; NaN/<0/>18 -> {null,true}. */
export function parseAge(s: string): { value: number | null; error: boolean } {
  if (s.trim() === '') return { value: null, error: false };
  const n = Number(s);
  if (Number.isNaN(n) || n < 0 || n > 18) return { value: null, error: true };
  return { value: n, error: false };
}

interface LastValues {
  weight: number | null;
  age: number | null;
}

/** Treats 0/falsy stored values as absent, like upstream. Wrapped in try/catch. */
function readLast(): LastValues {
  try {
    const raw = localStorage.getItem(LAST_KEY);
    if (!raw) return { weight: null, age: null };
    const parsed = JSON.parse(raw) as { weight?: number | null; age?: number | null };
    return {
      weight: parsed.weight ? parsed.weight : null,
      age: parsed.age ? parsed.age : null,
    };
  } catch {
    return { weight: null, age: null };
  }
}

function writeLast(weight: number | null, age: number | null): void {
  try {
    localStorage.setItem(LAST_KEY, JSON.stringify({ weight, age }));
  } catch {
    /* ignore */
  }
}

const Ctx = createContext<(CalculatorState & CalculatorActions) | null>(null);

export function CalculatorProvider(props: {
  children: ReactNode;
  initial?: Partial<CalculatorState>;
}) {
  const { children, initial } = props;

  const [weightInput, setWeightInput] = useState<string>(() => {
    if (initial?.weightInput !== undefined) return initial.weightInput;
    if (initial?.weight != null) return String(initial.weight);
    const stored = readLast().weight;
    return stored != null ? String(stored) : '';
  });
  const [ageInput, setAgeInput] = useState<string>(() => {
    if (initial?.ageInput !== undefined) return initial.ageInput;
    if (initial?.age != null) return String(initial.age);
    const stored = readLast().age;
    return stored != null ? String(stored) : '';
  });
  const [search, setSearch] = useState<string>(initial?.search ?? '');
  const [view, setView] = useState<ViewId>(initial?.view ?? 'all');
  const [selectedDrugId, setSelectedDrugId] = useState<string | null>(
    initial?.selectedDrugId ?? null,
  );
  const [expandedDetails, setExpandedDetails] = useState<ReadonlySet<string>>(
    initial?.expandedDetails ?? new Set(),
  );

  const { value: weight, error: weightError } = useMemo(
    () => parseWeight(weightInput),
    [weightInput],
  );
  const { value: age, error: ageError } = useMemo(() => parseAge(ageInput), [ageInput]);

  useEffect(() => {
    writeLast(weight, age);
  }, [weight, age]);

  const setAgeFromYearsMonths = useCallback((y: number, m: number) => {
    setAgeInput(String(y + m / 12));
  }, []);

  const selectDrug = useCallback((id: string | null) => {
    setSelectedDrugId(id);
  }, []);

  const toggleDetail = useCallback((id: string) => {
    setExpandedDetails((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const value = useMemo<CalculatorState & CalculatorActions>(
    () => ({
      weight,
      age,
      weightInput,
      ageInput,
      search,
      view,
      selectedDrugId,
      expandedDetails,
      setWeightInput,
      setAgeInput,
      setAgeFromYearsMonths,
      setSearch,
      setView,
      selectDrug,
      toggleDetail,
      weightError,
      ageError,
    }),
    [
      weight,
      age,
      weightInput,
      ageInput,
      search,
      view,
      selectedDrugId,
      expandedDetails,
      setAgeFromYearsMonths,
      selectDrug,
      toggleDetail,
      weightError,
      ageError,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCalculator(): CalculatorState & CalculatorActions {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useCalculator outside CalculatorProvider');
  return ctx;
}
