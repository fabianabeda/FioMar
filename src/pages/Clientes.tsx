import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    ArrowLeft,
    Plus,
    Search,
    Edit,
    Trash2,
    Phone,
    Mail,
    MapPin,
    MessageCircle,
    User,
    Heart
} from "lucide-react";
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
    if (!session) navigate("/auth");
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
      toast.error("Erro ao carregar clientes");
    } finally {
      setLoading(false);
    }
  };

  const filterClientes = () => {
    const filtered = clientes.filter((cliente) =>
      cliente.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      cliente.telefone.includes(searchTerm) ||
      (cliente.email?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredClientes(filtered);
  };

  const handleDelete = async (id: string, nome: string) => {
    if (!confirm(`Deseja remover o cadastro de ${nome}?`)) return;
    try {
      const { error } = await supabase.from("clientes").delete().eq("id", id);
      if (error) throw error;
      toast.success("Cliente removida!");
      loadClientes();
    } catch (error) {
      toast.error("Erro ao excluir. Verifique se há pedidos vinculados.");
    }
  };

  const abrirWhatsApp = (telefone: string, nome: string) => {
    const numeroLimpo = telefone.replace(/\D/g, '');
    const mensagem = `Olá, ${nome}! Tudo bem? ✨`;
    window.open(`https://wa.me/55${numeroLimpo}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center font-black text-cyan-500 uppercase tracking-widest">
      Buscando contatos...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
      </style>

      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <img src={logoImg} alt="Fabbis" className="h-12 w-auto rounded-lg" />
          <Button variant="ghost" size="sm" className="font-bold text-slate-400" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* TÍTULO ESTILO VITRINE */}
        <div className="flex flex-col md:flex-row justify-between items-end gap-6 mb-10 text-center md:text-left">
          <div>
            <h1 className="leading-tight flex flex-col md:flex-row md:items-baseline">
              <span className="text-7xl md:text-8xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>Minhas</span>
              <span className="text-2xl md:text-4xl font-black text-slate-400 uppercase tracking-[0.2em] ml-0 md:ml-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>Clientes</span>
            </h1>
            <div className="flex items-center gap-4 mt-4 justify-center md:justify-start">
              <div className="h-[2px] w-12 bg-cyan-200 hidden md:block"></div>
              <p className="text-slate-500 font-bold tracking-[0.3em] text-sm md:text-base uppercase" style={{ fontFamily: "'Montserrat', sans-serif" }}>Relacionamento & Contatos</p>
            </div>
          </div>
          <Button
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black h-14 px-8 shadow-xl transition-all hover:scale-105 w-full md:w-auto"
            onClick={() => navigate("/clientes/novo")}
          >
            <Plus className="h-6 w-6 mr-2" /> ADICIONAR CLIENTE
          </Button>
        </div>

        {/* BARRA DE BUSCA CHIQUE */}
        <div className="relative mb-12">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-slate-300" />
          <Input
            placeholder="Pesquisar por nome, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-16 h-16 rounded-[1.5rem] border-none shadow-sm bg-white text-lg placeholder:text-slate-300 focus:ring-2 focus:ring-cyan-500/20 transition-all"
          />
        </div>

        {/* GRID DE CARDS */}
        {filteredClientes.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-[3rem] shadow-sm border border-slate-50">
            <User className="h-16 w-16 text-slate-100 mx-auto mb-4" />
            <p className="text-slate-400 font-bold uppercase tracking-widest">Nenhuma cliente encontrada</p>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {filteredClientes.map((cliente) => (
              <Card key={cliente.id} className="p-8 hover:shadow-2xl transition-all border-none rounded-[2.5rem] bg-white group flex flex-col relative overflow-hidden">

                {/* Detalhe decorativo no card */}
                <div className="absolute -top-6 -right-6 h-24 w-24 bg-cyan-50 rounded-full group-hover:bg-cyan-100 transition-colors" />
                <Heart className="absolute top-6 right-6 h-5 w-5 text-cyan-200" />

                <div className="flex-grow space-y-6 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-[1.5rem] bg-cyan-500 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-cyan-100">
                      {cliente.nome_completo.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-black text-xl text-slate-800 leading-tight uppercase truncate max-w-[180px]" style={{ fontFamily: "'Montserrat', sans-serif" }}>
                        {cliente.nome_completo}
                      </h3>
                      <p className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">Cliente Fabbis</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-4 group/item">
                      <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover/item:text-cyan-500 transition-colors"><Phone className="h-5 w-5" /></div>
                      <span className="text-sm font-bold text-slate-600">{cliente.telefone}</span>
                    </div>

                    {cliente.email && (
                      <div className="flex items-center gap-4 group/item">
                        <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover/item:text-cyan-500 transition-colors"><Mail className="h-5 w-5" /></div>
                        <span className="text-sm font-bold text-slate-600 truncate">{cliente.email}</span>
                      </div>
                    )}

                    {cliente.endereco && (
                      <div className="flex items-start gap-4 group/item">
                        <div className="bg-slate-50 p-3 rounded-xl text-slate-400 group-hover/item:text-cyan-500 transition-colors"><MapPin className="h-5 w-5" /></div>
                        <span className="text-sm font-bold text-slate-600 line-clamp-2 leading-relaxed">{cliente.endereco}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-8 mt-6 border-t border-slate-50 relative z-10">
                  <Button
                    className="bg-[#22C55E] hover:bg-[#16A34A] text-white font-black rounded-2xl flex-1 h-12 shadow-lg shadow-green-100 transition-all active:scale-95"
                    onClick={() => abrirWhatsApp(cliente.telefone, cliente.nome_completo)}
                  >
                    <MessageCircle className="h-5 w-5 mr-2" /> WHATSAPP
                  </Button>

                  <Button
                    variant="outline"
                    className="rounded-2xl border-slate-100 text-slate-400 hover:text-cyan-600 hover:border-cyan-100 h-12 px-4 shadow-sm"
                    onClick={() => navigate(`/clientes/editar/${cliente.id}`)}
                  >
                    <Edit className="h-5 w-5" />
                  </Button>

                  <Button
                    variant="ghost"
                    className="rounded-2xl text-slate-300 hover:text-red-500 hover:bg-red-50 h-12 px-4"
                    onClick={() => handleDelete(cliente.id, cliente.nome_completo)}
                  >
                    <Trash2 className="h-5 w-5" />
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