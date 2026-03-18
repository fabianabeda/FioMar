import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    ArrowLeft,
    Save,
    Loader2,
    Package,
    Tags,
    Layers,
    AlertCircle,
    ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import logoImg from "@/assets/logo-fabbis.jpeg";

export default function NovoMaterial() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!id);

  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    quantidade: 0,
    unidade_medida: "metros",
    estoque_minimo: 1,
  });

  useEffect(() => {
    if (id) loadMaterial();
  }, [id]);

  const loadMaterial = async () => {
    try {
      const { data, error } = await supabase
        .from("materiais")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (data) setFormData(data);
    } catch (error) {
      toast.error("Erro ao carregar material");
      navigate("/materiais");
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (id) {
        const { error } = await supabase
          .from("materiais")
          .update(formData)
          .eq("id", id);
        if (error) throw error;
        toast.success("Material atualizado! ✨");
      } else {
        const { error } = await supabase
          .from("materiais")
          .insert([formData]);
        if (error) throw error;
        toast.success("Material cadastrado no estoque!");
      }
      navigate("/materiais");
    } catch (error) {
      toast.error("Erro ao salvar material");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return (
    <div className="min-h-screen flex items-center justify-center font-black text-slate-300 uppercase tracking-widest">
      Consultando prateleiras...
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFBFC] pb-12 font-sans">
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Allura&family=Montserrat:wght@400;700;900&display=swap');`}
      </style>

      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <img src={logoImg} alt="Fabbis" className="h-10 w-auto rounded-lg" />
          <Button variant="ghost" size="sm" onClick={() => navigate("/materiais")} className="font-bold text-slate-400">
            <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao Estoque
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-2xl">
        {/* TÍTULO ESTILIZADO */}
        <div className="text-center mb-10">
          <h1 className="leading-tight flex flex-col items-center">
            <span className="text-7xl text-cyan-500" style={{ fontFamily: "'Allura', cursive" }}>
              {id ? "Editar" : "Novo"}
            </span>
            <span className="text-2xl font-black text-slate-400 uppercase tracking-[0.2em] -mt-4" style={{ fontFamily: "'Montserrat', sans-serif" }}>
              Material
            </span>
          </h1>
        </div>

        <form onSubmit={handleSalvar} className="space-y-4 mt-4">
            {/* ÁREA DA FOTO (Compacta) */}
            <div
                onClick={() => inputFileRef.current?.click()}
                className="relative h-40 w-full border-2 border-dashed border-cyan-100 bg-cyan-50/20 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden group"
            >
                {previewUrl ? (
                    <img src={previewUrl} className="h-full w-full object-cover" />
                ) : (
                    <div className="text-center">
                        <Camera className="h-6 w-6 text-[#06B6D4] mx-auto mb-1" />
                        <p className="text-[9px] font-black text-[#06B6D4] uppercase tracking-widest">Foto do Material</p>
                    </div>
                )}
                <input type="file" accept="image/*" ref={inputFileRef} className="hidden" onChange={handleSelecionarFoto} />
            </div>

            {/* NOME */}
            <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest font-montserrat">Nome</label>
                <Input
                    placeholder="Ex: Lycra Shine Ouro"
                    value={novoMat.nome}
                    onChange={e => setNovoMat({...novoMat, nome: e.target.value})}
                    className="h-11 rounded-xl bg-slate-50 border-none px-4 font-bold text-slate-700"
                />
            </div>

            {/* GRID: CATEGORIA E QUANTIDADE */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest font-montserrat">Tipo</label>
                    <select
                        value={novoMat.tipo}
                        onChange={e => setNovoMat({...novoMat, tipo: e.target.value})}
                        className="w-full h-11 rounded-xl bg-slate-50 border-none px-4 font-bold text-slate-700 cursor-pointer"
                    >
                        <option value="tecido">Tecido</option>
                        <option value="linha">Linha</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2 tracking-widest font-montserrat">Qtd (Metros/Un)</label>
                    <Input
                        type="number"
                        placeholder="0.00"
                        className="h-11 rounded-xl bg-slate-50 border-none px-4 font-bold text-slate-700"
                        // onChange={(e) => setNovoMat({...novoMat, quantidade: e.target.value})}
                    />
                </div>
            </div>

            {/* AVISO SOBRE ROLETES */}
            {novoMat.tipo === 'tecido' && (
                <div className="p-3 bg-cyan-50/50 rounded-2xl border border-cyan-100/50">
                    <p className="text-[9px] text-[#06B6D4] font-bold uppercase leading-tight text-center">
                        ✨ Tecido pronto para ser selecionado como Rolete nos pedidos.
                    </p>
                </div>
            )}

            <Button
                type="submit"
                className="w-full h-14 bg-[#06B6D4] hover:bg-[#0891B2] text-white rounded-2xl font-black shadow-lg shadow-cyan-100 transition-all active:scale-95"
                disabled={salvando}
            >
                {salvando ? "SALVANDO NO ATELIÊ..." : "CADASTRAR MATERIAL"}
            </Button>
        </form>
      </main>
    </div>
  );
}