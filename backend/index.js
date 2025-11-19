import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import mysql from 'mysql2/promise';

dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME, // ou o nome do seu banco (ex: orbisdb_pw)
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    decimalNumbers: true, 
};

const pool = mysql.createPool(dbConfig); 

const query = async (sql, params = []) => {
    const [results] = await pool.execute(sql, params);
    return results;
};

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const app = express();
app.use(cors({
    origin: 'http://localhost:5173', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', 
    credentials: true, 
}));

app.use(express.json());

function bigIntJsonReplacer(key, value) {
    // Verifica se o valor é um BigInt e o converte para String
    if (typeof value === 'bigint') {
        return value.toString();
    }
    return value;
}

app.use((req, res, next) => {
    // Sobrescreve o método json nativo do Express
    res.json = function (body) {
        if (body !== undefined) {
            this.send(JSON.stringify(body, bigIntJsonReplacer));
        } else {
            this.send();
        }
    };
    next();
});

app.get("/", (req, res) => {
  res.send("Servidor funcionando!");
});

// index.js (SUBSTITUIR O CRUD DE CONTINENTES)

// CRUD de Continentes
app.post("/continentes", async (req, res) => {
    const { nome, descricao, area_km2, numero_paises, populacao_total } = req.body;
    
    if (!nome || !descricao) {
        return res.status(400).json({ error: "Nome e descrição são obrigatórios." });
    }

    try {
        // OPERAÇÃO: INSERT (CREATE)
        const sql = `
            INSERT INTO continente (nome, descricao, area_km2, numero_paises, populacao_total)
            VALUES (?, ?, ?, ?, ?)
        `;
        // Nota: O mysql2 trata números e BigInts automaticamente. 
        // Se populacao_total vier como string, ele funciona. Se vier como número, também.
        const params = [
            nome, 
            descricao, 
            area_km2 || null, // Se undefined ou 0, passa null
            numero_paises || null, 
            populacao_total || null
        ];

        const result = await query(sql, params);
        
        // Em um INSERT, 'result.insertId' é o ID gerado.
        const novoContinente = {
            id: result.insertId,
            ...req.body
        };
        
        return res.status(201).json(novoContinente);
    } catch (err) {
        // Código de erro do MySQL para chave duplicada (ER_DUP_ENTRY)
        if (err.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ error: "Já existe um continente com este nome." });
        }
        console.error("Erro ao criar continente:", err);
        // Em caso de erro, err.message contém o detalhe
        return res.status(500).json({ error: "Erro interno ao cadastrar continente." });
    }
});

app.get("/continentes", async (req, res) => { 
    try {
        // OPERAÇÃO: SELECT (READ ALL)
        const sql = "SELECT * FROM continente ORDER BY nome ASC";
        const continentes = await query(sql);
        
        // O mysql2 retorna o array de objetos diretamente
        return res.json(continentes);
    } catch (err) {
        console.error("Erro ao listar continentes:", err);
        return res.status(500).json({ error: "Erro interno ao listar continentes." });
    }
});

app.put("/continentes/:id", async (req, res) => {
    const id = req.params.id; // O ID virá como string, mas o MySQL lida bem com isso
    const dados = req.body;
    
    // Converte os campos para que a query possa mapear os valores e evitar injeção
    const campos = Object.keys(dados).map(key => `${key} = ?`).join(', ');
    const valores = Object.values(dados);

    if (valores.length === 0) {
        return res.status(400).json({ error: "Nenhum dado para atualizar fornecido." });
    }

    try {
        // OPERAÇÃO: UPDATE
        const sql = `UPDATE continente SET ${campos} WHERE id = ?`;
        // Adiciona o ID ao final da lista de valores para o WHERE
        const params = [...valores, id]; 

        const result = await query(sql, params);
        
        // Verifica se alguma linha foi realmente afetada
        if (result.affectedRows === 0) {
            // No MySQL, se não encontra o ID, affectedRows é 0. Isso substitui o P2025 do Prisma.
            return res.status(404).json({ error: "Continente não encontrado." });
        }
        
        // Retorna os dados atualizados
        return res.json({ id, ...dados });
    } catch (err) {
        // Código de erro do MySQL para chave duplicada (ER_DUP_ENTRY)
        if (err.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ error: "Já existe um continente com este nome." });
        }
        console.error("Erro ao atualizar continente:", err);
        return res.status(500).json({ error: "Erro interno ao atualizar continente." });
    }
});

