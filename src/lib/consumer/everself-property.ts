/** Active consumer property name check (SpaceGTM Everself demo). */
export function isEverselfPropertyName(name: string | null | undefined): boolean {
  return (name ?? '').trim().toLowerCase() === 'everself';
}
