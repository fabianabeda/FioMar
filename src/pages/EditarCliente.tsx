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

export default function EditarCliente() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Pega o ID do cliente da URL
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [formData, setFormData] = useState({
        nome_completo: "",
        telefone: "",
        email: "",
        endereco: "",
    });

    useEffect(() => {
        checkAuth();
        loadClienteData();
    }, [id]);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/auth");
        }
    };

    // Função para carregar os dados do cliente existente
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
                .single(); // .single() para buscar apenas um registro

            if (error) throw error;
            if (data) {
                setFormData({
                    nome_completo: data.nome_completo || "",
                    telefone: data.telefone || "",
                    email: data.email || "",
                    endereco: data.endereco || "",
                });
            }
        } catch (error: any) {
            console.error("Erro ao carregar dados do cliente:", error);
            toast.error("Erro ao carregar dados do cliente.");
            navigate("/clientes");
        } finally {
            setInitialLoading(false);
        }
    };

    // Função para ATUALIZAR o cliente
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
                .eq("id", id); // A condição para saber QUAL cliente atualizar

            if (error) throw error;

            toast.success("Cliente atualizado com sucesso!");
            navigate("/clientes");
        } catch (error: any) {
            console.error("Erro ao atualizar cliente:", error);
            toast.error(error.message || "Erro ao atualizar cliente");
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
            <header className="border-b bg-card/80 backdrop-blur-sm">
                <div className="container mx-auto px-4 py-4">
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
                                placeholder="Nome do cliente"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="telefone">Telefone/WhatsApp *</Label>
                            <Input
                                id="telefone"
                                type="tel"
                                value={formData.telefone}
                                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                placeholder="(00) 00000-0000"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="cliente@email.com"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endereco">Endereço</Label>
                            <Textarea
                                id="endereco"
                                value={formData.endereco}
                                onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                                placeholder="Rua, número, bairro, cidade..."
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
