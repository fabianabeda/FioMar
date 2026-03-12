import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
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
            toast.error(pgError.message || "Erro ao carregar dados do cliente.");
            navigate("/clientes");
        } finally {
            setInitialLoading(false);
        }
    };

    // --- FUNÇÃO QUE FORMATA O TELEFONE AUTOMATICAMENTE MANTIDA ---
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
    // ----------------------------------------------------------

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Sessão expirada. Por favor, faça login novamente.");

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

            toast.success("Cadastro atualizado com sucesso!");
            navigate("/clientes");
        } catch (error) {
            const pgError = error as PostgrestError;
            console.error("Erro ao atualizar cliente:", pgError);
            toast.error(pgError.message || "Erro ao atualizar cliente");
        } finally {
            setLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center font-bold text-cyan-600">
                <Loader2 className="animate-spin h-6 w-6 mr-2" />
                Carregando ficha...
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 pb-12">
            {/* CABEÇALHO CLEAN */}
            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/clientes")} className="text-slate-500 rounded-full hover:bg-slate-100">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-black text-slate-900 uppercase tracking-tight">Editar Cliente</h1>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8 text-center md:text-left">
                    <h1 className="text-3xl font-black text-slate-900">Atualizar Cadastro</h1>
                    <p className="text-slate-500 text-sm mt-1">Altere as informações de {formData.nome_completo}</p>
                </div>

                <Card className="p-8 rounded-[2rem] border-none shadow-sm bg-white">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="nome_completo" className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
                                Nome Completo *
                            </Label>
                            <Input
                                id="nome_completo"
                                value={formData.nome_completo}
                                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                                required
                                className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-900 focus-visible:ring-cyan-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="telefone" className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
                                Telefone / WhatsApp *
                            </Label>
                            <Input
                                id="telefone"
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={formData.telefone}
                                onChange={handleTelefoneChange}
                                required
                                className="h-12 rounded-xl bg-slate-50 border-slate-200 font-bold text-slate-900 focus-visible:ring-cyan-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
                                E-mail <span className="text-slate-400 font-normal capitalize tracking-normal">(Opcional)</span>
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="cliente@email.com"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="h-12 rounded-xl bg-slate-50 border-slate-200 focus-visible:ring-cyan-500"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endereco" className="font-bold text-slate-700 uppercase tracking-widest text-[10px]">
                                Endereço para Entrega <span className="text-slate-400 font-normal capitalize tracking-normal">(Opcional)</span>
                            </Label>
                            <Textarea
                                id="endereco"
                                placeholder="Rua, Número, Bairro, CEP..."
                                value={formData.endereco || ''}
                                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                rows={4}
                                className="rounded-xl bg-slate-50 border-slate-200 resize-none focus-visible:ring-cyan-500"
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-6 mt-4 border-t border-slate-100">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="flex-1 h-14 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-xl text-lg shadow-lg shadow-cyan-100 uppercase tracking-wide"
                            >
                                {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : <Save className="h-5 w-5 mr-2" />}
                                {loading ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
                            </Button>

                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/clientes")}
                                className="h-14 px-8 font-bold text-slate-500 rounded-xl border-slate-200 hover:bg-slate-50"
                            >
                                CANCELAR
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}