app.delete("/continentes/:id", async (req, res) => { 
    const id = req.params.id;

    try {
        // OPERAÇÃO: DELETE
        const sql = "DELETE FROM continente WHERE id = ?";
        const result = await query(sql, [id]);
        
        // Verifica se alguma linha foi realmente afetada/deletada
        if (result.affectedRows === 0) {
            // Se não encontrou o ID para deletar, retorna 404
            return res.status(404).json({ error: "Continente não encontrado." });
        }
        
        return res.status(204).send(); // Sucesso sem conteúdo

    } catch (err) {
        // Se o erro for uma falha de FOREIGN KEY, isso precisa ser tratado aqui,
        // mas por enquanto, focamos no erro geral.
        console.error("Erro ao excluir continente:", err);
        return res.status(500).json({ error: "Erro interno ao excluir continente." });
    }
});

// CRUD de Países
app.post("/paises", async (req, res) => {
    const { id_continente, nome, populacao_total, idioma_oficial, moeda, 
            foto_url, foto_descricao, fotografo_nome, fotografo_perfil } = req.body;
    
    if (!id_continente || !nome || !populacao_total || !idioma_oficial || !moeda) {
        return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    try {
        // OPERAÇÃO: INSERT (CREATE)
        const sql = `
            INSERT INTO pais (id_continente, nome, populacao_total, idioma_oficial, moeda, foto_url, foto_descricao, fotografo_nome, fotografo_perfil)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            Number(id_continente),
            nome,
            populacao_total,
            idioma_oficial,
            moeda,
            foto_url || null,
            foto_descricao || null,
            fotografo_nome || null,
            fotografo_perfil || null,
        ];

        const result = await query(sql, params);
        
        // Simula o include do Prisma, pegando o nome do continente recém-criado
        const [continente] = await query("SELECT id, nome FROM continente WHERE id = ?", [Number(id_continente)]);

        // Cria o objeto de resposta no formato que o Front-end espera (com o objeto 'continente')
        const novoPais = {
            id: result.insertId,
            id_continente: Number(id_continente),
            nome,
            populacao_total,
            idioma_oficial,
            moeda,
            foto_url: foto_url || null,
            foto_descricao: foto_descricao || null,
            fotografo_nome: fotografo_nome || null,
            fotografo_perfil: fotografo_perfil || null,
            continente: continente[0] // Adiciona o objeto continente (id, nome)
        };
        
        return res.status(201).json(novoPais);
    } catch (err) {
        // ER_DUP_ENTRY: Chave duplicada (nome do país)
        if (err.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ error: "Já existe um país com este nome." });
        }
        // ER_NO_REFERENCED_ROW_2: Falha de Chave Estrangeira (id_continente não existe)
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: "O ID do continente fornecido não existe." });
        }
        
        console.error("Erro ao criar país:", err);
        return res.status(500).json({ error: "Erro interno ao cadastrar país." });
    }
});

app.get("/paises", async (req, res) => {
    try {
        // OPERAÇÃO: SELECT com JOIN (READ ALL)
        const sql = `
            SELECT 
                p.*, 
                c.id AS continente_id, 
                c.nome AS continente_nome
            FROM pais p
            JOIN continente c ON p.id_continente = c.id
            ORDER BY p.nome ASC
        `;
        const paisesResult = await query(sql);

        // Mapeia o resultado plano do JOIN para o formato aninhado do Prisma
        const paisesFormatados = paisesResult.map(p => ({
            id: p.id,
            id_continente: p.id_continente,
            nome: p.nome,
            populacao_total: p.populacao_total,
            idioma_oficial: p.idioma_oficial,
            moeda: p.moeda,
            foto_url: p.foto_url,
            foto_descricao: p.foto_descricao,
            fotografo_nome: p.fotografo_nome,
            fotografo_perfil: p.fotografo_perfil,
            continente: {
                id: p.continente_id,
                nome: p.continente_nome,
            },
        }));
        
        return res.json(paisesFormatados);
    } catch (err) {
        console.error("Erro ao listar países:", err);
        return res.status(500).json({ error: "Erro interno ao listar países." });
    }
});

app.put("/paises/:id", async (req, res) => {
    const id = req.params.id;
    const dados = req.body; 

    // O Prisma tratava a tipagem aqui; precisamos garantir que os valores estejam prontos para o SQL
    if (dados.populacao_total) {
        // Se BigInt for enviado como String, o mysql2 lida, mas garantimos
        dados.populacao_total = String(dados.populacao_total); 
    }
    if (dados.id_continente) {
        dados.id_continente = Number(dados.id_continente);
    }

    const campos = Object.keys(dados).map(key => `${key} = ?`).join(', ');
    const valores = Object.values(dados);

    if (valores.length === 0) {
        return res.status(400).json({ error: "Nenhum dado para atualizar fornecido." });
    }

    try {
        // OPERAÇÃO: UPDATE
        const sql = `UPDATE pais SET ${campos} WHERE id = ?`;
        const params = [...valores, id]; 

        const result = await query(sql, params);
        
        // Substitui o P2025: verifica se o registro foi encontrado e atualizado
        if (result.affectedRows === 0) {
            // Se o UPDATE não afetou linhas E o país existe, pode ser chave duplicada
            const paisExiste = await query("SELECT id FROM pais WHERE id = ?", [id]);
            if (paisExiste.length === 0) {
                return res.status(404).json({ error: "País não encontrado." });
            }
        }
        
        // Após o UPDATE, faz um SELECT com JOIN para retornar o objeto aninhado completo
        const selectSql = `
            SELECT 
                p.*, 
                c.id AS continente_id, 
                c.nome AS continente_nome
            FROM pais p
            JOIN continente c ON p.id_continente = c.id
            WHERE p.id = ?
        `;
        const [paisAtualizado] = await query(selectSql, [id]);

        // Formata o resultado para o formato aninhado do Prisma
        const paisFormatado = {
            ...paisAtualizado[0],
            continente: {
                id: paisAtualizado[0].continente_id,
                nome: paisAtualizado[0].continente_nome,
            },
        };
        // Remove os campos duplicados do JOIN (continente_id e continente_nome)
        delete paisFormatado.continente_id;
        delete paisFormatado.continente_nome;
        
        return res.json(paisFormatado);

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ error: "Já existe um país com este nome." });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: "O ID do continente fornecido não existe." });
        }
        console.error("Erro ao atualizar país:", err);
        return res.status(500).json({ error: "Erro interno ao atualizar país." });
    }
});

app.delete("/paises/:id", async (req, res) => { 
    const id = req.params.id;

    try {
        // OPERAÇÃO: DELETE
        const sql = "DELETE FROM pais WHERE id = ?";
        const result = await query(sql, [id]);
        
        // Verifica se alguma linha foi realmente afetada/deletada
        if (result.affectedRows === 0) {
            // Se não encontrou o ID para deletar, retorna 404 (Substitui P2025)
            return res.status(404).json({ error: "País não encontrado." });
        }
        
        return res.status(204).send();

    } catch (err) {
        // ER_ROW_IS_REFERENCED_2: Falha de Chave Estrangeira (Cidades referenciam este país)
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
             return res.status(409).json({ error: "Não é possível excluir o país pois ele possui cidades cadastradas." });
        }
        console.error("Erro ao excluir país:", err);
        return res.status(500).json({ error: "Erro interno ao excluir país." });
    }
});

// --- CRUD DE CIDADES (ADAPTADO PARA MYSQL2) ---

app.post("/cidades", async (req, res) => {
    const { id_pais, nome, populacao_total, latitude, longitude, 
            foto_url, foto_descricao, fotografo_nome, fotografo_perfil,
            clima_descricao, temperatura, umidade, vento_velocidade } = req.body;

    if (!id_pais || !nome || !populacao_total || !latitude || !longitude) {
        return res.status(400).json({ error: "Todos os campos obrigatórios (id_pais, nome, populacao_total, latitude, longitude) devem ser preenchidos." });
    }

    try {
        // 1. OPERAÇÃO: INSERT na tabela cidade
        const sql = `
            INSERT INTO cidade (
                id_pais, nome, populacao_total, latitude, longitude,
                foto_url, foto_descricao, fotografo_nome, fotografo_perfil,
                clima_descricao, temperatura, umidade, vento_velocidade
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const params = [
            Number(id_pais), nome, populacao_total, latitude, longitude,
            foto_url || null, foto_descricao || null, fotografo_nome || null, fotografo_perfil || null,
            clima_descricao || null, temperatura || null, umidade || null, vento_velocidade || null
        ];

        const result = await query(sql, params);
        const novaCidadeId = result.insertId;

        // 2. SELECT com JOIN duplo para simular o 'include' aninhado
        const selectSql = `
            SELECT 
                c.*, 
                p.id AS pais_id, p.nome AS pais_nome, p.idioma_oficial, p.moeda, p.id_continente,
                cont.id AS continente_id, cont.nome AS continente_nome
            FROM cidade c
            JOIN pais p ON c.id_pais = p.id
            JOIN continente cont ON p.id_continente = cont.id
            WHERE c.id = ?
        `;
        const [cidadeResult] = await query(selectSql, [novaCidadeId]);
        
        const cidadeCriada = cidadeResult[0];

        // 3. Formatação do resultado (para replicar a estrutura do Prisma)
        const cidadeFormatada = {
            // ... (mapeamento dos campos da cidade)
            id: cidadeCriada.id,
            id_pais: cidadeCriada.id_pais,
            nome: cidadeCriada.nome,
            populacao_total: cidadeCriada.populacao_total,
            latitude: cidadeCriada.latitude,
            longitude: cidadeCriada.longitude,
            foto_url: cidadeCriada.foto_url,
            foto_descricao: cidadeCriada.foto_descricao,
            fotografo_nome: cidadeCriada.fotografo_nome,
            fotografo_perfil: cidadeCriada.fotografo_perfil,
            clima_descricao: cidadeCriada.clima_descricao,
            temperatura: cidadeCriada.temperatura,
            umidade: cidadeCriada.umidade,
            vento_velocidade: cidadeCriada.vento_velocidade,
            
            pais: {
                id: cidadeCriada.pais_id,
                nome: cidadeCriada.pais_nome,
                idioma_oficial: cidadeCriada.idioma_oficial,
                moeda: cidadeCriada.moeda,
                id_continente: cidadeCriada.id_continente,
                continente: {
                    id: cidadeCriada.continente_id,
                    nome: cidadeCriada.continente_nome,
                },
            },
        };

        return res.status(201).json(cidadeFormatada);

    } catch (err) {
        // Mapeamento dos erros do MySQL (ER_DUP_ENTRY e ER_NO_REFERENCED_ROW_2)
        if (err.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ error: "Já existe uma cidade com este nome no banco de dados." });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: "O ID do país fornecido não existe." });
        }
        
        console.error("Erro ao criar cidade:", err);
        return res.status(500).json({ error: "Erro interno ao cadastrar cidade." });
    }
});

