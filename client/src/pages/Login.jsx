import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/common/Input.jsx';
import Button from '../components/common/Button.jsx';
import OtpInput from '../components/common/OtpInput.jsx';
import LanguageToggle from '../components/common/LanguageToggle.jsx';
import { ChevronDown, ChevronUp } from 'lucide-react';

export function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1); // 1 = enter mobile, 2 = enter otp
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(30);
  const [demoExpanded, setDemoExpanded] = useState(false);

  useEffect(() => {
    let interval = null;
    if (step === 2 && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = (e) => {
    e.preventDefault();
    const cleanMobile = mobile.trim();
    if (!cleanMobile || cleanMobile.length !== 10) {
      setError(t('auth.invalidMobile'));
      return;
    }
    setError('');
    setStep(2);
    setResendTimer(30);
    // Pre-fill mock OTP for smooth demo testing
    setOtp('123456');
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      setError(t('auth.invalidOtp'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await login(mobile.trim(), otp.trim());
      showToast(t('auth.signIn'));
      if (data.user?.role === 'admin') {
        navigate('/admin/analytics');
      } else {
        navigate('/schemes');
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (quickMobile) => {
    setMobile(quickMobile);
    setLoading(true);
    setError('');
    try {
      const data = await login(quickMobile, '123456');
      showToast(t('auth.signIn'));
      if (data.user?.role === 'admin') {
        navigate('/admin/analytics');
      } else {
        navigate('/schemes');
      }
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const showDemo = import.meta.env.VITE_DEMO !== 'false';

  return (
    <div className="min-h-screen bg-salt flex flex-col justify-center items-center px-4 py-12">
      {/* Language Switcher at Top Right */}
      <div className="absolute top-6 right-6">
        <LanguageToggle />
      </div>

      {/* 420px Card */}
      <div className="w-full max-w-[420px] bg-surface border border-line rounded-[12px] p-8 text-center animate-fade-in">
        <div className="w-10 h-10 mx-auto rounded-[8px] bg-indigo flex items-center justify-center text-white font-bold text-base mb-4">
          GJ
        </div>

        <h1 className="text-2xl font-bold text-ink mb-1">
          {t('auth.signIn')}
        </h1>
        <p className="text-sm text-muted mb-6">
          {t('auth.subtitle')}
        </p>

        {/* Step 1: Mobile Form */}
        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              id="mobile-input"
              type="tel"
              maxLength={10}
              placeholder={t('auth.mobilePlaceholder')}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
              prefix={t('auth.countryCode')}
              error={error}
              autoFocus
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={mobile.length !== 10}
            >
              {t('auth.sendOtp')}
            </Button>
          </form>
        ) : (
          /* Step 2: 6-Box OTP Form */
          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-2">
              <p className="text-xs text-muted">
                Sent to {t('auth.countryCode')} {mobile}
              </p>
              <OtpInput length={6} value={otp} onChange={setOtp} />
              {error && <p className="text-xs text-madder">{error}</p>}
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              loading={loading}
              disabled={otp.length !== 6}
            >
              {t('auth.verifyAndSignIn')}
            </Button>

            <div className="flex justify-between items-center text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                }}
                className="text-indigo hover:underline font-medium cursor-pointer"
              >
                {t('auth.changeNumber')}
              </button>

              {resendTimer > 0 ? (
                <span className="text-muted">
                  {t('auth.resendIn', { seconds: resendTimer })}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setResendTimer(30);
                    setOtp('123456');
                    showToast('OTP resent');
                  }}
                  className="text-indigo hover:underline font-medium cursor-pointer"
                >
                  {t('auth.resendOtp')}
                </button>
              )}
            </div>
          </form>
        )}

        {/* Demo Accounts Box (Hackathon only) */}
        {showDemo && (
          <div className="mt-8 pt-6 border-t border-line">
            {/* Mobile collapsible toggle */}
            <div className="md:hidden mb-2">
              <button
                type="button"
                onClick={() => setDemoExpanded(!demoExpanded)}
                className="text-xs text-muted flex items-center justify-center space-x-1 w-full py-1 cursor-pointer"
              >
                <span>{demoExpanded ? t('auth.hideDemoAccounts') : t('auth.showDemoAccounts')}</span>
                {demoExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div
              className={`rounded-[8px] border border-dashed border-line p-3 text-left space-y-2 ${
                demoExpanded ? 'block' : 'hidden md:block'
              }`}
            >
              <p className="text-[11px] font-medium text-muted">
                {t('auth.demoAccountsTitle')}
              </p>
              <div className="flex flex-col space-y-1.5">
                <button
                  type="button"
                  onClick={() => handleQuickLogin('9876543210')}
                  className="w-full text-left px-2.5 py-1.5 rounded-[6px] bg-salt hover:bg-indigo-50 text-xs font-medium text-ink transition-colors cursor-pointer"
                >
                  {t('auth.demoHead')}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('9876543211')}
                  className="w-full text-left px-2.5 py-1.5 rounded-[6px] bg-salt hover:bg-indigo-50 text-xs font-medium text-ink transition-colors cursor-pointer"
                >
                  {t('auth.demoMemberApply')}
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickLogin('9998887771')}
                  className="w-full text-left px-2.5 py-1.5 rounded-[6px] bg-salt hover:bg-indigo-50 text-xs font-medium text-ink transition-colors cursor-pointer"
                >
                  {t('auth.demoOfficer')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
