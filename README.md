# ClientLens

ClientLens анализирует публичные фриланс-профили и даёт рекомендации по доверию, первому впечатлению и позиционированию. Пользователь должен войти в аккаунт до запуска анализа. AI-анализ безопасно переключается на базовый локальный отчёт, если OpenAI недоступен.

## Локальный запуск

Нужен Node.js 20 или новее.

```powershell
npm.cmd install
npm.cmd run dev
```

Откройте `http://127.0.0.1:5173`.

Если PowerShell блокирует `npm`, используйте именно `npm.cmd` или выполните в PowerShell один раз для текущего окна:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

## Переменные окружения

Создайте локальный `.env` по примеру `.env.example`.

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL_LUNA=openai/gpt-5.6-luna
OPENROUTER_MODEL_TERRA=openai/gpt-5.6-terra
OPENROUTER_MODEL_SOL=anthropic/claude-opus-5
OPENROUTER_SITE_URL=https://clientlens.ru
OPENROUTER_APP_NAME=ClientLens
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
```

`OPENAI_API_KEY` — один ключ для всех моделей одного OpenAI-проекта. Он остаётся только на сервере. `VITE_SUPABASE_PUBLISHABLE_KEY` можно использовать в браузере: это публичный ключ, а доступ к данным ограничен RLS-правилами базы.

`SUPABASE_URL` и `SUPABASE_PUBLISHABLE_KEY` нужны только серверу для проверки access token перед анализом. На Render задайте их теми же значениями, что и соответствующие `VITE_` переменные. Без действующей авторизации сервер вернёт `401` и не начнёт ни сбор профиля, ни AI-запрос.

Не добавляйте `.env` в Git. Не используйте и не публикуйте `SUPABASE_SERVICE_ROLE_KEY`, пароль базы, SMTP-пароли и приватные ключи.

## Supabase

1. Создайте проект Supabase.
2. Добавьте `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY` в `.env`.
3. В SQL Editor выполните по порядку:
   - `supabase/migrations/001_profiles.sql`;
   - `supabase/migrations/002_audits.sql`.
   - `supabase/migrations/003_authenticated_grants.sql`;
   - `supabase/migrations/004_avatar_delete.sql`;
   - `supabase/migrations/005_avatar_storage_read.sql`.
4. В **Authentication → URL Configuration** установите после публикации:
   - Site URL: `https://clientlens.ru`;
   - Redirect URLs: `https://clientlens.ru/**` и временно `http://127.0.0.1:5173/**`.
5. В **Authentication → Providers → Email** включите подтверждение email.
6. Подключите собственный SMTP в **Authentication → SMTP**. Стандартный SMTP Supabase не предназначен для писем всем реальным пользователям. CAPTCHA включайте только после добавления captcha token в форму регистрации: текущая версия его намеренно не включает, иначе регистрация перестанет работать.

## Публикация на Render

Этот проект запускается как единый Node.js-сервис: Express отдаёт и API, и собранный Vite-сайт с одного домена.

1. Создайте приватный GitHub-репозиторий и добавьте код без `.env`.
2. В Render создайте **Web Service**, подключите репозиторий.
3. Укажите:
   - Build Command: `npm ci && npm run build`
   - Start Command: `npm run start`
   - Environment: `Node`
4. В Render → Environment добавьте все переменные из раздела выше. Для первого запуска оставьте `OPENAI_API_KEY` пустым: приложение будет делать базовый анализ. `VITE_` переменные нужны на этапе сборки — после их изменения обязательно сделайте новый deploy. `SUPABASE_URL` и `SUPABASE_PUBLISHABLE_KEY` требуются серверу и должны оставаться доступны также на этапе запуска.
5. Откройте выданный `onrender.com` адрес, зарегистрируйте тестовый аккаунт, проверьте анализ с ключом и без ключа.
6. В Render → Settings → Custom Domains добавьте `clientlens.ru` и `www.clientlens.ru`.
7. У регистратора домена внесите DNS-записи ровно такие, какие покажет Render. После появления HTTPS обновите URL Configuration в Supabase.

## Проверка перед запуском

```powershell
npm.cmd test -- --run
npm.cmd run lint
npm.cmd run build
```

Проверьте отдельно: регистрацию на новую почту, подтверждение кода, вход, сброс пароля, уникальный ник, удаление отчёта, загрузку аватара и AI/fallback-анализ.

Перед открытием сайта для пользователей укажите настоящий email поддержки в политике конфиденциальности и условиях использования. Сервис не принимает платежи и не хранит платёжные реквизиты.
