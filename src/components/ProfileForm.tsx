import { useState, type FormEvent } from 'react';
import { emptyProfile, type ProfileInput } from '../domain/profile';
import { aiModels, modeDefaults, type AiModel, type AnalysisMode, type CompetitorInput } from '../domain/report';
import { getAnalysisPrice } from '../domain/pricing';
import type { AnalysisRequest } from '../api/analyze';

const blankCompetitor = (): CompetitorInput => ({ name: '', headline: '', price: '', proof: '' });

export function ProfileForm({ onAnalyze, onDemo = () => undefined, notice }: {
  onAnalyze: (request: AnalysisRequest) => void;
  onDemo?: () => void;
  notice?: string;
}) {
  const [profile, setProfile] = useState<ProfileInput>(emptyProfile);
  const [manual, setManual] = useState(false);
  const [mode, setMode] = useState<AnalysisMode>('deep');
  const [model, setModel] = useState<AiModel>('gpt-5.6-luna');
  const [competitors, setCompetitors] = useState<CompetitorInput[]>([blankCompetitor()]);
  const [error, setError] = useState('');
  const price = getAnalysisPrice(mode, model);

  const update = (key: keyof ProfileInput, value: string | number) => setProfile((old) => ({ ...old, [key]: value }));
  const updateCompetitor = (index: number, key: keyof CompetitorInput, value: string) => setCompetitors((old) => old.map((item, itemIndex) => itemIndex === index ? { ...item, [key]: value } : item));
  const removeCompetitor = (index: number) => setCompetitors((old) => old.length === 1 ? [blankCompetitor()] : old.filter((_, itemIndex) => itemIndex !== index));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!profile.profileUrl && !profile.title && !profile.description) {
      setError('Добавьте ссылку или хотя бы заголовок и описание профиля.');
      return;
    }
    setError('');
    onAnalyze({ profile, mode, model, competitors: mode === 'competitive' ? competitors.filter((item) => item.name || item.headline || item.price) : [] });
  };

  return <form className="audit-form dark-form" onSubmit={submit}>
    <div className="eyebrow">Kwork profile intelligence</div>
    <h1>Увидьте профиль глазами клиента</h1>
    <p className="lead">Выберите глубину анализа, добавьте данные профиля и получите практичный план улучшений.</p>
    {notice ? <p className="analysis-notice" role="status">{notice}</p> : null}
    <div className="mode-grid">{(Object.keys(modeDefaults) as AnalysisMode[]).map((item) => <button type="button" className={mode === item ? 'mode-card active' : 'mode-card'} key={item} onClick={() => setMode(item)}><b>{modeDefaults[item].title}</b><span>{modeDefaults[item].description}</span></button>)}</div>
    <div className="model-row"><span>Модель анализа</span><div>{(Object.keys(aiModels) as AiModel[]).map((item) => <button type="button" className={model === item ? 'model-chip active' : 'model-chip'} key={item} onClick={() => setModel(item)}>{aiModels[item].name}</button>)}</div></div>
    <div className="price-panel"><div><b>{aiModels[model].name} · {modeDefaults[mode].title}</b><span>{model === 'gpt-5.6-luna' ? 'Первый AI-анализ Luna — бесплатно' : 'AI-анализ будет доступен после подключения оплаты'}</span></div><strong>{price} ₽</strong></div>
    <label className="field wide"><span>Ссылка на Kwork-профиль</span><input value={profile.profileUrl} placeholder="https://kwork.ru/user/..." onChange={(event) => update('profileUrl', event.target.value)} /></label>
    <button className="text-button" type="button" onClick={() => setManual(!manual)}>{manual ? 'Скрыть ручной ввод' : 'Заполнить вручную'}</button>
    {manual && <div className="manual-grid">
      <label className="field"><span>Имя или ник</span><input value={profile.name} onChange={(event) => update('name', event.target.value)} placeholder="Например, Анна" /></label>
      <label className="field"><span>Специализация</span><input value={profile.specialization} onChange={(event) => update('specialization', event.target.value)} placeholder="UX/UI-дизайн" /></label>
      <label className="field wide"><span>Заголовок профиля</span><input value={profile.title} onChange={(event) => update('title', event.target.value)} placeholder="Дизайнер интерфейсов для SaaS" /></label>
      <label className="field wide"><span>Описание</span><textarea value={profile.description} onChange={(event) => update('description', event.target.value)} placeholder="Что вы делаете и какой результат получает клиент" /></label>
      <label className="field"><span>Услуги / кворки</span><textarea value={profile.services} onChange={(event) => update('services', event.target.value)} /></label>
      <label className="field"><span>Цена и состав</span><textarea value={profile.price} onChange={(event) => update('price', event.target.value)} /></label>
      <label className="field"><span>Отзывы</span><textarea value={profile.reviews} onChange={(event) => update('reviews', event.target.value)} /></label>
      <label className="field"><span>Заказов</span><input type="number" value={profile.completedOrders || ''} onChange={(event) => update('completedOrders', Number(event.target.value))} /></label>
      <label className="field wide"><span>Портфолио / кейсы</span><textarea value={profile.portfolio} onChange={(event) => update('portfolio', event.target.value)} /></label>
    </div>}
    {mode === 'competitive' && <section className="competitors"><b>Конкуренты для сравнения</b><p>Добавьте до трёх профилей вручную — реальный парсинг не используется.</p>{competitors.map((item, index) => <div className="competitor" key={index}><input placeholder="Имя или ссылка" value={item.name} onChange={(event) => updateCompetitor(index, 'name', event.target.value)} /><input placeholder="Заголовок / оффер" value={item.headline} onChange={(event) => updateCompetitor(index, 'headline', event.target.value)} /><input placeholder="Цена или доказательства" value={item.price} onChange={(event) => updateCompetitor(index, 'price', event.target.value)} /><button type="button" className="remove-competitor" aria-label="Удалить конкурента" title="Удалить конкурента" onClick={() => removeCompetitor(index)}>×</button></div>)}{competitors.length < 3 && <button className="text-button" type="button" onClick={() => setCompetitors((old) => [...old, blankCompetitor()])}>+ Добавить конкурента</button>}</section>}
    {error && <p className="error">{error}</p>}
    <div className="form-actions"><button className="primary" type="submit">Запустить {mode === 'quick' ? 'быстрый' : mode === 'deep' ? 'глубокий' : 'конкурентный'} анализ →</button><button className="secondary" type="button" onClick={onDemo}>Посмотреть демо</button></div>
    <p className="pricing-hint">Базовый анализ без AI остаётся бесплатным при недоступности сервиса.</p>
  </form>;
}
