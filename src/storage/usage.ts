const FREE_LUNA_KEY = 'freelance-trust:free-luna-used';

export function canUseFreeLuna(): boolean {
  return localStorage.getItem(FREE_LUNA_KEY) !== 'true';
}

export function consumeFreeLuna(): void {
  localStorage.setItem(FREE_LUNA_KEY, 'true');
}
