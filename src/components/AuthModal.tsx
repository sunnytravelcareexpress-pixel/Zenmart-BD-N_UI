import React, { useState } from 'react';
import { X, ShieldCheck, LogOut, Lock, User, LayoutDashboard, Check } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';
import { isAssignedAdmin } from '../lib/databaseService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAdmin?: () => void;
  onShowToast?: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onOpenAdmin,
  onShowToast,
}) => {
  const { user, role, signInWithEmail, signUpWithEmail, signInWithPhoneDemo, signOut } = useAuth();
  const [tab, setTab] = useState<'customer' | 'admin'>('customer');
  const [authMode, setAuthMode] = useState<'phone' | 'email'>('phone');
  const [isCustomerSignUp, setIsCustomerSignUp] = useState(false);
  
  // Form fields
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setOtpSent(true);
    setOtp('1234');
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      await signInWithPhoneDemo(phone, fullName || 'Valued Customer');
      setSuccessMsg('Signed in successfully via phone!');
      onShowToast?.('Signed in successfully via mobile number!', 'success');
      setTimeout(() => onClose(), 400);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed';
      setErrorMsg(msg);
      onShowToast?.(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      const msg = 'Please enter both your email address and password.';
      setErrorMsg(msg);
      onShowToast?.(msg, 'error');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (isCustomerSignUp) {
        if (!fullName.trim()) {
          const msg = 'Please enter your full name.';
          setErrorMsg(msg);
          onShowToast?.(msg, 'error');
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          const msg = 'Password must be at least 6 characters.';
          setErrorMsg(msg);
          onShowToast?.(msg, 'error');
          setLoading(false);
          return;
        }
        const res = await signUpWithEmail(cleanEmail, password, fullName.trim(), phone.trim() || undefined);
        if (res?.error) {
          setErrorMsg(res.error);
          onShowToast?.(res.error, 'error');
          return;
        }
        const successText = 'Account created successfully! Welcome to ZenMart BD.';
        setSuccessMsg(successText);
        onShowToast?.(successText, 'success');
        setPassword('');
        setTimeout(() => onClose(), 500);
      } else {
        const res = await signInWithEmail(cleanEmail, password);
        if (res?.error) {
          setErrorMsg(res.error);
          onShowToast?.(res.error, 'error');
          return;
        }
        const successText = 'Signed in successfully! Welcome back to ZenMart BD.';
        setSuccessMsg(successText);
        onShowToast?.(successText, 'success');
        setPassword('');
        setTimeout(() => onClose(), 500);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials or login failed.';
      setErrorMsg(msg);
      onShowToast?.(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-neutral-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#D99A24]">
              {user ? (role === 'admin' ? 'admin_panel_settings' : 'person') : 'lock'}
            </span>
            <h3 className="font-display-title text-base sm:text-lg font-bold text-neutral-900">
              {user
                ? role === 'admin'
                  ? 'Admin Management Portal'
                  : 'My ZenMart Account'
                : 'Welcome to ZenMart BD'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-neutral-400 hover:text-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {user ? (
            /* Logged-in profile view */
            <div className="space-y-5 text-center">
              <div
                className={`w-16 h-16 rounded-full font-extrabold text-xl flex items-center justify-center mx-auto border-2 ${
                  role === 'admin'
                    ? 'bg-amber-100 text-amber-900 border-[#D99A24]'
                    : 'bg-[#FEF6E9] text-[#D99A24] border-[#D99A24]/30'
                }`}
              >
                {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>

              <div>
                <h4 className="font-display-title text-lg font-bold text-neutral-900">
                  {user.full_name || user.email?.split('@')[0] || 'User'}
                </h4>
                <p className="text-xs text-neutral-500">{user.email || user.phone}</p>
                
                <div className="flex items-center justify-center gap-2 mt-2">
                  <div
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold ${
                      role === 'admin'
                        ? 'bg-[#111111] text-[#D99A24]'
                        : 'bg-emerald-50 text-[#007A3D]'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>
                      {(user.email || '').trim().toLowerCase() === 'official.sunny.ext@gmail.com'
                        ? 'Super Admin (Mother Admin)'
                        : role === 'admin'
                        ? 'System Administrator'
                        : 'Verified Customer'}
                    </span>
                  </div>
                </div>
              </div>

              {(role === 'admin' || (user.email || '').trim().toLowerCase() === 'official.sunny.ext@gmail.com') && onOpenAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenAdmin();
                  }}
                  className="w-full py-3 bg-[#111111] hover:bg-[#D99A24] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition-all cursor-pointer"
                >
                  <LayoutDashboard className="w-4 h-4 text-[#D99A24]" />
                  <span>Launch Admin Dashboard</span>
                </button>
              )}

              {/* Account Meta Information */}
              <div className="p-4 bg-neutral-50 rounded-2xl border border-neutral-200 text-left text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-500">Access Level:</span>
                  <span className="font-semibold text-neutral-900 uppercase tracking-wider text-[11px]">
                    {role}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-200">
                  <span className="text-neutral-500">Courier Partner:</span>
                  <span className="font-semibold text-neutral-800">Pathao &amp; Steadfast</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-500">Cash on Delivery:</span>
                  <span className="font-semibold text-[#007A3D]">Active for all 64 Districts</span>
                </div>
              </div>

              <button
                onClick={async () => {
                  await signOut();
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            /* Sign-in Form */
            <div className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0"></span>
                  <span>{errorMsg}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-emerald-50 text-[#007A3D] border border-emerald-200 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
                  <Check className="w-4 h-4 text-[#007A3D] flex-shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Persona Tab Switcher */}
              <div className="flex p-1 bg-neutral-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setTab('customer');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    tab === 'customer'
                      ? 'bg-white text-neutral-900 shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Customer Login</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTab('admin');
                    setErrorMsg('');
                    setSuccessMsg('');
                  }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    tab === 'admin'
                      ? 'bg-[#111111] text-[#D99A24] shadow-sm'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Admin Portal</span>
                </button>
              </div>

              {tab === 'customer' ? (
                /* Customer Phone OTP / Email */
                <div>
                  <div className="flex gap-2 mb-3 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('phone');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className={`pb-1 border-b-2 font-semibold transition-all ${
                        authMode === 'phone'
                          ? 'border-[#D99A24] text-neutral-900'
                          : 'border-transparent text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      Bangladesh Mobile OTP
                    </button>
                    <span className="text-neutral-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('email');
                        setErrorMsg('');
                        setSuccessMsg('');
                      }}
                      className={`pb-1 border-b-2 font-semibold transition-all ${
                        authMode === 'email'
                          ? 'border-[#D99A24] text-neutral-900'
                          : 'border-transparent text-neutral-400 hover:text-neutral-700'
                      }`}
                    >
                      Email &amp; Password
                    </button>
                  </div>

                  {authMode === 'phone' ? (
                    !otpSent ? (
                      <form onSubmit={handleSendOtp} className="space-y-3">
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Your Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Tanvir Rahman"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Bangladesh Mobile Number
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                              +880
                            </span>
                            <input
                              type="tel"
                              required
                              placeholder="01831446111"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl pl-14 pr-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="w-full bg-[#111111] hover:bg-[#D99A24] text-white py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Send Verification Code (SMS)
                        </button>
                      </form>
                    ) : (
                      <form onSubmit={handleVerifyOtp} className="space-y-3">
                        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                          <span>
                            SMS code sent to +880 {phone}. (Use demo code <strong>1234</strong>)
                          </span>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            4-Digit OTP Code
                          </label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            placeholder="1234"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full text-center tracking-widest text-lg font-bold bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-[#D99A24] hover:bg-[#C2871A] text-white py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          {loading ? 'Verifying...' : 'Verify & Sign In'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="w-full text-center text-[11px] text-neutral-500 hover:text-neutral-800"
                        >
                          Change phone number
                        </button>
                      </form>
                    )
                  ) : (
                    <form onSubmit={handleEmailSubmit} className="space-y-3">
                      {isCustomerSignUp && (
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Tanvir Rahman"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={loading}
                            className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                          />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 mb-1">
                          Email Address
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="customer@zenmartbd.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={loading}
                          className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                        />
                      </div>

                      {isCustomerSignUp && (
                        <div>
                          <label className="block text-xs font-semibold text-neutral-700 mb-1">
                            Mobile Number (Optional)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-xs">
                              +880
                            </span>
                            <input
                              type="tel"
                              placeholder="01831446111"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              disabled={loading}
                              className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl pl-14 pr-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                            />
                          </div>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="block text-xs font-semibold text-neutral-700">
                            Password
                          </label>
                          {isCustomerSignUp && (
                            <span className="text-[11px] text-neutral-400">Min 6 characters</span>
                          )}
                        </div>
                        <input
                          type="password"
                          required
                          placeholder="••••••••"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          disabled={loading}
                          className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#111111] hover:bg-[#D99A24] text-white py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {loading ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            <span>{isCustomerSignUp ? 'Creating Account...' : 'Signing In...'}</span>
                          </>
                        ) : (
                          <span>{isCustomerSignUp ? 'Create Customer Account' : 'Sign In as Customer'}</span>
                        )}
                      </button>

                      {/* Sign In vs Sign Up Toggle */}
                      <div className="pt-2 text-center border-t border-neutral-100">
                        {isCustomerSignUp ? (
                          <p className="text-xs text-neutral-500">
                            Already have an account?{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomerSignUp(false);
                                setErrorMsg('');
                                setSuccessMsg('');
                              }}
                              className="text-[#D99A24] hover:underline font-semibold cursor-pointer"
                            >
                              Sign in here
                            </button>
                          </p>
                        ) : (
                          <p className="text-xs text-neutral-500">
                            Don't have an account yet?{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomerSignUp(true);
                                setErrorMsg('');
                                setSuccessMsg('');
                              }}
                              className="text-[#D99A24] hover:underline font-semibold cursor-pointer"
                            >
                              Create an account
                            </button>
                          </p>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              ) : (
                /* Admin Login - Strictly Authenticated via Supabase */
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const cleanEmail = email.trim();
                    if (!cleanEmail || !password) {
                      const msg = 'Please enter both Admin Email and Password.';
                      setErrorMsg(msg);
                      onShowToast?.(msg, 'error');
                      return;
                    }
                    setLoading(true);
                    setErrorMsg('');
                    setSuccessMsg('');
                    try {
                      const res = await signInWithEmail(cleanEmail, password);
                      if (res.error) {
                        const err = res.error || 'Invalid email or password.';
                        setErrorMsg(err);
                        onShowToast?.(err, 'error');
                        return;
                      }
                      const isSuper = cleanEmail.toLowerCase() === 'official.sunny.ext@gmail.com' || cleanEmail.toLowerCase() === 'sunny.travelcareexpress@gmail.com';
                      const isPromoted = isAssignedAdmin(cleanEmail);
                      if (res.role !== 'admin' && !isSuper && !isPromoted) {
                        const err = 'You do not have admin access. (আপনার অ্যাকাউন্টে অ্যাডমিন অনুমতি নেই)';
                        setErrorMsg(err);
                        onShowToast?.(err, 'error');
                        return;
                      }
                      onShowToast?.(
                        isSuper ? 'Signed in as Super Administrator (Mother Admin)' : 'Signed in as Administrator',
                        'success'
                      );
                      onClose();
                      if (onOpenAdmin) onOpenAdmin();
                    } catch (err: unknown) {
                      const msg = err instanceof Error ? err.message : 'Invalid email or password.';
                      setErrorMsg(msg);
                      onShowToast?.(msg, 'error');
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="space-y-3"
                >
                  <div className="p-3 bg-neutral-900 text-neutral-200 rounded-xl text-xs space-y-1">
                    <p className="font-bold text-[#D99A24] flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" />
                      <span>Authorized Staff &amp; Store Management Only</span>
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      Sign in with your verified administrator credentials.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="admin@zenmartbd.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Admin Password
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full text-xs bg-neutral-50 border border-neutral-300 rounded-xl px-3.5 py-2.5 focus:bg-white focus:outline-none focus:border-[#D99A24]"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                    <span className="text-neutral-500">Super Admin Account:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmail('official.sunny.ext@gmail.com');
                        setPassword('superadmin123');
                      }}
                      className="text-[#D99A24] hover:underline font-bold cursor-pointer"
                    >
                      👑 Fill Super Admin
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#111111] hover:bg-[#D99A24] text-white py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    {loading ? 'Authenticating with Supabase...' : 'Sign In to Admin Portal'}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
