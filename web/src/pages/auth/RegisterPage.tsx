import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useSetAtom } from "jotai";
import { authAtom, saveToken } from "@/stores/authAtom";
import { authApi } from "@/services/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  UserCheck
} from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useSetAtom(authAtom);
  const [email, setEmail] = useState("");
  const [roleTitle, setRoleTitle] = useState("Assessor");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const isLengthValid = password.length >= 6;
  const isMatch = password.length > 0 && password === passwordConfirmation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLengthValid) {
      setError("Kata sandi harus minimal 6 karakter.");
      return;
    }

    if (password !== passwordConfirmation) {
      setError("Konfirmasi kata sandi tidak cocok.");
      return;
    }

    setLoading(true);
    try {
      const res = await authApi.signup({
        email,
        password,
        password_confirmation: passwordConfirmation,
        role: "admin",
      });

      const token = res.data.token;
      saveToken(token);
      setAuth({ token });
      setSuccess(true);

      setTimeout(() => {
        navigate("/assessments");
      }, 1200);
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { errors?: Array<{ message: string }> } } })
          ?.response?.data?.errors?.[0]?.message ||
        "Gagal mendaftarkan akun. Silakan periksa kembali data Anda.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-12 overflow-hidden selection:bg-primary/20 selection:text-primary">
      {/* Ambient background decoration */}
      <div className="absolute top-1/4 -right-20 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md">
        {/* Branding header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-3 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rakamin Talent Intelligence</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Daftar Akun Assessor
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Mulai kelola asesmen wawancara, pantau sinyal kompetensi, dan evaluasi kandidat dengan AI.
          </p>
        </div>

        {/* Register card */}
        <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none p-6 sm:p-8">
          {success ? (
            <div className="text-center py-6 space-y-3 animate-in fade-in-50">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Pendaftaran Berhasil!
              </h3>
              <p className="text-xs text-slate-500">
                Mengalihkan Anda secara otomatis ke Dashboard Asesmen...
              </p>
              <Loader2 className="w-5 h-5 text-primary animate-spin mx-auto mt-4" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-start gap-2.5 animate-in fade-in-50">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="reg-email" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email Profesional / Perusahaan
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="reg-email"
                    type="email"
                    autoComplete="email"
                    placeholder="nama@perusahaan.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-10 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-role" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Peran Penilai (Role)
                </Label>
                <div className="relative">
                  <UserCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    id="reg-role"
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value)}
                    className="w-full pl-10 pr-4 h-10 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  >
                    <option value="Assessor">Assessor / Interviewer</option>
                    <option value="Recruiter">Technical Recruiter</option>
                    <option value="Hiring Manager">Hiring Manager</option>
                    <option value="Admin">Talent Acquisition Lead</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kata Sandi
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Minimal 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-10 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-confirm-password" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Konfirmasi Kata Sandi
                </Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="reg-confirm-password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Ulangi kata sandi"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="pl-10 h-10 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-primary/20"
                    required
                  />
                </div>
              </div>

              {/* Password checklist indicators */}
              {password.length > 0 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg text-xs space-y-1.5 border border-slate-100 dark:border-slate-800">
                  <div className={`flex items-center gap-1.5 ${isLengthValid ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Minimal 6 karakter ({password.length}/6)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${isMatch ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Konfirmasi kata sandi cocok</span>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-11 rounded-lg font-medium shadow-md shadow-primary/25 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2 mt-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Mendaftarkan akun...</span>
                  </>
                ) : (
                  <>
                    <span>Buat Akun Baru</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Switch to Login */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sudah memiliki akun?{" "}
              <Link
                to="/login"
                className="font-semibold text-primary hover:underline transition-all inline-flex items-center gap-0.5"
              >
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>

        {/* Compliance footnote */}
        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-6">
          Data registrasi terlindungi di bawah ketentuan UU Perlindungan Data Pribadi (UU PDP No. 27/2022).
        </p>
      </div>
    </div>
  );
}
