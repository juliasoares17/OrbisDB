import React, { useState, useEffect, type FormEvent } from 'react';
import './styleContinentes.css';

interface Continente {
    id: number;
    nome: string;
    descricao: string;
    area_km2: number | null;
    numero_paises: number | null;
    // O BigInt do Back-end é recebido como string no Front-end
    populacao_total: string | null; 
    created_at: string;
    updated_at: string;
}

interface ContinenteData {
    nome: string;
    descricao: string;
    area_km2?: number; 
    numero_paises?: number;
    populacao_total?: string;
}

const API_URL = 'http://127.0.0.1:3001/continentes';

export default function ContinentesPage() {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [continentes, setContinentes] = useState<Continente[]>([]); 
    const [isLoading, setIsLoading] = useState(true); 
    const [novoContinente, setNovoContinente] = useState<ContinenteData>({
        nome: '',
        descricao: '',
        area_km2: undefined,
        numero_paises: undefined,
        populacao_total: undefined,
    });

    // 2. FUNÇÃO DE BUSCA (GET)
    const fetchContinentes = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Falha ao buscar continentes.');
            }
            const data: Continente[] = await response.json();
            setContinentes(data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Erro ao carregar a lista de continentes.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // 3. HOOK useEffect: Carrega os dados na montagem
    useEffect(() => {
        fetchContinentes();
    }, []); // O array vazio [] garante que a função rode apenas uma vez, na montagem do componente
    
    // 4. FUNÇÃO DE SUBMISSÃO (CREATE - POST)
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(novoContinente),
            });

            if (!response.ok) {
                const errorData = await response.json();
                alert(`Erro ao criar continente: ${errorData.error || response.statusText}`);
                return;
            }

            const data = await response.json();
            alert(`Continente "${data.nome}" criado com sucesso!`);
            
            // Ação chave: Recarrega a lista após o sucesso do POST
            fetchContinentes(); 
            
            // Limpa o formulário e o esconde
            setNovoContinente({ nome: '', descricao: '', area_km2: undefined, numero_paises: undefined, populacao_total: undefined });
            setIsFormVisible(false);

        } catch (error) {
            console.error("Erro na requisição:", error);
            alert("Erro de conexão com o servidor. Verifique se o backend está rodando.");
        }
    };

    // FUNÇÃO AUXILIAR para formatar números grandes
    const formatNumber = (value: string | number | null) => {
        if (value === null || value === undefined) return 'N/A';
        // Garante que o número seja tratado como string para BigInt
        const num = typeof value === 'string' ? BigInt(value) : value;
        return num.toLocaleString('pt-BR');
    };

    // RESTO DAS FUNÇÕES (handleInputChange, etc.)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNovoContinente(prev => ({
            ...prev,
            [name]: (name === 'area_km2' || name === 'numero_paises') 
                        ? (value ? Number(value) : undefined) 
                        : value,
        }));
    };

    return (
        <div className='conteudo_continentes'>
            <h1 className='text-xl font-bold mb-4'>🌍 Gerenciamento de Continentes</h1>
            
            {/* Bloco do Botão e Formulário (INALTERADO) */}
            <button
                className="w-full py-3 mb-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                onClick={() => setIsFormVisible(!isFormVisible)}
            >
                {isFormVisible ? 'Cancelar' : '➕ Adicionar Novo Continente'}
            </button>
            
            {isFormVisible && (
                <div className="form-container p-6 border border-gray-300 rounded-lg mb-6">
                    <h2 className="text-lg font-semibold mb-4">Novo Continente</h2>
                    <form onSubmit={handleSubmit}>
                        {/* ... campos do formulário (omitidos para brevidade) ... */}
                        
                        {/* Campo Nome */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" htmlFor="nome">Nome *</label>
                            <input type="text" id="nome" name="nome" value={novoContinente.nome} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" required/>
                        </div>
                        {/* Campo Descrição */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" htmlFor="descricao">Descrição *</label>
                            <textarea id="descricao" name="descricao" rows={3} value={novoContinente.descricao} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded" required/>
                        </div>
                        {/* Campos Opcionais */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium mb-1" htmlFor="area_km2">Área (km²)</label>
                                <input type="number" id="area_km2" name="area_km2" value={novoContinente.area_km2 === undefined ? '' : novoContinente.area_km2} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" htmlFor="numero_paises">Nº Países</label>
                                <input type="number" id="numero_paises" name="numero_paises" value={novoContinente.numero_paises === undefined ? '' : novoContinente.numero_paises} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1" htmlFor="populacao_total">População Total</label>
                                <input type="text" id="populacao_total" name="populacao_total" value={novoContinente.populacao_total || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded"/>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button type="button" className="py-2 px-4 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition" onClick={() => setIsFormVisible(false)}>Cancelar</button>
                            <button type="submit" className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">Criar Continente</button>
                        </div>
                    </form>
                </div>
            )}
            
            {/* 5. SEÇÃO DE LISTAGEM */}
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Lista de Continentes</h2>

            {isLoading && <p className='text-blue-500'>Carregando continentes...</p>}
            
            {!isLoading && continentes.length === 0 && (
                <p className='text-gray-500 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                    Nenhum continente cadastrado ainda.
                </p>
            )}

            {!isLoading && continentes.length > 0 && (
                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                            <tr>
                                <th className="py-3 px-6 text-left">ID</th>
                                <th className="py-3 px-6 text-left">Nome</th>
                                <th className="py-3 px-6 text-left">Descrição</th>
                                <th className="py-3 px-6 text-right">Área (km²)</th>
                                <th className="py-3 px-6 text-right">População</th>
                                <th className="py-3 px-6 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {continentes.map((cont) => (
                                <tr key={cont.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-3 px-6 text-left whitespace-nowrap">{cont.id}</td>
                                    <td className="py-3 px-6 text-left">{cont.nome}</td>
                                    <td className="py-3 px-6 text-left max-w-xs truncate" title={cont.descricao}>{cont.descricao}</td>
                                    <td className="py-3 px-6 text-right">{formatNumber(cont.area_km2)}</td>
                                    <td className="py-3 px-6 text-right">{formatNumber(cont.populacao_total)}</td>
                                    <td className="py-3 px-6 text-center">
                                        {/* TODO: Futuros botões de Editar e Excluir */}
                                        <button className="text-blue-600 hover:text-blue-800 mx-1">Editar</button>
                                        <button className="text-red-600 hover:text-red-800 mx-1">Excluir</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}