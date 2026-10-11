import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await login({ username, password });

      await Swal.fire({
        icon: 'success',
        title: t.login.loginSuccess,
        text: 'ຍິນດີຕ້ອນຮັບສູ່ລະບົບ E-Document Management',
        timer: 1500,
        showConfirmButton: false,
      });

      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || t.login.loginError);
      Swal.fire({
        icon: 'error',
        title: 'ເຂົ້າສູ່ລະບົບບໍ່ສຳເລັດ',
        text: err.message || t.login.loginError,
        confirmButtonText: 'ລອງໃໝ່',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    Swal.fire({
      icon: 'info',
      title: t.login.forgotPassword,
      text: t.login.forgotPasswordDesc,
      confirmButtonText: 'ຮັບຊາບ',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Decorative Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      {/* Language Switcher in Header */}
      <div className="absolute top-6 right-6 z-20">
        <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800/80 p-0.5 text-xs font-semibold backdrop-blur-md">
          <button
            onClick={() => setLanguage('lo')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              language === 'lo' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            ລາວ
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1.5 rounded-md transition-all ${
              language === 'en' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
        </div>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Brand Logo & Name */}
        <div className="flex flex-col items-center text-center">
          <div className="p-2.5 bg-white rounded-2xl border border-white/60 shadow-2xl mb-4">
            <img
              src="/logo.png"
              alt="LHSE Logo"
              className="w-16 h-16 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  'https://img2.pic.in.th/ChatGPT-Image-Sep-28-2026-11_11_54-AM.png';
              }}
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide text-center">
            E-Document Management
          </h1>
          <p className="mt-1 text-sm font-medium text-blue-300">
            {t.appName} - {t.appSubtitle}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            ລັດວິສາຫະກິດ ຖືຮຸ້ນລາວ (Lao Holding State Enterprise)
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white/95 backdrop-blur-xl py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-white/40">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Username Input */}
            <div>
              <Input
                label={t.login.username}
                name="username"
                type="text"
                autoComplete="off"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                placeholder="ປ້ອນຊື່ຜູ້ໃຊ້..."
              />
            </div>

            {/* Password Input */}
            <div>
              <Input
                label={t.login.password}
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-slate-600 focus:outline-none"
                    title={showPassword ? t.login.hidePassword : t.login.showPassword}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                placeholder="••••••••"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <span>{t.login.rememberMe}</span>
              </label>

              <button
                type="button"
                onClick={handleForgotPassword}
                className="font-medium text-blue-600 hover:text-blue-500 hover:underline"
              >
                {t.login.forgotPassword}
              </button>
            </div>

            {/* Submit Button */}
            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-bold shadow-lg shadow-blue-600/30"
                isLoading={isLoading}
              >
                {isLoading ? t.login.loggingIn : t.login.loginBtn}
              </Button>
            </div>

            {/* Quick Login Helper Hint */}
            <div className="pt-2">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/90 text-center text-xs text-slate-600">
                <p className="font-semibold text-slate-700">ບັນຊີເຂົ້າສູ່ລະບົບເລີ່ມຕົ້ນ (Default Account):</p>
                <div className="flex items-center justify-center gap-2.5 mt-1.5 font-mono text-[11px]">
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    User: <strong className="text-blue-600">admin</strong>
                  </span>
                  <span className="bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                    Pass: <strong className="text-blue-600">admin123456</strong>
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
