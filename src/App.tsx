import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ProfileAnalyzer } from './analyzers/profile-analyzer';
import { AccountPanel } from './auth/AccountPanel';
import { toProfilePresentation, type ProfilePresentation } from './auth/profile-presentation';
import { supabase } from './auth/supabase';
import { requestAnalysis, type AnalysisRequest } from './api/analyze';
import { AppHeader, type HeaderView } from './components/AppHeader';
import { Dashboard } from './components/Dashboard';
import { LegalPage, type LegalKind } from './components/LegalPage';
import { ProfileForm } from './components/ProfileForm';
import { demoAudit } from './data/demo-report';
import type { ProfileAudit } from './domain/profile';
import { getAnalysisPrice } from './domain/pricing';
import { deleteCloudReport, listCloudReports, saveCloudReport } from './storage/cloud-report-store';
import { deleteReport, listReports, saveReport, type SavedReport } from './storage/report-store';
import { canUseFreeLuna, consumeFreeLuna } from './storage/usage';
import { saveView } from './storage/view-store';
import { pathForPublicPage } from './legal/public-pages';
import { initialViewFromPath } from './legal/initial-view';

type View = 'new' | 'reports' | 'demo' | 'profile' | LegalKind;

const getInitialView = (): View => initialViewFromPath(window.location.pathname);

export default function App() {
  const [view, setView] = useState<View>(getInitialView);
  const [audit, setAudit] = useState<ProfileAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<SavedReport[]>(listReports());
  const [notice, setNotice] = useState('');
  const [session, setSession] = useState<Session | null>(null);
  const [authIntent, setAuthIntent] = useState<'login' | 'register'>('login');
  const [profileIdentity, setProfileIdentity] = useState<ProfilePresentation | null>(null);
  const [identityReady, setIdentityReady] = useState(true);

  const refreshProfileIdentity = async () => {
    if (!supabase || !session) {
      setProfileIdentity(null);
      setIdentityReady(true);
      return;
    }
    setIdentityReady(false);
    const { data } = await supabase.from('profiles').select('nickname, avatar_path').eq('id', session.user.id).maybeSingle();
    const avatarUrl = data?.avatar_path ? supabase.storage.from('avatars').getPublicUrl(data.avatar_path).data.publicUrl : '';
    setProfileIdentity(toProfilePresentation(data, avatarUrl));
    setIdentityReady(true);
  };

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    void listCloudReports(session.user.id).then((cloudReports) => {
      if (cloudReports.length) setReports(cloudReports);
    });
  }, [session]);
  useEffect(() => { void refreshProfileIdentity(); }, [session]);
  useEffect(() => {
    saveView(view);
    const publicPage = ['pricing', 'offer', 'contacts'].includes(view) ? view as 'pricing' | 'offer' | 'contacts' : null;
    window.history.replaceState(null, '', publicPage ? pathForPublicPage(publicPage) : '/');
  }, [view]);

  const saveAndOpen = (request: AnalysisRequest, report: ProfileAudit) => {
    setAudit(report);
    const saved = saveReport({
      title: request.profile.title || request.profile.specialization || 'Новый аудит',
      mode: request.mode,
      model: request.model,
      input: request.profile,
      audit: report,
    });
    if (session) void saveCloudReport(session.user.id, saved);
    setReports((old) => [saved, ...old]);
    setView('reports');
  };

  const analyze = async (request: AnalysisRequest) => {
    if (!session) {
      setNotice('Чтобы запустить анализ, войдите или создайте аккаунт.');
      setAuthIntent('register');
      setView('profile');
      return;
    }

    if (request.model !== 'gpt-5.6-luna' || !canUseFreeLuna()) {
      const local = {
        ...new ProfileAnalyzer().analyze(request.profile),
        analysisMode: 'basic' as const,
        analysisSummary: `AI-анализ стоит ${getAnalysisPrice(request.mode, request.model)} ₽; сейчас сформирован бесплатный базовый отчёт.`,
      };
      setNotice(local.analysisSummary);
      saveAndOpen(request, local);
      return;
    }

    setNotice('');
    setLoading(true);
    try {
      const result = await requestAnalysis(request, session.access_token);
      if (result.mode === 'ai') consumeFreeLuna();
      if (result.notice) setNotice(result.notice);
      saveAndOpen(request, result.audit);
    } catch {
      const local = {
        ...new ProfileAnalyzer().analyze(request.profile),
        analysisMode: 'basic' as const,
        analysisSummary: 'AI-анализ недоступен: используем бесплатный базовый отчёт.',
      };
      setNotice(local.analysisSummary);
      saveAndOpen(request, local);
    } finally {
      setLoading(false);
    }
  };

  const openDemo = () => {
    setAudit(demoAudit());
    setView('demo');
  };
  const navigate = (next: HeaderView) => {
    if (next === 'demo') openDemo();
    else setView(next);
  };
  const activeHeaderView: HeaderView = view === 'reports' || view === 'demo' || view === 'profile' ? view : 'new';

  return <main className="app">
    <AppHeader activeView={activeHeaderView} reportCount={reports.length} isAuthenticated={Boolean(session)} accountLabel={profileIdentity?.nickname ?? ''} avatarUrl={profileIdentity?.avatarUrl ?? ''} identityReady={identityReady} onNavigate={navigate} onAuth={(intent) => { setAuthIntent(intent); setView('profile'); }} />
    <section className="content">
      {loading ? <Loading /> : view === 'new' ? <ProfileForm onAnalyze={analyze} onDemo={openDemo} notice={notice} /> : null}
      {!loading && view === 'reports' ? <Reports reports={reports} onOpen={(report) => { setAudit(report.audit); setView('demo'); }} onDelete={(id) => { deleteReport(id); if (session) void deleteCloudReport(id); setReports(listReports()); }} onNew={() => setView('new')} /> : null}
      {!loading && view === 'demo' && audit ? <Dashboard audit={audit} onRestart={() => setView('new')} /> : null}
      {!loading && view === 'profile' ? session ? <><AccountPanel mode="profile" onProfileChanged={refreshProfileIdentity} /><AccountPanel mode="settings" onProfileChanged={refreshProfileIdentity} /></> : <AccountPanel initialScreen={authIntent} /> : null}
      {!loading && (view === 'privacy' || view === 'terms' || view === 'pricing' || view === 'offer' || view === 'contacts') ? <LegalPage kind={view} onBack={() => setView('new')} /> : null}
    </section>
    <footer className="site-footer"><button type="button" onClick={() => setView('pricing')}>Цены</button><button type="button" onClick={() => setView('offer')}>Оферта</button><button type="button" onClick={() => setView('contacts')}>Контакты</button><button type="button" onClick={() => setView('privacy')}>Конфиденциальность</button><button type="button" onClick={() => setView('terms')}>Условия</button></footer>
  </main>;
}

