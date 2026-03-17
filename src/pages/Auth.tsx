import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Mail, Lock, Sparkles } from "lucide-react";

// IMPORTAÇÃO DA LOGOMARCA
import logoImg from "@/assets/logo-fabbis.jpeg";

export default function Auth() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Bem-vinda de volta, Fabi! ✨");
        navigate("/");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Conta criada! Agora você já pode entrar.");
        setIsLogin(true);
      }
    } catch (error: any) {
      toast.error(error.message || "Dados incorretos, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFBFC] p-6 font-sans">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
      </style>

      {/* ELEMENTOS DE FUNDO DECORATIVOS */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-40">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-100 rounded-full blur-[120px]" />
      </div>

      <Card className="w-full max-w-[440px] p-10 space-y-8 rounded-[3.5rem] border-none shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-xl">

        {/* LOGO E BOAS-VINDAS */}
        <div className="text-center flex flex-col items-center">
          <div className="relative mb-4">
             <div className="absolute inset-0 bg-pink-200 blur-2xl opacity-20 scale-150 rounded-full" />
             <img src={logoImg} alt="Logomarca Fabbis" className="h-40 w-auto object-contain relative z-10 rounded-3xl" />
          </div>

          <h1 className="leading-tight flex flex-col items-center mt-2">
            <span className="text-6xl text-pink-500" style={{ fontFamily: "'Allura', cursive" }}>
                {isLogin ? "Bem-vinda" : "Junte-se"}
            </span>
            <span className="text-xs font-black text-slate-400 uppercase tracking-[0.4em] -mt-2" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                Boutique Ateliê
            </span>
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-5">
            {/* CAMPO DE E-MAIL */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 ml-4">
                <Mail className="h-3 w-3 text-cyan-500" />
                <Label htmlFor="email" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Seu E-mail</Label>
              </div>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@fabbis.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-700 focus-visible:ring-pink-500 transition-all"
              />
            </div>

            {/* CAMPO DE SENHA */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 ml-4">
                <Lock className="h-3 w-3 text-pink-500" />
                <Label htmlFor="password" className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Sua Senha</Label>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-14 rounded-2xl bg-slate-50 border-none px-6 font-bold text-slate-700 focus-visible:ring-pink-500 transition-all"
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-16 bg-slate-900 hover:bg-black text-white font-black rounded-[2rem] text-sm uppercase tracking-[0.2em] shadow-xl shadow-slate-200 transition-all active:scale-95 group"
            disabled={loading}
          >
            {loading ? (
                <Loader2 className="animate-spin h-5 w-5" />
            ) : (
                <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-pink-400 group-hover:animate-pulse" />
                    <span>{isLogin ? "Acessar Painel" : "Criar Minha Conta"}</span>
                </div>
            )}
          </Button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-black text-slate-300 uppercase tracking-widest hover:text-cyan-500 transition-colors"
          >
            {isLogin ? "Não tem uma conta? Cadastre-se aqui" : "Já possui acesso? Clique para entrar"}
          </button>
        </div>
      </Card>

      <p className="fixed bottom-8 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">
        Fabbis Beachwear &copy; 2026
      </p>
    </div>
  );
}