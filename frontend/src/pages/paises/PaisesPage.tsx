import React, { useState, useEffect, type FormEvent } from 'react';
import { SearchBar } from '../../components/searchBar/SearchBar';
import './stylePaises.css'; 

// --- INTERFACES ---
interface Continente {
    id: number;
    nome: string;
}

interface Pais {
    id: number;
    id_continente: number;
    nome: string;
    populacao_total: string | null; // BigInt vem como string
    idioma_oficial: string;
    moeda: string;
    continente: Continente; // Relação que será carregada na busca
}

interface PaisFormData {
    id_continente: number | undefined;
    nome: string;
    populacao_total: string | undefined;
    idioma_oficial: string;
    moeda: string;
}

// 📌 NOVA INTERFACE: Para a foto do Unsplash
interface PhotoData {
    url: string;
    descricao: string;
    fotografo_nome: string;
    fotografo_perfil: string;
    unsplash_link: string;
}

const API_PAISES = 'http://localhost:3001/paises';
const API_CONTINENTES = 'http://localhost:3001/continentes';
// 📌 NOVA CONSTANTE: Reutiliza a rota de fotos
const API_FOTOS = 'http://localhost:3001/fotos'; 
const INITIAL_FORM_DATA: PaisFormData = {
    id_continente: undefined,
    nome: '',
    populacao_total: undefined,
    idioma_oficial: '',
    moeda: '',
};

// --- FUNÇÕES AUXILIARES ---
const formatNumber = (value: string | number | null) => {
    if (value === null || value === undefined) return 'N/A';
    // Se for string (vindo do BigInt), trata como BigInt antes da formatação
    const num = typeof value === 'string' ? BigInt(value) : value;
    return num.toLocaleString('pt-BR');
};

