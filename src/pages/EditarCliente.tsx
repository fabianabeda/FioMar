import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, UserCircle2 } from "lucide-react";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";

// IMPORTAÇÃO DA LOGOMARCA
import logoImg from "@/assets/logo-fabbis.jpeg";

interface ClienteData {
    nome_completo: string;
    telefone: string;
    email?: string | null;
    endereco?: string | null;
}

export default function EditarCliente() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [formData, setFormData] = useState<ClienteData>({
        nome_completo: "",
        telefone: "",
        email: "",
        endereco: "",
    });

    useEffect(() => {
        const carregarDados = async () => {
            await checkAuth();
            await loadClienteData();
        };
        carregarDados();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) navigate("/auth");
    };

    const loadClienteData = async () => {
        if (!id) {
            toast.error("ID do cliente não encontrado.");
            navigate("/clientes");
            return;
        }
        try {
            const { data, error } = await supabase
                .from("clientes")
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    nome_completo: data.nome_completo,
                    telefone: data.telefone,
                    email: data.email,
                    endereco: data.endereco,
                });
            }
        } catch (error) {
            const pgError = error as PostgrestError;
            toast.error(pgError.message || "Erro ao carregar dados.");
            navigate("/clientes");
        } finally {
            setInitialLoading(false);
        }
    };

    const formatarTelefone = (valor: string) => {
        if (!valor) return "";
        const apenasNumeros = valor.replace(/\D/g, "").substring(0, 11);
        let formatado = apenasNumeros;
        if (apenasNumeros.length > 2) {
            formatado = `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2)}`;
        }
        if (apenasNumeros.length > 7) {
            formatado = `(${apenasNumeros.substring(0, 2)}) ${apenasNumeros.substring(2, 7)}-${apenasNumeros.substring(7)}`;
        }
        return formatado;
    };

    const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const telefoneFormatado = formatarTelefone(e.target.value);
        setFormData({ ...formData, telefone: telefoneFormatado });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from("clientes")
                .update({
                    nome_completo: formData.nome_completo,
                    telefone: formData.telefone,
                    email: formData.email || null,
                    endereco: formData.endereco || null,
                })
                .eq("id", id);

            if (error) throw error;

            toast.success("Ficha atualizada com sucesso! ✨");
            navigate("/clientes");
        } catch (error) {
            toast.error("Erro ao atualizar dados.");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center font-black text-cyan-600 uppercase tracking-widest">
                <Loader2 className="animate-spin h-6 w-6 mr-3" />
                Abrindo Ficha...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
            </style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-12 w-auto rounded-lg shadow-sm" />
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate("/clientes")}
                        className="font-bold text-slate-400 hover:text-cyan-600"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12 max-w-2xl">
                {/* TÍTULO ESTILIZADO */}
                <div className="text-center mb-10">
                    <h1 className="leading-tight inline-flex flex-col items-center">
                        <span className="text-7xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>Editar</span>
                        <span className="text-3xl font-black text-slate-400 uppercase tracking-[0.2em] -mt-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Cadastro</span>
                    </h1>
                    <div className="flex items-center justify-center gap-3 mt-4">
                        <UserCircle2 className="h-5 w-5 text-cyan-200" />
                        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
                            Atualizando informações de {formData.nome_completo.split(' ')[0]}
                        </p>
                    </div>
                </div>

                <Card className="p-10 rounded-[3rem] border-none shadow-xl shadow-slate-200/50 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        <div className="space-y-3">
                            <Label htmlFor="nome_completo" className="font-black text-slate-400 uppercase tracking-widest text-[10px] ml-1">
                                Nome da Cliente
                            </Label>
                            <Input
                                id="nome_completo"
                                value={formData.nome_completo}
                                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                                required
                                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 text-lg px-6 focus-visible:ring-2 focus-visible:ring-cyan-500/20 shadow-inner"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="telefone" className="font-black text-slate-400 uppercase tracking-widest text-[10px] ml-1">
                                WhatsApp / Telefone
                            </Label>
                            <Input
                                id="telefone"
                                type="tel"
                                value={formData.telefone}
                                onChange={handleTelefoneChange}
                                required
                                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 text-lg px-6 focus-visible:ring-2 focus-visible:ring-cyan-500/20 shadow-inner"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="email" className="font-black text-slate-400 uppercase tracking-widest text-[10px] ml-1">
                                E-mail <span className="text-slate-300 font-medium lowercase">(opcional)</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-800 px-6 focus-visible:ring-2 focus-visible:ring-cyan-500/20 shadow-inner"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label htmlFor="endereco" className="font-black text-slate-400 uppercase tracking-widest text-[10px] ml-1">
                                Endereço de Entrega <span className="text-slate-300 font-medium lowercase">(opcional)</span>
                            </Label>
                            <Textarea
                                id="endereco"
                                value={formData.endereco || ''}
                                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                rows={4}
                                className="rounded-[2rem] bg-slate-50 border-none font-bold text-slate-700 px-6 py-4 focus-visible:ring-2 focus-visible:ring-cyan-500/20 shadow-inner resize-none"
                            />
                        </div>

                        <div className="flex flex-col gap-4 pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-16 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-2xl text-lg shadow-xl shadow-cyan-100 uppercase tracking-widest transition-all active:scale-95"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-6 w-6" />
                                ) : (
                                    <>
                                        <Save className="h-5 w-5 mr-3" />
                                        Confirmar Alterações
                                    </>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate("/clientes")}
                                className="h-12 font-bold text-slate-400 hover:text-red-400 hover:bg-red-50 rounded-2xl transition-colors"
                            >
                                DESCARTAR MUDANÇAS
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}