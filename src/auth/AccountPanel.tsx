import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { authErrorMessage, isAlreadyRegisteredSignUp, isAllowedAuthRedirect, isEmailTaken, isNicknameValid, isPasswordRecoveryEvent, isSupabaseConfigured, nicknameErrorMessage, normalizeOtp, profileAvatarLetter, supabase } from './supabase';

type Screen = 'login' | 'register' | 'confirm' | 'reset' | 'resetConfirm' | 'updatePassword';
type AccountPanelProps = { mode?: 'profile' | 'settings'; initialScreen?: 'login' | 'register'; onProfileChanged?: () => void };

export function AccountPanel({ mode = 'profile', initialScreen = 'login', onProfileChanged }: AccountPanelProps) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [avatar, setAvatar] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changeCode, setChangeCode] = useState('');
  const [awaitingPasswordCode, setAwaitingPasswordCode] = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setScreen(initialScreen);
  }, [initialScreen]);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      if (isPasswordRecoveryEvent(event)) setScreen('updatePassword');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const client = supabase;
    if (!client || !session) return;
    void client.from('profiles').select('nickname, avatar_path').eq('id', session.user.id).maybeSingle().then(({ data }) => {
      if (!data) return;
      setNickname(data.nickname ?? '');
      setAvatar(data.avatar_path ? client.storage.from('avatars').getPublicUrl(data.avatar_path).data.publicUrl : '');
    });
  }, [session]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    setMessage('');
    if (screen === 'updatePassword') {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) return setMessage('Не удалось обновить пароль.');
      await supabase.auth.signOut();
      setScreen('login');
      return setMessage('Пароль обновлён. Войдите с новым паролем.');
    }
    if (screen === 'reset') {
      const { error: otpError } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
      if (otpError) return setMessage(authErrorMessage(otpError.message, 'reset'));
      setScreen('resetConfirm');
      return setMessage('Код отправлен на почту. Введите его и придумайте новый пароль.');
      const origin = window.location.origin;
      if (!isAllowedAuthRedirect(origin)) return setMessage('Небезопасный адрес сайта.');
      void origin;
      return setMessage('Если аккаунт существует, письмо уже отправлено.');
    }
    if (screen === 'resetConfirm') {
      if (password.length < 12 || password !== confirmPassword) return setMessage('Новый пароль должен совпадать и содержать не менее 12 символов.');
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) return setMessage('Неверный или устаревший код.');
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) return setMessage('Не удалось обновить пароль.');
      await supabase.auth.signOut();
      setPassword(''); setConfirmPassword(''); setCode(''); setScreen('login');
      return setMessage('Пароль изменён. Войдите с новым паролем.');
    }
    if (screen === 'register') {
      const normalizedEmail = email.trim().toLowerCase();
      const { data: emailAvailable, error: emailCheckError } = await supabase.rpc('is_email_available', { candidate: normalizedEmail });
      if (isEmailTaken({ available: emailAvailable, error: emailCheckError })) return setMessage('Эта почта уже зарегистрирована. Войдите или восстановите пароль.');
      const { data: nicknameAvailable, error: nicknameCheckError } = await supabase.rpc('is_nickname_available', { candidate: nickname });
      if (!nicknameCheckError && nicknameAvailable === false) return setMessage('Этот ник уже занят. Выберите другой.');
      if (!isNicknameValid(nickname)) return setMessage('Ник: 3–24 символа, латинские буквы, цифры или _.');
      const { data, error } = await supabase.auth.signUp({ email: normalizedEmail, password, options: { data: { nickname }, emailRedirectTo: `${window.location.origin}/` } });
      if (isAlreadyRegisteredSignUp(data)) return setMessage('Эта почта уже зарегистрирована. Войдите или восстановите пароль.');
      if (error) return setMessage(authErrorMessage(error.message, 'register'));
      setScreen('confirm');
      return setMessage('Код отправлен на почту.');
    }
    if (screen === 'confirm') {
      const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error) return setMessage('Не удалось подтвердить код.');
      setScreen('login');
      return setMessage('Почта подтверждена. Теперь войдите.');
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMessage(authErrorMessage(error.message, 'login'));
    return setMessage('Вход выполнен.');
    setMessage(error ? 'Не удалось войти. Проверьте почту и пароль.' : 'Вход выполнен.');
  };

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !session || !isNicknameValid(nickname)) return setMessage('Проверьте ник.');
    const { error } = await supabase.from('profiles').upsert({ id: session.user.id, nickname, updated_at: new Date().toISOString() });
    if (error) return setMessage(nicknameErrorMessage(error.message));
    onProfileChanged?.();
    setMessage('Профиль сохранён.');
  };

  const uploadAvatar = async (file: File | undefined) => {
    if (!supabase || !session || !file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 2_000_000) return setMessage('Аватар: JPG, PNG или WebP до 2 МБ.');
    const path = `${session.user.id}/avatar.${file.type.split('/')[1]}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true, contentType: file.type });
    if (error) return setMessage('Не удалось загрузить аватар.');
    const { error: profileError } = await supabase.from('profiles').upsert({ id: session.user.id, avatar_path: path, nickname, updated_at: new Date().toISOString() });
    if (profileError) return setMessage('Аватар загружен, но не удалось сохранить профиль.');
    setAvatar(supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl);
    onProfileChanged?.();
    setMessage('Аватар обновлён.');
  };

  const removeAvatar = async () => {
    if (!supabase || !session) return;
    const files = ['jpg', 'jpeg', 'png', 'webp'].map((ext) => `${session.user.id}/avatar.${ext}`);
    const { error } = await supabase.storage.from('avatars').remove(files);
    if (error) return setMessage('Не удалось удалить аватар.');
    const { error: profileError } = await supabase.from('profiles').upsert({ id: session.user.id, avatar_path: null, nickname, updated_at: new Date().toISOString() });
    if (profileError) return setMessage('Не удалось сохранить профиль после удаления аватара.');
    setAvatar('');
    onProfileChanged?.();
    setMessage('Аватар удалён.');
  };

  const changePassword = async (event: FormEvent) => {
    event.preventDefault();
    if (!supabase || !session) return;
    setMessage('');
    if (!awaitingPasswordCode) {
      if (newPassword.length < 12 || newPassword !== confirmPassword) return setMessage('Новый пароль должен совпадать и содержать не менее 12 символов.');
      const { error } = await supabase.auth.signInWithPassword({ email: session.user.email!, password: currentPassword });
      if (error) return setMessage('Текущий пароль указан неверно.');
      const { error: otpError } = await supabase.auth.signInWithOtp({ email: session.user.email!, options: { shouldCreateUser: false } });
      if (otpError) return setMessage('Не удалось отправить код.');
      setAwaitingPasswordCode(true);
      return setMessage('Код отправлен на вашу почту.');
    }
    const { error } = await supabase.auth.verifyOtp({ email: session.user.email!, token: changeCode, type: 'email' });
    if (error) return setMessage('Неверный или устаревший код.');
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    if (updateError) return setMessage('Не удалось обновить пароль.');
    setAwaitingPasswordCode(false);
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setChangeCode('');
    setMessage('Пароль успешно изменён.');
  };

  if (!isSupabaseConfigured) return <section className="account-panel"><h1>Подключите Supabase</h1></section>;
  if (screen === 'updatePassword') return <section className="account-panel"><h1>Новый пароль</h1><form onSubmit={submit} className="account-form"><label>Новый пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} autoComplete="new-password" /></label><button className="primary">Сохранить пароль</button></form>{message && <p className="analysis-notice">{message}</p>}</section>;
  if (!session) {
    if (screen === 'resetConfirm') return <section className="account-panel"><p className="eyebrow">Аккаунт ClientLens</p><h1>Восстановить пароль</h1><form onSubmit={submit} className="account-form"><label>Код из письма<input value={code} onChange={(event) => setCode(normalizeOtp(event.target.value))} required maxLength={8} inputMode="numeric" autoComplete="one-time-code" /></label><label>Новый пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} autoComplete="new-password" /></label><label>Подтвердите новый пароль<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} autoComplete="new-password" /></label><button className="primary">Сохранить пароль</button></form>{message && <p className="analysis-notice">{message}</p>}</section>;
    const title = screen === 'login' ? 'Войти' : screen === 'register' ? 'Создать аккаунт' : screen === 'confirm' ? 'Подтвердить почту' : 'Сбросить пароль';
    return <section className="account-panel"><p className="eyebrow">Аккаунт ClientLens</p><h1>{title}</h1><form onSubmit={submit} className="account-form">{screen !== 'confirm' && <label>Почта<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>}{(screen === 'login' || screen === 'register') && <label>Пароль<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={12} autoComplete={screen === 'login' ? 'current-password' : 'new-password'} /></label>}{screen === 'register' && <label>Ник<input value={nickname} onChange={(event) => setNickname(event.target.value)} required autoComplete="username" /></label>}{screen === 'confirm' && <label>Код из письма<input value={code} onChange={(event) => setCode(normalizeOtp(event.target.value))} required maxLength={8} inputMode="numeric" autoComplete="one-time-code" /></label>}<button className="primary">{screen === 'login' ? 'Войти' : screen === 'register' ? 'Отправить код' : screen === 'confirm' ? 'Подтвердить' : 'Отправить письмо'}</button></form>{screen === 'login' && <div className="auth-actions"><button className="text-button" type="button" onClick={() => setScreen('register')}>Создать аккаунт</button><button className="text-button" type="button" onClick={() => setScreen('reset')}>Не помню пароль</button></div>}{screen !== 'login' && <button className="text-button" type="button" onClick={() => setScreen('login')}>У меня уже есть аккаунт</button>}{message && <p className="analysis-notice">{message}</p>}</section>;
  }
  if (mode === 'settings') return <section className="account-panel"><p className="eyebrow">Безопасность и оплата</p><h1>Аккаунт</h1><form onSubmit={changePassword} className="account-form"><h3>Смена пароля</h3>{!awaitingPasswordCode ? <><label>Старый пароль<input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required autoComplete="current-password" /></label><label>Новый пароль<input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required minLength={12} autoComplete="new-password" /></label><label>Повторите новый пароль<input type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required minLength={12} autoComplete="new-password" /></label><button className="primary">Отправить код</button></> : <><label>Код из письма<input value={changeCode} onChange={(event) => setChangeCode(normalizeOtp(event.target.value))} required maxLength={8} inputMode="numeric" autoComplete="one-time-code" /></label><button className="primary">Изменить пароль</button></>}</form><section className="payment-placeholder"><b>Способы оплаты</b><p>Подключим позже. Данные карт и реквизиты сейчас не принимаем.</p><button className="secondary" type="button" disabled>+ Добавить способ оплаты</button></section>{message && <p className="analysis-notice">{message}</p>}</section>;
  return <section className="account-panel"><header className="profile-header"><div><p className="eyebrow">Ваш аккаунт</p><h1>Профиль</h1><p>{session.user.email}</p></div><div className="avatar-controls">{avatar ? <img className="profile-header-avatar" src={avatar} alt="Аватар" /> : <span className="profile-header-avatar avatar-fallback">{profileAvatarLetter(nickname)}</span>}<div><button className="secondary avatar-action" type="button" onClick={() => avatarInput.current?.click()}>Изменить</button>{avatar && <button className="text-button avatar-action" type="button" onClick={() => void removeAvatar()}>Удалить</button>}</div></div><input ref={avatarInput} className="visually-hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void uploadAvatar(event.target.files?.[0])} /></header><form onSubmit={saveProfile} className="account-form"><label>Ник<input value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="например, aegis" autoComplete="username" required /></label><button className="primary">Сохранить профиль</button></form><button className="text-button" type="button" onClick={() => { if (supabase) void supabase.auth.signOut(); }}>Выйти</button>{message && <p className="analysis-notice">{message}</p>}</section>;
}
