import { useState } from 'react';

export type HeaderView = 'new' | 'reports' | 'demo' | 'profile';

type AppHeaderProps = {
  activeView: HeaderView;
  reportCount: number;
  isAuthenticated: boolean;
  accountLabel: string;
  onNavigate: (view: HeaderView) => void;
  onAuth: (intent: 'register' | 'login') => void;
};

const links: { id: Exclude<HeaderView, 'profile'>; label: string }[] = [
  { id: 'new', label: 'Новый анализ' },
  { id: 'reports', label: 'Мои отчёты' },
  { id: 'demo', label: 'Демо-анализ' },
];

export function AppHeader({ activeView, reportCount, isAuthenticated, accountLabel, onNavigate, onAuth }: AppHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = (view: HeaderView) => {
    onNavigate(view);
    setMenuOpen(false);
  };
  const initial = accountLabel.trim().charAt(0).toUpperCase() || 'C';

  return <header className="app-header">
    <button className="brand" type="button" onClick={() => navigate('new')} aria-label="ClientLens: новый анализ"><i>CL</i><span>Client<span>Lens</span></span></button>
    <button className="menu-toggle" type="button" aria-label="Открыть навигацию" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>Меню</button>
    <nav className={`header-nav ${menuOpen ? 'open' : ''}`} aria-label="Основная навигация">
      {links.map((link) => <button key={link.id} className={activeView === link.id ? 'selected' : ''} type="button" onClick={() => navigate(link.id)}>{link.label}{link.id === 'reports' && reportCount > 0 ? <small>{reportCount}</small> : null}</button>)}
    </nav>
    <div className="header-actions">
      {isAuthenticated ? <button className="header-account" type="button" onClick={() => navigate('profile')}><span className="header-avatar" aria-hidden="true">{initial}</span><span>Аккаунт</span></button> : <><button className="header-register" type="button" onClick={() => onAuth('register')}>Регистрация</button><button className="header-login" type="button" onClick={() => onAuth('login')}>Вход</button></>}
    </div>
  </header>;
}
