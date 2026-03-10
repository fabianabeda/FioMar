import { useEffect, useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { ArrowLeft, Plus, Search, Edit, Trash2, MoreVertical, Package, Clock, FileText } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// --- NOVOS IMPORTS PARA O RELATÓRIO ---
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import logoImg from "@/assets/logo-fabbis.jpeg";

interface Pedido {
    id: string;
    clientes: { nome_completo: string; };
    produto: string;
    modelo_cima: string;
    modelo_baixo: string;
    tamanho?: string;
    cor_frente: string;
    cor_verso: string;
    data_entrega: string;
    valor: number;
    status: string;
    foto_url?: string | null;
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
    const [searchParams, setSearchParams] = useSearchParams();

    const [pedidos, setPedidos] = useState<Pedido[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const currentStatus = searchParams.get("status") || "all";

    useEffect(() => {
        checkAuth();
        loadPedidos();
    }, []);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) navigate("/auth");
    };

    const loadPedidos = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("pedidos")
                .select(`*, clientes (nome_completo)`)
                .order("data_entrega", { ascending: true });
            if (error) throw error;
            setPedidos(data || []);
        } catch (error) {
            toast.error("Erro ao carregar pedidos");
        } finally {
            setLoading(false);
        }
    };

    const filteredPedidos = useMemo(() => {
        return pedidos.filter((p) => {
            const matchesSearch = p.clientes?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = currentStatus === "all" || p.status === currentStatus;
            return matchesSearch && matchesStatus;
        });
    }, [pedidos, searchTerm, currentStatus]);

    // --- FUNÇÃO PARA GERAR O PDF ---
    const gerarRelatorio = () => {
        if (filteredPedidos.length === 0) {
            toast.error("Não há dados para gerar o relatório.");
            return;
        }

        const doc = new jsPDF();
        const dataHoje = format(new Date(), "dd/MM/yyyy HH:mm");
        const totalFaturado = filteredPedidos.reduce((acc, p) => acc + Number(p.valor), 0);

        // Cabeçalho do PDF
        doc.setFontSize(18);
        doc.setTextColor(33, 33, 33);
        doc.text("Relatório Fabbis - Gestão de Pedidos", 14, 20);

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Gerado em: ${dataHoje}`, 14, 28);
        doc.text(`Filtro atual: ${currentStatus === 'all' ? 'Todos' : statusConfig[currentStatus]?.label}`, 14, 33);

        // Tabela de Dados
        const colunas = ["Cliente", "Peça", "Entrega", "Status", "Valor"];
        const linhas = filteredPedidos.map(p => [
            p.clientes?.nome_completo || "S/ Nome",
            `${p.produto} (${p.tamanho})`,
            format(new Date(p.data_entrega), "dd/MM/yyyy"),
            statusConfig[p.status]?.label || p.status,
            `R$ ${Number(p.valor).toFixed(2)}`
        ]);

        autoTable(doc, {
            head: [colunas],
            body: linhas,
            startY: 40,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [0, 0, 0] }, // Preto elegante
            foot: [["", "", "", "TOTAL:", `R$ ${totalFaturado.toFixed(2)}`]],
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
        });

        doc.save(`relatorio-fabbis-${format(new Date(), "yyyy-MM-dd")}.pdf`);
        toast.success("PDF gerado com sucesso!");
    };

    const handleStatusChange = async (pedidoId: string, newStatus: string) => {
        try {
            const { error } = await supabase.from("pedidos").update({ status: newStatus }).eq("id", pedidoId);
            if (error) throw error;
            toast.success("Status atualizado");
            loadPedidos();
        } catch (error) {
            toast.error("Erro ao atualizar status");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Excluir pedido?")) return;
        await supabase.from("pedidos").delete().eq("id", id);
        loadPedidos();
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-muted to-background pb-10">
            <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-4 py-2 flex items-center justify-between">
                    <img src={logoImg} alt="Fabbis" className="h-24 w-auto object-contain cursor-pointer" onClick={() => navigate("/")} />
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => navigate("/")}><ArrowLeft className="h-4 w-4 mr-2" /> Voltar</Button>

                        {/* BOTÃO DE RELATÓRIO */}
                        <Button variant="outline" size="sm" onClick={gerarRelatorio} className="border-primary text-primary hover:bg-primary/5">
                            <FileText className="h-4 w-4 mr-2" /> Relatório
                        </Button>

                        <Button onClick={() => navigate("/pedidos/novo")} size="sm"><Plus className="h-4 w-4 mr-2" /> Novo</Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Buscar cliente..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-11" />
                    </div>

                    <Select
                        value={currentStatus}
                        onValueChange={(val) => setSearchParams({ status: val })}
                    >
                        <SelectTrigger className="w-full sm:w-[200px] h-11">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os Pedidos</SelectItem>
                            {Object.keys(statusConfig).map(key => (
                                <SelectItem key={key} value={key}>{statusConfig[key].label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid gap-4">
                    {filteredPedidos.length === 0 ? (
                        <Card className="p-10 text-center text-muted-foreground">Nenhum pedido encontrado.</Card>
                    ) : (
                        filteredPedidos.map((pedido) => (
                            <Card key={pedido.id} className="p-5 border-l-4" style={{ borderLeftColor: `var(--${statusConfig[pedido.status]?.color})` }}>
                                <div className="flex flex-col md:flex-row gap-6 items-center">
                                    <div className="h-24 w-24 bg-muted rounded-lg overflow-hidden border">
                                        {pedido.foto_url ? <img src={pedido.foto_url} className="h-full w-full object-cover" /> : <Package className="h-full w-full p-6 opacity-20" />}
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <div className="flex flex-col md:flex-row items-center gap-2 mb-2">
                                            <h3 className="font-bold text-lg">{pedido.clientes?.nome_completo}</h3>
                                            <Badge className={`${statusConfig[pedido.status]?.color} text-white border-none`}>{statusConfig[pedido.status]?.label}</Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{pedido.produto} - {pedido.modelo_cima}/{pedido.modelo_baixo}</p>
                                        <p className="text-xs flex items-center justify-center md:justify-start gap-1 mt-1 font-medium"><Clock className="h-3 w-3" /> {format(new Date(pedido.data_entrega), "dd/MM/yyyy")}</p>
                                    </div>
                                    <div className="flex flex-col items-center md:items-end gap-2">
                                        <p className="font-black text-xl text-primary">R$ {Number(pedido.valor).toFixed(2)}</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" onClick={() => navigate(`/pedidos/editar/${pedido.id}`)}><Edit className="h-4 w-4" /></Button>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild><Button variant="ghost" size="sm" className="border h-8 w-8 p-0"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Mudar Status</DropdownMenuLabel>
                                                    {Object.keys(statusConfig).map(k => (
                                                        <DropdownMenuItem key={k} onClick={() => handleStatusChange(pedido.id, k)}>{statusConfig[k].label}</DropdownMenuItem>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(pedido.id)}>Excluir</DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}