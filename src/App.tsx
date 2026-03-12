import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Pedidos from "./pages/Pedidos";
import NovoPedido from "./pages/NovoPedido";
import Clientes from "./pages/Clientes";
import NovoCliente from "./pages/NovoCliente";
import NotFound from "./pages/NotFound";
import EditarCliente from "@/pages/EditarCliente.tsx";
import EditarPedido from "@/pages/EditarPedido.tsx";
import Materiais from "./pages/Materiais";
import Agenda from "./pages/Agenda";
import Financeiro from "./pages/Financeiro";
import Catalogo from "./pages/Catalogo";
import NovoMaterial from "./pages/NovoMaterial";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* ROTAS PÚBLICAS (Abrem sem login) */}
          <Route path="/Catalogo" element={<Catalogo />} />
          <Route path="/auth" element={<Auth />} />

          {/* ROTAS PRIVADAS (Gestão do Ateliê) */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/pedidos" element={<Pedidos />} />
          <Route path="/pedidos/novo" element={<NovoPedido />} />
          <Route path="/pedidos/editar/:id" element={<EditarPedido />} />

          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/novo" element={<NovoCliente />} />
          <Route path="/clientes/editar/:id" element={<EditarCliente />} />

          <Route path="/materiais" element={<Materiais />} />
          <Route path="/materiais/novo" element={<NovoMaterial />} />
          <Route path="/materiais/editar/:id" element={<NovoMaterial />} />

          <Route path="/agenda" element={<Agenda />} />
          <Route path="/financeiro" element={<Financeiro />} />

          {/* ROTA DE ERRO (Sempre por último) */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
