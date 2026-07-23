import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { KworkAnalyzer } from './analyzers/kwork-analyzer';
import { AccountPanel } from './auth/AccountPanel';
import { supabase } from './auth/supabase';
import { requestAnalysis, type AnalysisRequest } from './api/analyze';
import { Dashboard } from './components/Dashboard';
import { LegalPage } from './components/LegalPage';
import { ProfileForm } from './components/ProfileForm';
import { demoAudit } from './data/demo-report';
import type { ProfileAudit } from './domain/profile';
import { getAnalysisPrice } from './domain/pricing';
import { deleteReport, listReports, saveReport, type SavedReport } from './storage/report-store';
import { deleteCloudReport, listCloudReports, saveCloudReport } from './storage/cloud-report-store';
import { canUseFreeLuna, consumeFreeLuna } from './storage/usage';
import { getSavedView, saveView } from './storage/view-store';

type View = 'new' | 'reports' | 'demo' | 'profile' | 'privacy' | 'terms';

const nav: { id: View; icon: string; label: string }[] = [
  { id: 'new', icon: '✦', label: 'Новый анализ' },
  { id: 'reports', icon: '▣', label: 'Мои отчёты' },
  { id: 'demo', icon: '◉', label: 'Демо-анализ' },
  { id: 'profile', icon: '◌', label: 'Аккаунт' },
];

export default function App() {
  const [view, setView] = useState<View>(getSavedView);
  const [audit, setAudit] = useState<ProfileAudit | null>(null);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<SavedReport[]>(listReports());
  const [notice, setNotice] = useState('');
  const [session, setSession] = useState<Session | null>(null);

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
  useEffect(() => { saveView(view); }, [view]);

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
      setView('profile');
      return;
    }

    if (request.model !== 'gpt-5.6-luna' || !canUseFreeLuna()) {
      const local = {
        ...new KworkAnalyzer().analyze(request.profile),
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
        ...new KworkAnalyzer().analyze(request.profile),
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

  return (
    <main className="app shell">
      <aside>
        <div className="brand"><i>C</i><span>client<span>lens</span></span></div>
        <div className="workspace">WORKSPACE</div>
        <nav>
          {nav.map((item) => (
            <button key={item.id} className={view === item.id ? 'selected' : ''} onClick={() => item.id === 'demo' ? openDemo() : setView(item.id)}>
              <span>{item.icon}</span>{item.label}{item.id === 'reports' && reports.length ? <small>{reports.length}</small> : null}
            </button>
          ))}
        </nav>
        <div className="legal-links"><button type="button" onClick={() => setView('privacy')}>Конфиденциальность</button><button type="button" onClick={() => setView('terms')}>Условия</button></div>
      </aside>
      <section className="content">
        {loading ? <Loading /> : view === 'new' ? <ProfileForm onAnalyze={analyze} onDemo={openDemo} notice={notice} /> : null}
        {!loading && view === 'reports' ? <Reports reports={reports} onOpen={(report) => { setAudit(report.audit); setView('demo'); }} onDelete={(id) => { deleteReport(id); if (session) void deleteCloudReport(id); setReports(listReports()); }} onNew={() => setView('new')} /> : null}
        {!loading && view === 'demo' && audit ? <Dashboard audit={audit} onRestart={() => setView('new')} /> : null}
        {!loading && view === 'profile' ? <><AccountPanel mode="profile" /><AccountPanel mode="settings" /></> : null}
        {!loading && (view === 'privacy' || view === 'terms') ? <LegalPage kind={view} onBack={() => setView('new')} /> : null}
      </section>
    </main>
  );
}

function Loading() {
  return <div className="loading"><i /><p className="eyebrow">Анализируем профиль</p><h2>Собираем данные и карту доверия</h2><span>Если площадка или AI недоступны, подготовим базовый отчёт.</span></div>;
}

function Reports({ reports, onOpen, onDelete, onNew }: { reports: SavedReport[]; onOpen: (report: SavedReport) => void; onDelete: (id: string) => void; onNew: () => void }) {
  return <section className="reports-view"><div className="view-head"><div><p className="eyebrow">Локальная история</p><h1>Мои отчёты</h1><p>Можно открыть или удалить любой аудит.</p></div><button className="primary" onClick={onNew}>+ Новый анализ</button></div>{reports.length ? <div className="reports-grid">{reports.map((report) => <article className="report-card" key={report.id}><div><span className="report-mode">{report.mode}</span><h3>{report.title}</h3><small>{new Date(report.createdAt).toLocaleDateString('ru-RU')} · {report.model.replace('gpt-5.6-', '')}</small></div><strong>{report.audit.score}</strong><div><button className="secondary" onClick={() => onOpen(report)}>Открыть</button><button className="icon-button" aria-label="Удалить отчёт" onClick={() => onDelete(report.id)}>×</button></div></article>)}</div> : <Empty title="Отчётов пока нет" text="Запустите первый анализ или посмотрите демо-отчёт." />}</section>;
}

function Empty({ title, text }: { title: string; text: string }) {
  return <section className="empty"><div>✦</div><h1>{title}</h1><p>{text}</p></section>;
}