app.get("/cidades", async (req, res) => {
    try {
        // SELECT com JOIN duplo para obter Cidade, País e Continente
        const sql = `
            SELECT 
                c.*, 
                p.id AS pais_id, p.nome AS pais_nome, p.idioma_oficial, p.moeda, p.id_continente,
                cont.id AS continente_id, cont.nome AS continente_nome
            FROM cidade c
            JOIN pais p ON c.id_pais = p.id
            JOIN continente cont ON p.id_continente = cont.id
            ORDER BY c.nome ASC
        `;
        const cidadesResult = await query(sql);

        // Mapeia o resultado plano (JOIN) para o formato aninhado do Front-end
        const cidadesFormatadas = cidadesResult.map(c => ({
            id: c.id,
            id_pais: c.id_pais,
            nome: c.nome,
            populacao_total: c.populacao_total,
            latitude: c.latitude,
            longitude: c.longitude,
            foto_url: c.foto_url,
            foto_descricao: c.foto_descricao,
            fotografo_nome: c.fotografo_nome,
            fotografo_perfil: c.fotografo_perfil,
            clima_descricao: c.clima_descricao,
            temperatura: c.temperatura,
            umidade: c.umidade,
            vento_velocidade: c.vento_velocidade,
            
            pais: {
                id: c.pais_id,
                nome: c.pais_nome,
                idioma_oficial: c.idioma_oficial,
                moeda: c.moeda,
                id_continente: c.id_continente,
                continente: {
                    id: c.continente_id,
                    nome: c.continente_nome,
                },
            },
        }));

        return res.json(cidadesFormatadas);

    } catch (err) {
        console.error("Erro ao listar cidades:", err);
        return res.status(500).json({ error: "Erro interno ao listar cidades." });
    }
});

