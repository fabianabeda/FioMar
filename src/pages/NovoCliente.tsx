import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2, UserPlus, Phone, Mail, MapPin } from "lucide-react";
import { toast } from "sonner";
import { PostgrestError } from "@supabase/supabase-js";
import logoImg from "@/assets/logo-fabbis.jpeg";

interface ClienteData {
    nome_completo: string;
    telefone: string;
    email: string;
    endereco: string;
}

export default function NovoCliente() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<ClienteData>({
        nome_completo: "",
        telefone: "",
        email: "",
        endereco: "",
    });

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
                .insert([{
                    nome_completo: formData.nome_completo,
                    telefone: formData.telefone,
                    email: formData.email || null,
                    endereco: formData.endereco || null,
                }]);

            if (error) throw error;

            toast.success("Nova cliente adicionada ao seu portfólio! ✨");
            navigate("/clientes");
        } catch (error) {
            const pgError = error as PostgrestError;
            toast.error(pgError.message || "Erro ao criar cliente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
            </style>

            <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <img
                        src={logoImg}
                        alt="Fabbis"
                        className="h-10 w-auto rounded-lg cursor-pointer"
                        onClick={() => navigate("/")}
                    />
                    <Button variant="ghost" size="sm" className="font-bold text-slate-400" onClick={() => navigate("/clientes")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Clientes
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-10 max-w-2xl">
                {/* TÍTULO ESTILIZADO */}
                <div className="text-center mb-10">
                    <h1 className="leading-tight flex flex-col items-center">
                        <span className="text-7xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>Nova</span>
                        <span className="text-2xl font-black text-slate-400 uppercase tracking-[0.2em] -mt-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Cliente</span>
                    </h1>
                </div>

                <Card className="p-8 md:p-10 rounded-[3rem] border-none shadow-xl shadow-slate-100 bg-white">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* NOME COMPLETO */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 ml-1">
                                <UserPlus className="h-3 w-3 text-cyan-500" />
                                <Label htmlFor="nome_completo" className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                                    Nome da Cliente *
                                </Label>
                            </div>
                            <Input
                                id="nome_completo"
                                placeholder="Como ela se chama?"
                                value={formData.nome_completo}
                                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                                required
                                className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-cyan-500 text-lg"
                            />
                        </div>

                        {/* TELEFONE E EMAIL */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-1">
                                    <Phone className="h-3 w-3 text-cyan-500" />
                                    <Label htmlFor="telefone" className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                                        WhatsApp *
                                    </Label>
                                </div>
                                <Input
                                    id="telefone"
                                    type="tel"
                                    placeholder="(00) 90000-0000"
                                    value={formData.telefone}
                                    onChange={handleTelefoneChange}
                                    required
                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-cyan-500"
                                />
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 ml-1">
                                    <Mail className="h-3 w-3 text-cyan-500" />
                                    <Label htmlFor="email" className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                                        E-mail
                                    </Label>
                                </div>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="opcional@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="h-14 rounded-2xl bg-slate-50 border-none font-bold text-slate-700 focus-visible:ring-cyan-500"
                                />
                            </div>
                        </div>

                        {/* ENDEREÇO */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 ml-1">
                                <MapPin className="h-3 w-3 text-cyan-500" />
                                <Label htmlFor="endereco" className="font-black text-slate-400 uppercase tracking-widest text-[10px]">
                                    Endereço de Entrega
                                </Label>
                            </div>
                            <Textarea
                                id="endereco"
                                placeholder="Rua, número, bairro e cidade..."
                                value={formData.endereco}
                                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                rows={4}
                                className="rounded-[1.5rem] bg-slate-50 border-none font-medium text-slate-600 resize-none focus-visible:ring-cyan-500 p-4"
                            />
                        </div>

                        {/* BOTÕES DE AÇÃO */}
                        <div className="flex flex-col gap-4 pt-6">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="h-20 bg-cyan-600 hover:bg-cyan-700 text-white font-black rounded-[2rem] text-lg shadow-xl shadow-cyan-100 uppercase tracking-[0.2em] transition-all active:scale-95"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin h-6 w-6" />
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <Save className="h-5 w-5" />
                                        <span>Confirmar Cadastro</span>
                                    </div>
                                )}
                            </Button>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => navigate("/clientes")}
                                className="h-12 font-black text-slate-300 uppercase tracking-widest text-[10px] hover:text-rose-500"
                            >
                                Desistir e Voltar
                            </Button>
                        </div>
                    </form>
                </Card>

                <p className="text-center mt-8 text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">
                    Fabbis Boutique • Curadoria de Clientes
                </p>
            </main>
        </div>
    );
}