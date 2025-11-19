import React, { useState, useEffect, type FormEvent } from 'react';
import './styleContinentes.css';
import { SearchBar } from '../../components/searchBar/SearchBar';

// Interface que recebe os dados do Back-end (GET)
interface Continente { 
    id: number;
    nome: string;
    descricao: string;
    area_km2: number | null;
    numero_paises: number | null;
    populacao_total: string | null; 
}

interface ContinenteFormData { 
    nome: string;
    descricao: string;
    area_km2: number | undefined;
    numero_paises: number | undefined;
    populacao_total: string | undefined;
}
const API_URL = 'http://127.0.0.1:3001/continentes';

const INITIAL_FORM_DATA: ContinenteFormData = {
    nome: '',
    descricao: '',
    area_km2: undefined,
    numero_paises: undefined,
    populacao_total: undefined,
};

export default function ContinentesPage() {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [continentes, setContinentes] = useState<Continente[]>([]);
    const [isLoading, setIsLoading] = useState(true); 
    const [searchQuery, setSearchQuery] = useState(''); 
    const [continenteToEdit, setContinenteToEdit] = useState<Continente | null>(null);
    const [formData, setFormData] = useState<ContinenteFormData>(INITIAL_FORM_DATA);

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
    
    useEffect(() => {
        fetchContinentes();
    }, []);
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        const isNumericField = ['area_km2', 'numero_paises', 'populacao_total'].includes(name);
        
        setFormData(prevData => ({
            ...prevData,
            [name]: isNumericField 
                ? (value === '' ? undefined : Number(value.replace(/\./g, '').replace(/,/g, '.'))) 
                : value,
        }));
    };

    //Prepara o formulário para edição
    const handleEditClick = (continente: Continente) => {
        setContinenteToEdit(continente); // Marca o continente para edição
        // Preenche o formulário com os dados existentes
        setFormData({
            nome: continente.nome,
            descricao: continente.descricao,
            area_km2: continente.area_km2 ?? undefined,
            numero_paises: continente.numero_paises ?? undefined,
            populacao_total: continente.populacao_total ?? undefined,
        });
        setIsFormVisible(true); // Exibe o formulário de edição
    };

    //Lida com o envio (POST para criação, PUT para edição)
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        // Define o método e a URL com base no estado de edição
        const method = continenteToEdit ? 'PUT' : 'POST';
        const url = continenteToEdit ? `${API_URL}/${continenteToEdit.id}` : API_URL;
        const dataToSend = {
            nome: formData.nome,
            descricao: formData.descricao,
            area_km2: formData.area_km2 ?? null,
            numero_paises: formData.numero_paises ?? null,
            populacao_total: formData.populacao_total ?? null,
        };
        
        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Falha ao ${continenteToEdit ? 'atualizar' : 'cadastrar'} o continente.`);
            }
            
            const result: Continente = await response.json();
            
            // Atualiza a lista de continentes no Front-end
            if (method === 'POST') {
                setContinentes(prev => [...prev, result]);
                alert(`Continente "${result.nome}" cadastrado com sucesso!`);
            } else { // PUT
                setContinentes(prev => prev.map(cont => 
                    cont.id === result.id ? result : cont // Substitui o continente atualizado
                ));
                alert(`Continente "${result.nome}" atualizado com sucesso!`);
            }
            
            // Reseta o estado
            setFormData(INITIAL_FORM_DATA);
            setContinenteToEdit(null); 
            setIsFormVisible(false);
            
        } catch (error) {
            console.error(`Erro na operação ${method}:`, error);
            alert(`Erro: ${error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'}`);
        }
    };

    // Função para exclusão 
    const handleDelete = async (id: number, nome: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir o continente "${nome}" (ID: ${id})?`)) {
            return; 
        }
    try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE', 
            });

            if (!response.ok) {
                throw new Error('Falha ao excluir o continente.');
            }

            // Atualiza a lista local removendo o continente com o ID correspondente
            setContinentes(prevContinentes => 
                prevContinentes.filter(cont => cont.id !== id)
            );

            console.log(`Continente com ID ${id} excluído com sucesso.`);
            alert(`Continente "${nome}" excluído com sucesso!`);

        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert(`Erro ao excluir o continente "${nome}". Verifique o console para mais detalhes.`);
        }
    };

    const formatNumber = (value: string | number | null) => {
        if (value === null || value === undefined) return 'N/A';
        const num = typeof value === 'string' ? BigInt(value) : value;
        return num.toLocaleString('pt-BR');
    };

    //Lida com a visibilidade do formulário e reseta o estado de edição/criação
    const handleToggleForm = () => {
        setIsFormVisible(prev => {
            if (prev) {
                setContinenteToEdit(null);
                setFormData(INITIAL_FORM_DATA);
            }
            return !prev;
        });
    };

    // Lógica de filtro
    const filteredContinentes = continentes.filter(cont => 
        cont.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="conteudo_continentes">
            <div className='inicio_continentes'>
                <h1 className='titulo_continentes'>Gerenciamento de Continentes</h1>
                <p className='subtitulo_continentes'>Cadastre, edite e visualize informações completas sobre todos os continentes que desejar.</p>
            </div>
            
            <button
                className="w-full py-3 mb-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                onClick={handleToggleForm}
            >
                {isFormVisible 
                    ? 'Cancelar' 
                    : continenteToEdit ? 'Editar Continente Selecionado' : '➕ Adicionar Novo Continente'
                }
            </button>
            
            {isFormVisible && (
                <form onSubmit={handleSubmit} className="p-6 bg-white rounded-lg shadow-xl mb-6 border border-gray-200">
                    <h2 className="text-xl font-bold mb-4">
                        {continenteToEdit ? `Editar ${continenteToEdit.nome}` : 'Cadastrar Novo Continente'}
                    </h2>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="nome">Nome *</label>
                        <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleInputChange} required className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>

                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="descricao">Descrição *</label>
                        <textarea id="descricao" name="descricao" value={formData.descricao} onChange={handleInputChange} required rows={3} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>

                    {['area_km2', 'numero_paises', 'populacao_total'].map(field => (
                        <div className="mb-4" key={field}>
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor={field}>
                                {field.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} (Opcional)
                            </label>
                            <input 
                                type="number" 
                                id={field} 
                                name={field} 
                                value={formData[field as keyof ContinenteFormData] ?? ''} 
                                onChange={handleInputChange} 
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            />
                        </div>
                    ))}
                    
                    <div className="flex items-center justify-between">
                        <button
                            type="submit"
                            className="w-full bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150"
                        >
                            {continenteToEdit ? 'Salvar Alterações' : 'Cadastrar Continente'}
                        </button>
                    </div>
                </form>
            )}
            
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Lista de Continentes</h2>
            <SearchBar 
                searchQuery={searchQuery} 
                onSearchChange={setSearchQuery} 
            />

            {!isLoading && filteredContinentes.length === 0 && searchQuery.length > 0 && (
                <p className='text-gray-500 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                    Nenhum continente encontrado com o termo "{searchQuery}".
                </p>
            )}
            
            {!isLoading && filteredContinentes.length > 0 && (
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
                            {filteredContinentes.map((cont) => (
                                <tr key={cont.id} className="border-b border-gray-200 hover:bg-gray-100">
                                    <td className="py-3 px-6 text-left whitespace-nowrap">{cont.id}</td>
                                    <td className="py-3 px-6 text-left">{cont.nome}</td>
                                    <td className="py-3 px-6 text-left max-w-xs truncate" title={cont.descricao}>{cont.descricao}</td>
                                    <td className="py-3 px-6 text-right">{formatNumber(cont.area_km2)}</td>
                                    <td className="py-3 px-6 text-right">{formatNumber(cont.populacao_total)}</td>
                                    <td className="py-3 px-6 text-center">
                                        <button 
                                            onClick={() => handleEditClick(cont)}
                                            className="text-blue-600 hover:text-blue-800 mx-1 transition duration-150"
                                        >
                                            Editar
                                        </button>
                                        <button 
                                            onClick={() => handleDelete(cont.id, cont.nome)}
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
        </div>
    );
}