import React, { useState, useEffect, type FormEvent } from 'react';
import { SearchBar } from '../../components/searchBar/SearchBar';
import './styleCidades.css'; 

// --- INTERFACES ---
interface Pais {
    id: number;
    nome: string;
}

interface Cidade {
    id: number;
    id_pais: number;
    nome: string;
    // Permite 'null' para refletir a possibilidade de dados não preenchidos no DB
    populacao_total: number | null; 
    latitude: number | null;
    longitude: number | null;
    pais: Pais;
    foto_url: string | null;
    foto_descricao: string | null;
    fotografo_nome: string | null;
    fotografo_perfil: string | null;
}

interface CidadeFormData {
    id_pais: number | undefined;
    nome: string;
    populacao_total: number | undefined; 
    latitude: number | undefined;
    longitude: number | undefined;
}

interface ClimaData {
    temperatura: number;
    sensacao_termica: number;
    temperatura_min: number;
    temperatura_max: number;
    pressao: number;
    umidade: number;
    descricao: string;
    icone: string;
    velocidade_vento: number;
    nome_local: string;
}

interface PhotoData {
    url: string;
    descricao: string;
    fotografo_nome: string;
    fotografo_perfil: string;
    unsplash_link: string; // Mantido, mas não usado
}

const API_CIDADES = 'http://localhost:3001/cidades';
const API_PAISES = 'http://localhost:3001/paises';
const API_FOTOS = 'http://localhost:3001/fotos';
const INITIAL_FORM_DATA: CidadeFormData = {
    id_pais: undefined,
    nome: '',
    populacao_total: undefined,
    latitude: undefined,
    longitude: undefined,
};

// --- FUNÇÕES AUXILIARES ---
const formatNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString('pt-BR');
};