app.put("/cidades/:id", async (req, res) => {
    const id = req.params.id;
    const dados = req.body; 

    // Prepara dados para o UPDATE: transforma BigInt/IDs em números ou strings conforme necessário
    if (dados.populacao_total) {
        dados.populacao_total = String(dados.populacao_total); 
    }
    if (dados.id_pais) {
        dados.id_pais = Number(dados.id_pais);
    }
    
    const campos = Object.keys(dados).map(key => `${key} = ?`).join(', ');
    const valores = Object.values(dados);

    if (valores.length === 0) {
        return res.status(400).json({ error: "Nenhum dado para atualizar fornecido." });
    }

    try {
        // 1. OPERAÇÃO: UPDATE na tabela cidade
        const sql = `UPDATE cidade SET ${campos} WHERE id = ?`;
        const params = [...valores, id]; 

        const result = await query(sql, params);
        
        // Verifica se o registro foi encontrado (Substitui o P2025)
        if (result.affectedRows === 0) {
            const cidadeExiste = await query("SELECT id FROM cidade WHERE id = ?", [id]);
            if (cidadeExiste.length === 0) {
                return res.status(404).json({ error: "Cidade não encontrada." });
            }
        }
        
        // 2. SELECT com JOIN duplo para retornar o objeto aninhado completo
        const selectSql = `
            SELECT 
                c.*, 
                p.id AS pais_id, p.nome AS pais_nome, p.idioma_oficial, p.moeda, p.id_continente,
                cont.id AS continente_id, cont.nome AS continente_nome
            FROM cidade c
            JOIN pais p ON c.id_pais = p.id
            JOIN continente cont ON p.id_continente = cont.id
            WHERE c.id = ?
        `;
        const [cidadeResult] = await query(selectSql, [id]);
        
        const cidadeAtualizada = cidadeResult[0];

        // 3. Formatação do resultado
        const cidadeFormatada = {
            id: cidadeAtualizada.id,
            id_pais: cidadeAtualizada.id_pais,
            nome: cidadeAtualizada.nome,
            populacao_total: cidadeAtualizada.populacao_total,
            latitude: cidadeAtualizada.latitude,
            longitude: cidadeAtualizada.longitude,
            foto_url: cidadeAtualizada.foto_url,
            foto_descricao: cidadeAtualizada.foto_descricao,
            fotografo_nome: cidadeAtualizada.fotografo_nome,
            fotografo_perfil: cidadeAtualizada.fotografo_perfil,
            clima_descricao: cidadeAtualizada.clima_descricao,
            temperatura: cidadeAtualizada.temperatura,
            umidade: cidadeAtualizada.umidade,
            vento_velocidade: cidadeAtualizada.vento_velocidade,
            
            pais: {
                id: cidadeAtualizada.pais_id,
                nome: cidadeAtualizada.pais_nome,
                idioma_oficial: cidadeAtualizada.idioma_oficial,
                moeda: cidadeAtualizada.moeda,
                id_continente: cidadeAtualizada.id_continente,
                continente: {
                    id: cidadeAtualizada.continente_id,
                    nome: cidadeAtualizada.continente_nome,
                },
            },
        };

        return res.json(cidadeFormatada);

    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') { 
            return res.status(409).json({ error: "Já existe uma cidade com este nome no banco de dados." });
        }
        if (err.code === 'ER_NO_REFERENCED_ROW_2') {
            return res.status(400).json({ error: "O ID do país fornecido não existe." });
        }
        console.error("Erro ao atualizar cidade:", err);
        return res.status(500).json({ error: "Erro interno ao atualizar cidade." });
    }
});

