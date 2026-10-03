import { en } from './locales/en';
import { es } from './locales/es';

const leaves = (node: object, prefix = ''): string[] =>
  Object.entries(node).flatMap(([key, value]) =>
    typeof value === 'string'
      ? [`${prefix}${key}`]
      : leaves(value, `${prefix}${key}.`)
  );

describe('locales', () => {
  it('Spanish has exactly the English keys', () => {
    const english = leaves(en).sort();
    const spanish = leaves(es).sort();
    expect(spanish).toEqual(english);
  });

  it('keeps the same {placeholders} in both languages', () => {
    const get = (obj: any, key: string) =>
      key.split('.').reduce((n, part) => n?.[part], obj) as string;
    const vars = (s: string) => (s.match(/\{\w+\}/g) || []).sort();

    for (const key of leaves(en)) {
      expect([key, vars(get(es, key))]).toEqual([key, vars(get(en, key))]);
    }
  });
});