function Loading() {
  return <div className="loading"><i /><p className="eyebrow">Анализируем профиль</p><h2>Собираем данные и карту доверия</h2><span>Если площадка или AI недоступны, подготовим базовый отчёт.</span></div>;
}

function Reports({ reports, onOpen, onDelete, onNew }: { reports: SavedReport[]; onOpen: (report: SavedReport) => void; onDelete: (id: string) => void; onNew: () => void }) {
  return <section className="reports-view"><div className="view-head"><div><p className="eyebrow">История анализов</p><h1>Мои отчёты</h1><p>Откройте сохранённый аудит или удалите неактуальный.</p></div><button className="primary" onClick={onNew}>+ Новый анализ</button></div>{reports.length ? <div className="reports-grid">{reports.map((report) => <article className="report-card" key={report.id}><div><span className="report-mode">{report.mode}</span><h3>{report.title}</h3><small>{new Date(report.createdAt).toLocaleDateString('ru-RU')} · {report.model.replace('gpt-5.6-', '')}</small></div><strong>{report.audit.score}</strong><div><button className="secondary" onClick={() => onOpen(report)}>Открыть</button><button className="icon-button" aria-label="Удалить отчёт" onClick={() => onDelete(report.id)}>×</button></div></article>)}</div> : <Empty title="Отчётов пока нет" text="Запустите первый анализ или посмотрите демо-отчёт." />}</section>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <section className="empty"><div>✦</div><h1>{title}</h1><p>{text}</p></section>;
}
