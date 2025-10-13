// pages/Pedidos.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Plus, Search, Edit, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Pedido {
    id: string;
    clientes: { nome_completo: string; };
    produto: string;
    modelo_cima: string;
    modelo_baixo: string;
    tamanho?: string; // <--- CORRIGIDO: Adicionado '?' para ser opcional
    cor_frente: string;
    cor_verso: string;
    data_entrega: string;
    valor: number;
    status: string;
    foto_url?: string | null; // <--- CORRIGIDO: Adicionado '?' para ser opcional
}


const statusConfig: Record<string, { label: string; color: string }> = {
    pendente: { label: "Pendente", color: "bg-yellow-500" },
    em_producao: { label: "Em Produção", color: "bg-blue-500" },
    concluido: { label: "Concluído", color: "bg-green-600" },
    entregue: { label: "Entregue", color: "bg-green-700" },
    cancelado: { label: "Cancelado", color: "bg-red-600" },
};

export default function Pedidos() {
    const navigate = useNavigate();
    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [filteredPedidos, setFilteredPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");

    useEffect(() => {
        checkAuth();
        loadPedidos();
    }, []);

    useEffect(() => {
        filterPedidos();
    }, [searchTerm, statusFilter, pedidos]);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) navigate("/auth");
    };

    const loadPedidos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.from("pedidos").select(`*, clientes (nome_completo)`).order("data_entrega", { ascending: true });
            if (error) throw error;
            setPedidos(data || []);
        } catch (error) {
            toast.error("Erro ao carregar pedidos");
        } finally {
            setLoading(false);
        }
    };

    const filterPedidos = () => {
        let filtered = [...pedidos];
        if (searchTerm) {
            filtered = filtered.filter((p) => p.clientes.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (statusFilter !== "all") {
            filtered = filtered.filter((p) => p.status === statusFilter);
        }
        setFilteredPedidos(filtered);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir este pedido?")) return;
        try {
            const { error } = await supabase.from("pedidos").delete().eq("id", id);
            if (error) throw error;
            toast.success("Pedido excluído com sucesso");
            loadPedidos();
        } catch (error) {
            toast.error("Erro ao excluir pedido");
        }
    };

    const handleStatusChange = async (pedidoId: string, newStatus: string) => {
        try {
            const { error } = await supabase.from("pedidos").update({ status: newStatus }).eq("id", pedidoId);
            if (error) throw error;
            toast.success(`Pedido atualizado para "${statusConfig[newStatus].label}"`);
            loadPedidos();
        } catch (error) {
            toast.error("Erro ao atualizar status do pedido.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background">
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4"><Button variant="ghost" size="sm" onClick={() => navigate("/")}><ArrowLeft className="h-4 w-4 mr-2" />Voltar</Button><h1>Pedidos</h1></div>
                        <Button onClick={() => navigate("/pedidos/novo")}><Plus className="h-4 w-4 mr-2" />Novo Pedido</Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Buscar por cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" /></div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
                        <SelectContent><SelectItem value="all">Todos</SelectItem>{Object.keys(statusConfig).map(key => <SelectItem key={key} value={key}>{statusConfig[key].label}</SelectItem>)}</SelectContent>
                    </Select>
                </div>

                {filteredPedidos.length === 0 ? (
                    <Card className="p-12 text-center"><p className="text-muted-foreground">Nenhum pedido encontrado</p></Card>
                ) : (
                    <div className="grid gap-4">
                        {filteredPedidos.map((pedido) => (
                            <Card key={pedido.id} className="p-6 hover:shadow-lg transition-shadow">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                    {/* EXIBE A FOTO SE ELA EXISTIR */}
                                    {pedido.foto_url && (
                                        <a href={pedido.foto_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
                                            <img src={pedido.foto_url} alt="Referência" className="rounded-md object-cover h-24 w-24 border" />
                                        </a>
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="font-semibold text-lg">{pedido.clientes.nome_completo}</h3>
                                            <Badge className={`${statusConfig[pedido.status]?.color || 'bg-gray-400'} text-white`}>{statusConfig[pedido.status]?.label || pedido.status}</Badge>
                                        </div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p><span className="font-medium">Produto:</span> {pedido.produto} ({pedido.tamanho}) - {pedido.modelo_cima} / {pedido.modelo_baixo}</p>
                                            <p><span className="font-medium">Cores:</span> {pedido.cor_frente} / {pedido.cor_verso}</p>
                                            <p><span className="font-medium">Entrega:</span> {format(new Date(pedido.data_entrega), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
                                            <p><span className="font-medium">Valor:</span> R$ {Number(pedido.valor).toFixed(2)}</p>
                                        </div>
                                    </div>

                                    {/* BOTÕES DE AÇÃO ATUALIZADOS */}
                                    <div className="flex items-center gap-2 self-start sm:self-center">
                                        <Button variant="outline" size="sm" onClick={() => navigate(`/pedidos/editar/${pedido.id}`)}><Edit className="h-4 w-4" /></Button>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Mudar Status</DropdownMenuLabel>
                                                {Object.keys(statusConfig).map((statusKey) => (<DropdownMenuItem key={statusKey} disabled={pedido.status === statusKey} onClick={() => handleStatusChange(pedido.id, statusKey)}>{statusConfig[statusKey].label}</DropdownMenuItem>))}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(pedido.id)}><Trash2 className="mr-2 h-4 w-4" /><span>Excluir</span></DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
