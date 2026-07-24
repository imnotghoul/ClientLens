import { analysisPrices } from '../domain/pricing';

export type LegalKind = 'privacy' | 'terms' | 'pricing' | 'offer' | 'contacts';

const business = {
  name: import.meta.env.VITE_BUSINESS_NAME || 'Хадизов Халид Юнусович',
  inn: import.meta.env.VITE_BUSINESS_INN || '201405007682',
  email: import.meta.env.VITE_SUPPORT_EMAIL || '',
  telegram: import.meta.env.VITE_SUPPORT_TELEGRAM || 'zxcis',
};

export function LegalPage({ kind, onBack }: { kind: LegalKind; onBack: () => void }) {
  const title = kind === 'pricing' ? 'Цены' : kind === 'offer' ? 'Публичная оферта' : kind === 'contacts' ? 'Контакты и реквизиты' : kind === 'privacy' ? 'Политика конфиденциальности' : 'Условия использования';
  return <section className="reports-view legal-page"><button className="text-button" onClick={onBack}>← Назад</button><p className="eyebrow">ClientLens</p><h1>{title}</h1>{content(kind)}</section>;
}

function content(kind: LegalKind) {
  if (kind === 'pricing') return <><p>ClientLens продаёт цифровую услугу: анализ публичного профиля фрилансера и рекомендации по его улучшению. Результат появляется в аккаунте сразу после успешного запуска анализа.</p><div className="pricing-table">{Object.entries(analysisPrices).map(([mode, models]) => <article key={mode}><b>{mode === 'quick' ? 'Быстрый анализ' : mode === 'deep' ? 'Глубокий анализ' : 'Конкурентный анализ'}</b><span>Luna — {models['gpt-5.6-luna']} ₽</span><span>Terra — {models['gpt-5.6-terra']} ₽</span><span>Sol — {models['gpt-5.6-sol']} ₽</span></article>)}</div><p>Первый AI-анализ Luna доступен бесплатно. Рекомендации не гарантируют заказы или доход.</p></>;
  if (kind === 'contacts') return <>{business.email ? <p>Email: <a href={`mailto:${business.email}`}>{business.email}</a></p> : <p>Email поддержки будет добавлен после настройки почты.</p>}<p>Связь: <a href={`https://t.me/${business.telegram.replace(/^@/, '')}`} target="_blank" rel="noreferrer">Telegram @{business.telegram.replace(/^@/, '')}</a></p><p>Услуга предоставляется онлайн: после оплаты баланс пополняется, а результат анализа становится доступен в аккаунте.</p></>;
  if (kind === 'offer') return <><p>Исполнитель: {business.name}</p><p>ИНН: {business.inn}</p>{business.email ? <p>Email: <a href={`mailto:${business.email}`}>{business.email}</a></p> : null}<p>Настоящая оферта определяет условия приобретения цифрового баланса ClientLens и использования платных анализов. Оплатой пользователь принимает условия оферты и цены, указанные на странице «Цены».</p><p>Баланс используется только для оплаты анализов внутри ClientLens, не является банковским счётом и не подлежит переводу между пользователями. Возврат рассматривается индивидуально, если услуга не была оказана.</p><p>После оплаты сервис создаёт и сохраняет отчёт в аккаунте пользователя. Если анализ не был сформирован из-за технической ошибки, списание не выполняется либо сумма возвращается на баланс.</p></>;
  if (kind === 'privacy') return <><p>Мы обрабатываем email, ник, выбранный аватар и данные, которые вы сами отправляете для анализа профиля. Отчёты хранятся в вашем аккаунте и доступны только вам через правила доступа базы данных.</p><p>Для AI-анализа данные профиля передаются OpenAI. Не отправляйте в сервис пароли, платёжные данные, паспортные данные или другую чувствительную информацию.</p><p>Чтобы запросить удаление аккаунта и отчётов, напишите в Telegram @{business.telegram.replace(/^@/, '')}.</p></>;
  return <><p>ClientLens даёт аналитические рекомендации по публичным профилям фрилансеров. Это не гарантия заказов, дохода или результата на любой бирже.</p><p>Вы отвечаете за права на данные, которые отправляете в сервис, и за соблюдение правил площадок, с которых добавляете публичные профили.</p><p>Не используйте сервис для сбора личной информации, обхода ограничений площадок или нарушения прав третьих лиц.</p></>;
}
