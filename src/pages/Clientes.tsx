import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Search, Edit, Trash2, Phone, Mail, MapPin, MessageCircle, User } from "lucide-react";
import { toast } from "sonner";

import logoImg from "@/assets/logo-fabbis.jpeg";

interface Cliente {
  id: string;
  nome_completo: string;
  telefone: string;
  email?: string;
  endereco?: string;
}

export default function Clientes() {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    checkAuth();
    loadClientes();
  }, []);

  useEffect(() => {
    filterClientes();
  }, [searchTerm, clientes]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("nome_completo");

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const filterClientes = () => {
    if (!searchTerm) {
      setFilteredClientes(clientes);
      return;
    }

    const filtered = clientes.filter((cliente) =>
      cliente.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm) ||
      (cliente.email && cliente.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    setFilteredClientes(filtered);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Tem certeza que deseja excluir o cadastro de ${nome}?`)) return;

    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Cliente excluída com sucesso!");
      loadClientes();
    } catch (error) {
      console.error("Erro ao excluir cliente:", error);
      toast.error("Erro ao excluir cliente. Verifique se ela possui pedidos cadastrados.");
    }
  };

  const abrirWhatsApp = (telefone: string, nome: string) => {
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = `Olá, ${nome}! Tudo bem?`;
    window.open(`https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-cyan-600">
        Carregando clientes...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* CABEÇALHO PADRÃO NOVO */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-2 flex items-center justify-between">
          <img src={logoImg} alt="Logomarca Fabbis" className="h-14 w-auto cursor-pointer" onClick={() => navigate("/")} />
          <Button variant="ghost" size="sm" className="text-slate-500" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Painel
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* TÍTULO E BOTÃO ADICIONAR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900">Clientes</h1>
            <p className="text-slate-500 text-sm mt-1">Gerencie a sua lista de contatos</p>
          </div>
          <Button
            className="w-full md:w-auto bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-cyan-100"
            onClick={() => navigate("/clientes/novo")}
          >
            <Plus className="h-5 w-5 mr-2" /> NOVO CLIENTE
          </Button>
        </div>

        {/* BARRA DE BUSCA */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              placeholder="Buscar por nome, telefone ou e-mail..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-14 rounded-2xl border-none shadow-sm bg-white font-medium text-slate-700 focus-visible:ring-cyan-500"
            />
          </div>
        </div>

        {/* LISTA DE CLIENTES */}
        {filteredClientes.length === 0 ? (
          <div className="py-20 text-center">
            <User className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-lg">Nenhum cliente encontrado.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredClientes.map((cliente) => (
              <Card key={cliente.id} className="p-6 hover:shadow-md transition-shadow border-none rounded-[2rem] bg-white flex flex-col h-full">

                <div className="flex-grow space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600 font-black text-xl flex-shrink-0">
                      {cliente.nome_completo.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="font-black text-lg text-slate-900 leading-tight">
                      {cliente.nome_completo}
                    </h3>
                  </div>

                  <div className="space-y-3 text-sm text-slate-600 font-medium">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-50 p-2 rounded-lg text-slate-400"><Phone className="h-4 w-4" /></div>
                      <span>{cliente.telefone}</span>
                    </div>

                    {cliente.email && (
                      <div className="flex items-center gap-3">
                        <div className="bg-slate-50 p-2 rounded-lg text-slate-400"><Mail className="h-4 w-4" /></div>
                        <span className="truncate">{cliente.email}</span>
                      </div>
                    )}

                    {cliente.endereco && (
                      <div className="flex items-start gap-3">
                        <div className="bg-slate-50 p-2 rounded-lg text-slate-400"><MapPin className="h-4 w-4" /></div>
                        <span className="line-clamp-2">{cliente.endereco}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-6 mt-auto border-t border-slate-50">
                  <Button
                    className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-bold rounded-xl flex-1 shadow-sm"
                    onClick={() => abrirWhatsApp(cliente.telefone, cliente.nome_completo)}
                  >
                    <MessageCircle className="h-5 w-5 mr-1" /> WhatsApp
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 px-3"
                    onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    className="rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 px-3"
                    onClick={() => handleDelete(cliente.id, cliente.nome_completo)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}