app.delete("/cidades/:id", async (req, res) => { 
    const id = req.params.id;

    try {
        // OPERAÇÃO: DELETE
        const sql = "DELETE FROM cidade WHERE id = ?";
        const result = await query(sql, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Cidade não encontrada." });
        }
        
        return res.status(204).send();

    } catch (err) {
        console.error("Erro ao excluir cidade:", err);
        return res.status(500).json({ error: "Erro interno ao excluir cidade." });
    }
});

// --- ROTAS AUXILIARES DE API EXTERNA (SEM ALTERAÇÃO, POIS JÁ ESTAVAM CORRETAS) ---

// GET /clima
app.get("/clima", async (req, res) => {
    // A rota receberá a latitude (lat) e longitude (lon) como query parameters
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: "Parâmetros 'lat' e 'lon' são obrigatórios." });
    }
    
    // URL da API do OpenWeatherMap
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt_br`; // lang=pt foi corrigido para pt_br na minha última versão

    try {
        const response = await axios.get(weatherUrl);
        
        // Mapeamos e simplificamos a resposta para enviar apenas o essencial ao Front-end
        const weatherData = {
            clima_descricao: response.data.weather[0].description,
            temperatura: response.data.main.temp,
            umidade: response.data.main.humidity,
            vento_velocidade: response.data.wind.speed
        };
        
        return res.json(weatherData);

    } catch (error) {
        console.error("Erro ao buscar clima:", error.message);
        return res.status(error.response ? error.response.status : 500).json({ 
            error: "Falha ao obter dados climáticos. Verifique a chave da API ou as coordenadas.",
            details: error.response?.data
        });
    }
});

// GET /fotos
app.get("/fotos", async (req, res) => {
    // A rota receberá o termo de busca (nome da cidade ou país)
    const { query: searchQuery } = req.query; // Renomeia 'query' para 'searchQuery'

    if (!searchQuery) {
        return res.status(400).json({ error: "O parâmetro 'query' (termo de busca) é obrigatório." });
    }
    
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1`;

    try {
        const response = await axios.get(unsplashUrl);
        
        if (response.data.results.length === 0) {
            return res.status(404).json({ error: `Nenhuma foto encontrada para "${searchQuery}".` });
        }
        
        const photo = response.data.results[0];
        
        // Mapeamos para o formato esperado
        const photoInfo = {
            foto_url: photo.urls.regular,
            foto_descricao: photo.alt_description || photo.description || "Sem descrição",
            fotografo_nome: photo.user.name,
            fotografo_perfil: photo.user.links.html,
        };
        
        return res.json(photoInfo);

    } catch (error) {
        console.error(`Erro ao buscar foto para "${searchQuery}":`, error.message);
        return res.status(error.response ? error.response.status : 500).json({ 
            error: "Falha ao obter dados do Unsplash.",
            details: error.response?.data
        });
    }
});

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000; 

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
