import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

// IMPORTAÇÃO DA LOGOMARCA
import logoImg from "@/assets/logo-fabbis.jpeg";

interface ClienteData {
    nome_completo: string;
    telefone: string;
    email?: string | null;
    endereco?: string | null;
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

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) navigate("/auth");
    };

    // Função de máscara de telefone
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
        setFormData({ ...formData, telefone: formatarTelefone(e.target.value) });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Sessão expirada. Faça login novamente.");

            // AQUI USAMOS .insert() em vez de .update()
            const { error } = await supabase
                .from("clientes")
                .insert({
                    user_id: user.id,
                    nome_completo: formData.nome_completo,
                    telefone: formData.telefone,
                    email: formData.email || null,
                    endereco: formData.endereco || null,
                });

            if (error) throw error;

            toast.success("Cliente cadastrado com sucesso!");
            navigate("/clientes");
        } catch (error: any) {
            toast.error(error.message || "Erro ao cadastrar cliente");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logoImg} alt="Logomarca Fabbis" className="h-24 w-auto object-contain" />
                        <p className="text-sm text-muted-foreground font-medium">Novo Cliente</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/clientes")}>
                        <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <h1 className="text-3xl font-bold mb-6">Cadastrar Cliente</h1>
                <Card className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="nome_completo">Nome Completo *</Label>
                            <Input
                                id="nome_completo"
                                value={formData.nome_completo}
                                onChange={(e) => setFormData({ ...formData, nome_completo: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                            <Input
                                id="telefone"
                                type="tel"
                                placeholder="(00) 00000-0000"
                                value={formData.telefone}
                                onChange={handleTelefoneChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email || ''}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Textarea
                                id="endereco"
                                value={formData.endereco || ''}
                                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <Button type="submit" disabled={loading} className="w-full h-12 text-lg">
                            {loading ? "Salvando..." : "Cadastrar Cliente"}
                        </Button>
                    </form>
                </Card>
            </main>
        </div>
    );
}