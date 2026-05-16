import { createFileRoute } from "@tanstack/react-router";
import { CATEGORIES } from "@/lib/mock/categories";

export const Route = createFileRoute("/dashboard/profile")({
  component: ProfileEditor,
});

function ProfileEditor() {
  return (
    
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-6">
                <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Informações Básicas</h3>
                
                <div className="space-y-6">
                  
                  {/* Tipo de Negócio Toggle */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">O que você oferece?</label>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                      <button
                        onClick={() => setBusinessType('Serviço')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${businessType === 'Serviço' ? 'bg-white text-[#1A5336] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Serviços
                      </button>
                      <button
                        onClick={() => setBusinessType('Produto')}
                        className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${businessType === 'Produto' ? 'bg-white text-[#1A5336] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                      >
                        Produtos
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nome do Negócio</label>
                    <input type="text" defaultValue="Tacos do Chef" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336] focus:ring-1 focus:ring-[#1A5336]" />
                  </div>

                  {/* Categoria Dinâmica */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Categoria Principal</label>
                    <div className="relative">
                      <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336] appearance-none">
                        {activeCategories.map((c, i) => <option key={i}>{c}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Telefone / WhatsApp</label>
                    <input type="text" placeholder="Ex: 021 000 0000" defaultValue="021 999 8888" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336]" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Cidades de Atendimento</label>
                    <div className="relative">
                      <select className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336] appearance-none">
                        {nzCities.map((c, i) => <option key={i}>{c}</option>)}
                      </select>
                      <ChevronDown size={16} className="absolute right-4 top-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Palavras-chave / Hashtags */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Palavras-chave (Hashtags)</label>
                    <input type="text" placeholder="Ex: #tacos #comidamexicana #auckland" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336]" />
                    <p className="text-xs text-gray-500 mt-1">Ajuda os clientes a encontrarem seu negócio mais rápido nas buscas.</p>
                  </div>

                  {/* Horário de Funcionamento */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <label className="block text-sm font-bold text-gray-700">Horário de Funcionamento</label>
                      {plan === 'Básico' && <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-bold">Upgrade para horários avançados</span>}
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="w-24 text-sm font-medium text-gray-600">Seg - Sex</span>
                        <input type="time" defaultValue="09:00" className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none" />
                        <span className="text-gray-400">-</span>
                        <input type="time" defaultValue="18:00" className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-24 text-sm font-medium text-gray-600">Sábado</span>
                        <input type="time" defaultValue="10:00" className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none" />
                        <span className="text-gray-400">-</span>
                        <input type="time" defaultValue="14:00" className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-sm outline-none" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-24 text-sm font-medium text-gray-600">Domingo</span>
                        <button className="bg-gray-100 text-gray-500 text-xs px-3 py-1.5 rounded-md font-bold hover:bg-gray-200 transition-colors">
                          + Adicionar horário
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="block text-sm font-bold text-gray-700">Descrição Completa</label>
                      <span className="text-xs text-gray-400">240/500</span>
                    </div>
                    <textarea rows="4" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 outline-none focus:border-[#1A5336] resize-none" defaultValue="Autêntica comida mexicana com ingredientes frescos locais. Servindo a comunidade com os melhores tacos e burritos."></textarea>
                  </div>
                  
                <button className="bg-[#1A5336] hover:bg-[#123F27] text-white font-bold rounded-xl px-6 py-2.5 text-sm">
                Salvar alterações
                </button>
                </div>
              </div>

              <div className="w-full lg:w-80 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col items-center text-center">
                  <h3 className="font-bold text-gray-900 mb-4 w-full text-left">Seu QR Code</h3>
                  <div className="w-32 h-32 bg-gray-50 border border-gray-200 rounded-xl p-2 mb-4 flex items-center justify-center">
                    <QrCode size={100} className="text-gray-800" strokeWidth={1} />
                  </div>
                  <button className="w-full flex items-center justify-center gap-2 bg-[#0B2C1A] text-white font-bold py-2.5 rounded-xl text-sm hover:bg-[#1A5336] transition-colors">
                    <Download size={16} /> Baixar
                  </button>
                </div>
              </div>
            </div>

      </form>
    </div>
  );
}
