/** French count + noun: the singular is used for 0 and 1 (« 0 leçon », « 1 leçon », « 2 leçons »). */
export function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n >= 2 ? pluralForm : singular}`;
}