export default function CidadesPage() {
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [cidades, setCidades] = useState<Cidade[]>([]);
    const [paises, setPaises] = useState<Pais[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [cidadeToEdit, setCidadeToEdit] = useState<Cidade | null>(null);
    const [formData, setFormData] = useState<CidadeFormData>(INITIAL_FORM_DATA);
    const [climaVisivelId, setClimaVisivelId] = useState<number | null>(null);
    const [dadosClima, setDadosClima] = useState<ClimaData | null>(null);
    const [climaLoading, setClimaLoading] = useState(false);
    
    // VARIÁVEIS DE ESTADO DO MODAL DE SUCESSO
    const [fotoSucesso, setFotoSucesso] = useState<PhotoData | null>(null);
    const [cadastroSucessoNome, setCadastroSucessoNome] = useState<string | null>(null);
    const [fotoLoading, setFotoLoading] = useState(false);

    // --- FUNÇÕES DE BUSCA (sem alterações) ---
    const fetchClima = async (cidade: Cidade) => {
        if (climaVisivelId === cidade.id) {
            setClimaVisivelId(null);
            setDadosClima(null);
            return;
        }

        if (climaLoading) return;

        setClimaLoading(true);
        setDadosClima(null); 
        
        // Verifica se há dados de localização antes de buscar clima
        if (cidade.latitude === null || cidade.longitude === null) {
            alert(`A cidade ${cidade.nome} não possui dados de Latitude e Longitude cadastrados.`);
            setClimaLoading(false);
            return;
        }

        const lat = cidade.latitude;
        const lon = cidade.longitude;
        
        try {
            const response = await fetch(`http://localhost:3001/clima?lat=${lat}&lon=${lon}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Falha ao obter o clima.');
            }
            
            const climaData: ClimaData = await response.json();
            
            setDadosClima(climaData);
            setClimaVisivelId(cidade.id);
            
        } catch (error) {
            console.error("Erro ao buscar clima:", error);
            alert(`Não foi possível obter os dados climáticos para ${cidade.nome}. Motivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
            setClimaVisivelId(null); 
        } finally {
            setClimaLoading(false);
        }
    };
    
    const fetchPaises = async () => {
        try {
            const response = await fetch(API_PAISES); 
            if (!response.ok) throw new Error('Falha ao carregar países.');
            
            const data: Pais[] = await response.json(); 
            
            const paisesSimples = data.map((p) => ({ id: p.id, nome: p.nome }));
            setPaises(paisesSimples);
        } catch (error) {
            console.error("Erro ao carregar países:", error);
        }
    };
    const fetchCidades = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(API_CIDADES); 
            if (!response.ok) throw new Error('Falha ao buscar cidades.');
            const data: Cidade[] = await response.json();
            setCidades(data);
        } catch (error) {
            console.error("Erro ao carregar dados:", error);
            alert("Erro ao carregar a lista de cidades.");
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchPaises();
        fetchCidades();
    }, []);

    // --- FUNÇÕES DE MANIPULAÇÃO DE ESTADO (sem alterações) ---

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        const isNumericField = ['id_pais', 'populacao_total', 'latitude', 'longitude'].includes(name);

        setFormData(prevData => ({
            ...prevData,
            [name]: isNumericField 
                ? (value === '' ? undefined : Number(value)) 
                : value,
        }));
    };
        
    const handleToggleForm = () => {
        setIsFormVisible(prev => {
            if (prev) {
                setCidadeToEdit(null);
                setFormData(INITIAL_FORM_DATA);
            }
            return !prev;
        });
    };

    const handleEditClick = (cidade: Cidade) => {
        setCidadeToEdit(cidade);
        // Ao editar, 'null' do back-end vira 'undefined' para o formulário (caixa vazia)
        setFormData({
            id_pais: cidade.id_pais,
            nome: cidade.nome,
            populacao_total: cidade.populacao_total ?? undefined,
            latitude: cidade.latitude ?? undefined,
            longitude: cidade.longitude ?? undefined,
        });
        setIsFormVisible(true);
    };

    // Função unificada para CRIAÇÃO (POST) e EDIÇÃO (PUT)
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        
        if (!formData.id_pais) {
            alert("Por favor, selecione um País.");
            return;
        }

        const method = cidadeToEdit ? 'PUT' : 'POST';
        const url = cidadeToEdit ? `${API_CIDADES}/${cidadeToEdit.id}` : API_CIDADES;

        // Dados base
        let dataToSend: Partial<Cidade> = {
            id_pais: Number(formData.id_pais),
            nome: formData.nome,
            // Converte undefined/vazio do formulário para null para o banco (MySQL)
            populacao_total: formData.populacao_total ?? null, 
            latitude: formData.latitude ?? null,
            longitude: formData.longitude ?? null,
        };

        // 🛑 REMOÇÃO DE LÓGICA 1: Remove a lógica de reaproveitamento de foto para PUT.
        // O PUT agora não pode modificar campos de foto, a não ser que o backend cuide disso.
        // Se a cidade já tem foto, ela será mantida pelo backend.
        
        // Se estiver editando, não enviamos a foto, para evitar conflitos de tipagem.
        // Assumimos que a foto já está no banco e será mantida pelo PUT, exceto no POST.

        // Limpar o estado do modal antes de iniciar
        setCadastroSucessoNome(null);
        setFotoSucesso(null);
        setFotoLoading(method === 'POST'); // Apenas carregamos a foto no POST

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Falha ao ${cidadeToEdit ? 'atualizar' : 'cadastrar'} a cidade.`);
            }
            
            // Assume que o backend retorna o objeto completo com a relação 'pais'
            let result: Cidade = await response.json();
            
            if (method === 'POST') {
                
                // 1. Define o nome para mostrar o modal
                setCadastroSucessoNome(result.nome); 
                
                // 2. Busca e Persiste a foto (Mantido, mas simplificado)
                try {
                    const fotoResponse = await fetch(`${API_FOTOS}?query=${encodeURIComponent(result.nome)}`);
                    
                    if (fotoResponse.ok) {
                        const fotoData: PhotoData = await fotoResponse.json();
                        
                        // PUT de atualização da foto (Persistindo no banco)
                        await fetch(`${API_CIDADES}/${result.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                foto_url: fotoData.url,
                                foto_descricao: fotoData.descricao,
                                fotografo_nome: fotoData.fotografo_nome,
                                fotografo_perfil: fotoData.fotografo_perfil,
                            }),
                        });

                        // Atualiza o objeto 'result' em memória para o state e modal
                        result = {
                            ...result,
                            foto_url: fotoData.url,
                            foto_descricao: fotoData.descricao,
                            fotografo_nome: fotoData.fotografo_nome,
                            fotografo_perfil: fotoData.fotografo_perfil,
                        };

                        setFotoSucesso(fotoData); // Exibe no modal
                    } else {
                        console.warn(`Nenhuma foto encontrada para ${result.nome}.`);
                    }
                } catch (error) {
                    console.error("Erro ao buscar/persistir foto:", error);
                } finally {
                    setFotoLoading(false); // Fim do carregamento, sucesso ou falha
                }
            }
            
            // 3. Atualiza a lista de cidades no frontend
            if (method === 'POST') {
                setCidades(prev => [...prev, result]);
            } else { 
                setCidades(prev => prev.map(c => 
                    c.id === result.id ? result : c 
                ));
            }
            
            // 🛑 ALTERAÇÃO DE LÓGICA: Lógica PÓS-PUT
            if (method === 'PUT') {
                // Define o nome e limpa estados
                setCadastroSucessoNome(result.nome); 
                setFotoSucesso(null); 
                setFotoLoading(false);

                // Reconstroi o objeto fotoSucesso para o modal, SE a cidade tiver uma URL de foto.
                if (result.foto_url) {
                    // Mapeia os dados da cidade atualizada para o formato do modal
                    setFotoSucesso({
                        url: result.foto_url,
                        descricao: result.foto_descricao || 'Foto de cidade.',
                        fotografo_nome: result.fotografo_nome || 'Desconhecido',
                        fotografo_perfil: result.fotografo_perfil || '#',
                        unsplash_link: '#', // Não é essencial para o modal, mas mantido
                    });
                }
            }
            
            // Limpa o formulário após a submissão bem-sucedida (o modal cuida da visibilidade)
            setFormData(INITIAL_FORM_DATA);
            setCidadeToEdit(null);
            
        } catch (error) {
            console.error(`Erro na operação ${method}:`, error);
            alert(`Erro: ${error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.'}`);
            
            // Limpa o modal em caso de erro
            setCadastroSucessoNome(null);
            setFotoSucesso(null);
            setFotoLoading(false);
        }
    };
    
    // --- FUNÇÃO DELETE (sem alterações) ---
    const handleDelete = async (id: number, nome: string) => {
        if (!window.confirm(`Tem certeza que deseja excluir a cidade "${nome}"?`)) return;

        try {
            const response = await fetch(`${API_CIDADES}/${id}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Falha ao excluir a cidade.');

            setCidades(prevCidades => 
                prevCidades.filter(c => c.id !== id)
            );
            alert(`Cidade "${nome}" excluída com sucesso!`);

        } catch (error) {
            console.error('Erro ao excluir:', error);
            alert(`Erro ao excluir a cidade "${nome}".`);
        }
    };

    const filteredCidades = cidades.filter(cidade => 
        cidade.nome.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- RENDERIZAÇÃO (sem alterações estruturais) ---
    return (
        <div className="conteudo_cidades">
            <h1 className='text-3xl font-bold mb-4 text-gray-800'>🏢 Gerenciamento de Cidades</h1>
            
            <button
                className="w-full py-3 mb-6 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-300"
                onClick={handleToggleForm}
            >
                {isFormVisible ? 'Cancelar' : '➕ Adicionar Nova Cidade'}
            </button>
            
            {isFormVisible && (
                <form onSubmit={handleSubmit} className="form-container p-6 border border-gray-300 rounded-lg mb-6 shadow-md bg-white">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">
                        {cidadeToEdit ? `Editar ${cidadeToEdit.nome}` : 'Cadastrar Nova Cidade'}
                    </h2>
                    
                    {/* Campo País (SELECT) */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" htmlFor="id_pais">País *</label>
                        <select 
                            id="id_pais" 
                            name="id_pais" 
                            value={formData.id_pais === undefined ? '' : String(formData.id_pais)} 
                            onChange={handleInputChange} 
                            className="w-full p-2 border border-gray-300 rounded-lg" 
                            required
                        >
                            <option value="" disabled>Selecione um País</option>
                            {paises.map(pais => (
                                <option key={pais.id} value={pais.id}>{pais.nome}</option>
                            ))}
                        </select>
                    </div>
                    
                    {/* Campos restantes */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1" htmlFor="nome">Nome *</label>
                        <input type="text" id="nome" name="nome" value={formData.nome} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4">
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" htmlFor="populacao_total">População Total *</label>
                            <input type="number" id="populacao_total" name="populacao_total" value={formData.populacao_total ?? ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" htmlFor="latitude">Latitude *</label>
                            <input type="number" step="0.000001" id="latitude" name="latitude" value={formData.latitude ?? ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-1" htmlFor="longitude">Longitude *</label>
                            <input type="number" step="0.000001" id="longitude" name="longitude" value={formData.longitude ?? ''} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-lg" required />
                        </div>
                    </div>
                    
                    <button type="submit" className="w-full py-2 px-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition duration-300 mt-2">
                        {cidadeToEdit ? 'Salvar Alterações' : 'Cadastrar Cidade'}
                    </button>
                </form>
            )}

            {/* BARRA DE PESQUISA E LISTAGEM */}
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Lista de Cidades</h2>
            <SearchBar searchQuery={searchQuery} onSearchChange={setSearchQuery} placeholder='Pesquisar cidade...'/>

            {isLoading && <p className='text-blue-500'>Carregando cidades...</p>}
            
            {!isLoading && filteredCidades.length === 0 && (
                <p className='text-gray-500 p-4 bg-yellow-50 rounded-lg border border-yellow-200'>
                    {searchQuery ? `Nenhuma cidade encontrada com o termo "${searchQuery}".` : 'Nenhuma cidade cadastrada ainda.'}
                </p>
            )}

            {!isLoading && filteredCidades.length > 0 && (
                <div className="overflow-x-auto shadow-lg rounded-lg">
                    <table className="min-w-full bg-white">
                        <thead className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
                            <tr>
                                <th className="py-3 px-6 text-left">ID</th>
                                <th className="py-3 px-6 text-left">Nome</th>
                                <th className="py-3 px-6 text-left">País</th>
                                <th className="py-3 px-6 text-right">População</th>
                                <th className="py-3 px-6 text-center">Latitude</th>
                                <th className="py-3 px-6 text-center">Longitude</th>
                                <th className="py-3 px-6 text-center">🖼️ Foto</th>
                                <th className="py-3 px-6 text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="text-gray-600 text-sm font-light">
                            {filteredCidades.map((cidade) => (
                                <React.Fragment key={cidade.id}>
                                    {/* LINHA PRINCIPAL DA CIDADE */}
                                    <tr className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-3 px-6 text-left whitespace-nowrap">{cidade.id}</td>
                                        <td className="py-3 px-6 text-left">{cidade.nome}</td>
                                        <td className="py-3 px-6 text-left">{cidade.pais.nome}</td> 
                                        <td className="py-3 px-6 text-right">{formatNumber(cidade.populacao_total)}</td>
                                        <td className="py-3 px-6 text-center">{cidade.latitude ?? 'N/A'}</td>
                                        <td className="py-3 px-6 text-center">{cidade.longitude ?? 'N/A'}</td>
                                        
                                        {/* Lógica da Foto INLINE */}
                                        <td className="py-3 px-6 text-center">
                                            {cidade.foto_url ? (
                                                <a 
                                                    href={cidade.fotografo_perfil || cidade.foto_url} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    title={cidade.foto_descricao || "Ver foto em alta resolução"}
                                                    className="group block relative w-16 h-12 overflow-hidden rounded-md shadow-md mx-auto"
                                                >
                                                    <img 
                                                        src={cidade.foto_url} 
                                                        alt={cidade.foto_descricao || `Foto de ${cidade.nome}`} 
                                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                        <span className="text-white text-xs font-semibold">🔍</span>
                                                    </div>
                                                </a>
                                            ) : (
                                                <span className="text-xs text-gray-400">Sem foto</span>
                                            )}
                                        </td>
                                        
                                        <td className="py-3 px-6 text-center flex items-center justify-center space-x-2">
                                            <button 
                                                onClick={() => fetchClima(cidade)}
                                                className={`font-medium py-1 px-3 rounded transition duration-150 ${climaVisivelId === cidade.id ? 'bg-purple-600 text-white hover:bg-purple-700' : 'text-purple-600 border border-purple-600 hover:bg-purple-100'}`}
                                                title={climaVisivelId === cidade.id ? 'Ocultar Clima' : 'Ver Dados Climáticos'}
                                                disabled={climaLoading && climaVisivelId !== cidade.id}
                                            >
                                                {climaVisivelId === cidade.id ? 'Ocultar' : 'Clima'}
                                            </button>
                                            <button 
                                                onClick={() => handleEditClick(cidade)}
                                                className="text-blue-600 hover:text-blue-800"
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(cidade.id, cidade.nome)}
                                                className="text-red-600 hover:text-red-800"
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>

                                    {/* LINHA DE EXIBIÇÃO DO CLIMA */}
                                    {climaVisivelId === cidade.id && dadosClima && (
                                        <tr className="bg-purple-50">
                                            <td colSpan={8} className="p-4">
                                                <div className="flex justify-between items-start text-gray-800">
                                                    <div>
                                                        <h4 className="font-bold text-lg mb-2">Clima em {dadosClima.nome_local} ({cidade.nome})</h4>
                                                        <p className="text-3xl font-semibold">
                                                            {dadosClima.temperatura}°C 
                                                            <span className="text-base font-normal ml-2">({dadosClima.descricao})</span>
                                                        </p>
                                                        <p className="text-sm mt-1">Sensação: {dadosClima.sensacao_termica}°C</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p>💧 Umidade: **{dadosClima.umidade}%**</p>
                                                        <p>💨 Vento: **{dadosClima.velocidade_vento} m/s**</p>
                                                        <p>Pressão: **{dadosClima.pressao} hPa**</p>
                                                        <p className="mt-2">Min: {dadosClima.temperatura_min}°C | Max: {dadosClima.temperatura_max}°C</p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                    {/* Exibindo loading na linha correta */}
                                    {climaLoading && climaVisivelId === null && (
                                        <tr className="bg-yellow-50">
                                            <td colSpan={8} className="p-4 text-center text-yellow-700">
                                                Carregando dados climáticos...
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {/* Modal de Sucesso com Foto (Sem Alterações) */}
            {(fotoSucesso || fotoLoading) && cadastroSucessoNome && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-11/12 md:w-1/2 p-6">
                        <h3 className="text-2xl font-bold mb-4 text-green-600">✅ Sucesso!</h3>
                        <p className="mb-4">
                            "{cadastroSucessoNome}" foi **{cidadeToEdit ? 'atualizada' : 'cadastrada'}** com sucesso.
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
                                setFotoSucesso(null);
                                setCadastroSucessoNome(null);
                                setFormData(INITIAL_FORM_DATA);
                                setCidadeToEdit(null);
                                setIsFormVisible(false); 
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