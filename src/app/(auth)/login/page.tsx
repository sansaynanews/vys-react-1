"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Lock, User, AlertCircle, Shield } from "lucide-react";

const loginSchema = z.object({
    username: z.string().min(1, "Kullanıcı adı gerekli"),
    password: z.string().min(1, "Şifre gerekli"),
});

type LoginForm = z.infer<typeof loginSchema>;

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const timeout = searchParams.get("timeout");
    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn("credentials", {
                username: data.username,
                password: data.password,
                redirect: false,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch (err) {
            setError("Bir hata oluştu. Lütfen tekrar deneyin.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md">
            {/* Logo */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl mb-4">
                    <Shield className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-white">Valilik Yönetim Sistemi</h1>
                <p className="text-blue-200 text-sm mt-1">Yönetim ve Takip Platformu</p>
            </div>

            {/* Login Card */}
            <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg mb-3">
                        <Lock className="w-6 h-6 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-800">Hoş Geldiniz</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        Sisteme giriş yapmak için bilgilerinizi girin
                    </p>
                </div>

                {/* Timeout Uyarısı */}
                {timeout && (
                    <div className="flex items-center gap-3 bg-amber-50 text-amber-700 p-4 rounded-xl mb-6 border border-amber-200">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">Oturumunuz zaman aşımına uğradı. Lütfen tekrar giriş yapın.</span>
                    </div>
                )}

                {/* Hata Mesajı */}
                {error && (
                    <div className="flex items-center gap-3 bg-red-50 text-red-600 p-4 rounded-xl mb-6 border border-red-200">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                            <User className="inline w-4 h-4 text-blue-500 mr-1" />
                            Kullanıcı Adı
                        </label>
                        <input
                            {...register("username")}
                            type="text"
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-slate-800"
                            placeholder="Kullanıcı adınızı girin"
                            autoComplete="username"
                        />
                        {errors.username && (
                            <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                            <Lock className="inline w-4 h-4 text-blue-500 mr-1" />
                            Şifre
                        </label>
                        <div className="relative">
                            <input
                                {...register("password")}
                                type={showPassword ? "text" : "password"}
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition text-slate-800"
                                placeholder="••••••••"
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Giriş yapılıyor...
                            </span>
                        ) : (
                            "Giriş Yap"
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400">
                        <Lock className="inline w-3 h-3 text-emerald-500 mr-1" />
                        256-bit SSL ile güvenli bağlantı
                    </p>
                </div>
            </div>

            {/* Copyright */}
            <div className="text-center mt-6">
                <p className="text-xs text-blue-200/60">
                    © 2026 Valilik Yönetim Sistemi
                </p>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="w-full max-w-md">
                <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
                    <p className="text-slate-500 mt-4">Yükleniyor...</p>
                </div>
            </div>
        }>
            <LoginForm />
        </Suspense>
    );
}
