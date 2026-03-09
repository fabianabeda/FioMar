import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
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

    // --- NOVA FUNÇÃO QUE FORMATA O TELEFONE AUTOMATICAMENTE ---
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

            toast.success("Cliente atualizado com sucesso!");
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
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img src={logoImg} alt="Logomarca Fabbis" className="h-32 w-auto object-contain" />
                        <div>
                            <p className="text-sm text-muted-foreground font-medium">Editar Cliente</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => navigate("/clientes")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-2xl">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Editar Cliente</h1>
                    <p className="text-muted-foreground">Atualize os dados do cliente</p>
                </div>

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
                                value={formData.telefone}
                                onChange={handleTelefoneChange} // <-- Usando a função nova aqui
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

                        <div className="flex gap-4 pt-4">
                            <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? "Salvando..." : "Salvar Alterações"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => navigate("/clientes")}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </Card>
            </main>
        </div>
    );
}