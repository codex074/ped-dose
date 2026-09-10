export type Lang = 'th' | 'en';

/** Translation function shape shared by the provider hook and the pure `translate()`. */
export type TFn = (key: string, params?: Record<string, string | number>) => string;
