import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, test, vi } from 'vitest';
import App from '@/App';

afterEach(() => {
  vi.unstubAllGlobals();
});

test('renders the app title', async () => {
  const dataPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../public/data/peds_drugs.json',
  );
  const json: unknown = JSON.parse(readFileSync(dataPath, 'utf-8'));
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(json),
      }),
    ),
  );

  render(<App />);
  await waitFor(() => expect(screen.getByText('PedsDose')).toBeInTheDocument());
});