export default function PaisesPage() {
    // --- ESTADOS ---
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [paises, setPaises] = useState<Pais[]>([]);
    const [continentes, setContinentes] = useState<Continente[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [paisToEdit, setPaisToEdit] = useState<Pais | null>(null);
    const [formData, setFormData] = useState<PaisFormData>(INITIAL_FORM_DATA);
    
    // 📌 NOVOS ESTADOS PARA O MODAL DE SUCESSO E FOTO
    const [fotoSucesso, setFotoSucesso] = useState<PhotoData | null>(null);
    const [cadastroSucessoNome, setCadastroSucessoNome] = useState<string | null>(null);
    const [fotoLoading, setFotoLoading] = useState(false);

    // --- FUNÇÕES DE CARREGAMENTO (sem alteração) ---
    const fetchContinentes = async () => {
        try {
            const response = await fetch(API_CONTINENTES);
            if (!response.ok) throw new Error('Falha ao carregar continentes.');
            const data: Continente[] = await response.json();
            setContinentes(data);
        } catch (error) {
            console.error("Erro ao carregar continentes:", error);
        }
    };

    const fetchPaises = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_PAISES); 
            if (!response.ok) throw new Error('Falha ao buscar países.');
            const data: Pais[] = await response.json();
            setPaises(data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Erro ao carregar a lista de países.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchContinentes();
        fetchPaises();
    }, []);

    // --- FUNÇÕES DE MANIPULAÇÃO DE DADOS (handleInputChange e handleEditClick sem alteração) ---
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        const isNumberField = name === 'id_continente';
        
        setFormData(prevData => ({
            ...prevData,
            [name]: isNumberField 
                ? (value === '' ? undefined : Number(value)) 
                : value,
        }));
    };
    
    const handleToggleForm = () => {
        setIsFormVisible(prev => {
            if (prev) {
                setPaisToEdit(null);
                setFormData(INITIAL_FORM_DATA);
            }
            return !prev;
        });
    };

    const handleEditClick = (pais: Pais) => {
        setPaisToEdit(pais);
        setFormData({
            id_continente: pais.id_continente,
            nome: pais.nome,
            idioma_oficial: pais.idioma_oficial,
            moeda: pais.moeda,
            populacao_total: pais.populacao_total ?? undefined,
        });
        setIsFormVisible(true);
    };

    // Função unificada para CRIAÇÃO (POST) e EDIÇÃO (PUT)
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!formData.id_continente) {
             alert("Por favor, selecione um Continente.");
             return;
        }

        const method = paisToEdit ? 'PUT' : 'POST';
        const url = paisToEdit ? `${API_PAISES}/${paisToEdit.id}` : API_PAISES;

        const dataToSend = {
            ...formData,
            id_continente: Number(formData.id_continente),
            populacao_total: formData.populacao_total || null, 
        };
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Falha ao ${paisToEdit ? 'atualizar' : 'cadastrar'} o país.`);
            }
            
            const result: Pais = await response.json();
            
            // 1. Atualiza a lista de países no estado do Front-end
            if (method === 'POST') {
                setPaises(prev => [...prev, result]);
            } else { 
                setPaises(prev => prev.map(p => 
                    p.id === result.id ? result : p 
                ));
            }
            
            // 2. NOVA LÓGICA: BUSCA E EXIBIÇÃO DA FOTO (Ajustada a partir da versão Cidades)
            
            // Prepara o modal para exibição
            setCadastroSucessoNome(result.nome); 
            setFotoSucesso(null); // Limpa foto anterior
            setFotoLoading(true); // Inicia o estado de carregamento
            
            try {
                // Chama a rota /fotos com o nome do país recém-cadastrado
                const fotoResponse = await fetch(`${API_FOTOS}?query=${encodeURIComponent(result.nome)}`);
                
                if (fotoResponse.ok) {
                    const fotoData: PhotoData = await fotoResponse.json();
                    setFotoSucesso(fotoData);
                } else {
                    console.warn(`Nenhuma foto encontrada para ${result.nome}.`);
                }
            } catch (error) {
                console.error("Erro ao buscar foto:", error);
            } finally {
                setFotoLoading(false); // Finaliza o carregamento da foto
            }
            
            // 3. NÃO FECHA O FORMULÁRIO AQUI. Ele será fechado ao clicar no botão 'Fechar' do modal.
            
        } catch (error) {
            console.error(`Erro na operação ${method}:`, error);
            alert(`Erro: ${error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'}`);
            
            // Garante que o modal de sucesso NÃO abra em caso de falha no CRUD
            setCadastroSucessoNome(null);
            setFotoSucesso(null);
            setFotoLoading(false);
        }
    };
    
    // Função para exclusão (sem alteração)
    const handleDelete = async (id: number, nome: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir o país "${nome}"?`)) return;

        try {
            const response = await fetch(`${API_PAISES}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Falha ao excluir o país.');

            setPaises(prevPaises => 
                prevPaises.filter(p => p.id !== id)
            );
            alert(`País "${nome}" excluído com sucesso!`);

        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert(`Erro ao excluir o país "${nome}".`);
        }
    };

    // Lógica de filtro (sem alteração)
    const filteredPaises = paises.filter(pais => 
        pais.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- RENDERIZAÇÃO ---
    return (
        <div className="conteudo_paises">
            <h1 className='text-3xl font-bold mb-4 text-gray-800'>🌎 Gerenciamento de Países</h1>
            
            <button
                className="w-full py-3 mb-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                onClick={handleToggleForm}
            >
                {isFormVisible ? 'Cancelar' : '➕ Adicionar Novo País'}
            </button>
            
            {isFormVisible && (
                <form onSubmit={handleSubmit} className="form-container p-6 border border-gray-300 rounded-lg mb-6 shadow-md bg-white">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">
                        {paisToEdit ? `Editar ${paisToEdit.nome}` : 'Cadastrar Novo País'}
                    </h2>
                    
                    {/* Campo Continente (SELECT) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" htmlFor="id_continente">Continente *</label>
                        <select 
                            id="id_continente" 
                            name="id_continente" 
                            // O valor no select deve ser string
                            value={formData.id_continente === undefined ? '' : String(formData.id_continente)} 
                            onChange={handleInputChange} 
                            className="w-full p-2 border border-gray-300 rounded-lg" 
                            required
                        >
                            <option value="" disabled>Selecione um Continente</option>
                            {continentes.map(cont => (
                                <option key={cont.id} value={cont.id}>{cont.nome}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Campos restantes */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" htmlFor="nome">Nome *</label>
                            <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" htmlFor="populacao_total">População Total *</label>
                            <input type="text" id="populacao_total" name="populacao_total" value={formData.populacao_total || ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" htmlFor="idioma_oficial">Idioma Oficial *</label>
                            <input type="text" id="idioma_oficial" name="idioma_oficial" value={formData.idioma_oficial} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" htmlFor="moeda">Moeda *</label>
                            <input type="text" id="moeda" name="moeda" value={formData.moeda} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300 mt-2">
                        {paisToEdit ? 'Salvar Alterações' : 'Cadastrar País'}
                    </button>
                </form>
            )}

            {/* BARRA DE PESQUISA E LISTAGEM (sem alteração) */}
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Lista de Países</h2>
            <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder='Pesquisar país...'/>

            {isLoading && <p className='text-blue-500'>Carregando países...</p>}
            
            {!isLoading && filteredPaises.length === 0 && (
                 <p className='text-gray-500 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                    {searchQuery ? `Nenhum país encontrado com o termo "${searchQuery}".` : 'Nenhum país cadastrado ainda.'}
                </p>
            )}

            {!isLoading && filteredPaises.length > 0 && (
                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                            <tr>
                                <th className="py-3 px-6 text-left">ID</th>
                                <th className="py-3 px-6 text-left">Nome</th>
                                <th className="py-3 px-6 text-left">Continente</th>
                                <th className="py-3 px-6 text-right">População</th>
                                <th className="py-3 px-6 text-left">Idioma</th>
                                <th className="py-3 px-6 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {filteredPaises.map((pais) => (
                                <tr key={pais.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-3 px-6 text-left whitespace-nowrap">{pais.id}</td>
                                    <td className="py-3 px-6 text-left">{pais.nome}</td>
                                    {/* Exibe o nome do continente usando a relação incluída */}
                                    <td className="py-3 px-6 text-left">{pais.continente.nome}</td> 
                                    <td className="py-3 px-6 text-right">{formatNumber(pais.populacao_total)}</td>
                                    <td className="py-3 px-6 text-left">{pais.idioma_oficial}</td>
                                    <td className="py-3 px-6 text-center">
                                        <button 
                                            onClick={() => handleEditClick(pais)}
                                            className="text-blue-600 hover:text-blue-800 mx-1 transition duration-150"
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(pais.id, pais.nome)}
                                            className="text-red-600 hover:text-red-800 mx-1 transition duration-150"
                                        >
                                            Excluir
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* 📌 NOVO MODAL DE SUCESSO COM FOTO */}
            {(fotoSucesso || fotoLoading) && cadastroSucessoNome && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-1/2 p-6">
                        <h3 className="text-2xl font-bold mb-4 text-green-600">✅ Sucesso!</h3>
                        <p className="mb-4">
                            O país **"{cadastroSucessoNome}"** foi **{paisToEdit ? 'atualizado' : 'cadastrado'}** com sucesso.
                        </p>

                        {fotoLoading && (
                            <div className="text-center p-4 text-blue-500">
                                Buscando foto de {cadastroSucessoNome}...
                            </div>
                        )}

                        {fotoSucesso && (
                            <div className="mt-4 border p-3 rounded-lg bg-gray-50">
                                <img 
                                    src={fotoSucesso.url} 
                                    alt={fotoSucesso.descricao} 
                                    className="w-full h-48 object-cover rounded mb-2" 
                                />
                                <p className="text-xs text-gray-500 text-center">
                                    Foto por <a href={fotoSucesso.fotografo_perfil} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">{fotoSucesso.fotografo_nome}</a> em Unsplash.
                                </p>
                            </div>
                        )}

                        <button
                            onClick={() => {
                                // 📌 LÓGICA DE FECHAMENTO DO MODAL + RESET DO FORMULÁRIO
                                setFotoSucesso(null);
                                setCadastroSucessoNome(null);
                                setFormData(INITIAL_FORM_DATA);
                                setPaisToEdit(null);
                                setIsFormVisible(false); // Fecha o formulário que estava visível
                            }}
                            className="mt-4 w-full py-2 bg-green-500 text-white font-semibold rounded hover:bg-green-600"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}