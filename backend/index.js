import express from "express";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import cors from "cors";
import axios from "axios";
import prisma from './prisma.js';

dotenv.config();
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

app.post("/cadastro", async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
        const usuarioExistente = await prisma.usuario.findUnique({
            where: { email }
        });

        if (usuarioExistente) {
            return res.status(400).json({ error: "Email já cadastrado." });
        }

        const hash = await bcrypt.hash(senha, 10);

        await prisma.usuario.create({
            data: {
                nome,
                email,
                senha: hash
            }
        });

        return res.status(201).json({ message: "Usuário cadastrado com sucesso!" });

    } catch (err) {
        return res.status(500).json({ error: "Erro no servidor: " + err });
    }
});


app.post("/login", async (req, res) => {
    const { email, senha } = req.body;

    try {
        const usuario = await prisma.usuario.findUnique({
            where: { email }
        });

        if (!usuario) {
            return res.status(400).json({ error: "Usuário não encontrado." });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

        if (!senhaCorreta) {
            return res.status(401).json({ error: "Senha incorreta." });
        }

        return res.json({
            message: "Login realizado com sucesso!",
            usuario: {
                id: usuario.id,
                nome: usuario.nome
            }
        });

    } catch (err) {
        return res.status(500).json({ error: "Erro no servidor: " + err });
    }
});

process.on("SIGINT", async () => {
  console.log("Desconectando Prisma antes de sair...");
  await prisma.$disconnect();
  process.exit(0);
});

//CRUD de Continentes
app.post("/continentes", async (req, res) => {
    const { nome, descricao, area_km2, numero_paises, populacao_total } = req.body;
    if (!nome || !descricao) {
        return res.status(400).json({ error: "Nome e descrição são obrigatórios." });
    }
    try {
        const novoContinente = await prisma.continente.create({
            data: {
                nome,
                descricao,
                area_km2: area_km2 ? Number(area_km2) : undefined,
                numero_paises: numero_paises ? Number(numero_paises) : undefined,
                populacao_total: populacao_total ? BigInt(populacao_total) : undefined,
            },
        });
        return res.status(201).json(novoContinente);
    } catch (err) {
        if (err.code === 'P2002') { 
            return res.status(409).json({ error: "Já existe um continente com este nome." });
        }
        console.error("Erro ao criar continente:", err);
        return res.status(500).json({ error: "Erro interno ao cadastrar continente." });
    }
});

app.get("/continentes", async (req, res) => { 
    try {
        const continentes = await prisma.continente.findMany({
            orderBy: { nome: 'asc' }
        });
        return res.json(continentes);
    } catch (err) {
        console.error("Erro ao listar continentes:", err);
        return res.status(500).json({ error: "Erro interno ao listar continentes." });
    }
});

app.put("/continentes/:id", async (req, res) => {
    const id = Number(req.params.id);
    const dados = req.body;

    try {
        const continenteAtualizado = await prisma.continente.update({
            where: { id },
            data: dados,
        });
        return res.json(continenteAtualizado);
    } catch (err) {
        if (err.code === 'P2025') { 
            return res.status(404).json({ error: "Continente não encontrado." });
        }
        if (err.code === 'P2002') { 
            return res.status(409).json({ error: "Já existe um continente com este nome." });
        }
        console.error("Erro ao atualizar continente:", err);
        return res.status(500).json({ error: "Erro interno ao atualizar continente." });
    }
});

app.delete("/continentes/:id", async (req, res) => { 
    const id = Number(req.params.id);

    try {
        await prisma.continente.delete({
            where: { id },
        });
        return res.status(204).send();
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: "Continente não encontrado." });
        }
        console.error("Erro ao excluir continente:", err);
        return res.status(500).json({ error: "Erro interno ao excluir continente." });
    }
});

// CRUD de Países
app.post("/paises", async (req, res) => {
    // 📌 ATUALIZADO: Recebe os campos de foto do Front-end
    const { id_continente, nome, populacao_total, idioma_oficial, moeda, 
            foto_url, foto_descricao, fotografo_nome, fotografo_perfil } = req.body;
    
    if (!id_continente || !nome || !populacao_total || !idioma_oficial || !moeda) {
        return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    try {
        const novoPais = await prisma.pais.create({
            data: {
                id_continente: Number(id_continente),
                nome,
                populacao_total: BigInt(populacao_total),
                idioma_oficial,
                moeda,
                // 📌 NOVO: Campos da foto para persistência
                foto_url: foto_url || null,
                foto_descricao: foto_descricao || null,
                fotografo_nome: fotografo_nome || null,
                fotografo_perfil: fotografo_perfil || null,
            },
            
            include: {
                continente: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return res.status(201).json(novoPais);
    } catch (err) {
        if (err.code === 'P2002') { 
            return res.status(409).json({ error: "Já existe um país com este nome." });
        }
        console.error("Erro ao criar país:", err);
        return res.status(500).json({ error: "Erro interno ao cadastrar país." });
    }
});

app.get("/paises", async (req, res) => {
    try {
        const paises = await prisma.pais.findMany({
            orderBy: { nome: 'asc' },
            include: {
                continente: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return res.json(paises);
    } catch (err) {
        console.error("Erro ao listar países:", err);
        return res.status(500).json({ error: "Erro interno ao listar países." });
    }
});

app.put("/paises/:id", async (req, res) => {
    const id = Number(req.params.id);
    const dados = req.body; // Inclui os novos campos de foto, se enviados.

    if (dados.populacao_total !== undefined) {
        dados.populacao_total = BigInt(dados.populacao_total);
    }

    if (dados.id_continente !== undefined) {
        dados.id_continente = Number(dados.id_continente);
    }

    try {
        const paisAtualizado = await prisma.pais.update({
            where: { id },
            data: dados, // 📌 ATUALIZADO: Salva os dados de foto
            include: {
                continente: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return res.json(paisAtualizado);
    } catch (err) {
        if (err.code === 'P2025') { 
            return res.status(404).json({ error: "País não encontrado." });
        }
        if (err.code === 'P2002') { 
            return res.status(409).json({ error: "Já existe um país com este nome." });
        }
        console.error("Erro ao atualizar país:", err);
        return res.status(500).json({ error: "Erro interno ao atualizar país." });
    }
});

app.delete("/paises/:id", async (req, res) => { 
    const id = Number(req.params.id);

    try {
        await prisma.pais.delete({
            where: { id },
        });
        return res.status(204).send();
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: "País não encontrado." });
        }
        console.error("Erro ao excluir país:", err);
        return res.status(500).json({ error: "Erro interno ao excluir país." });
    }
});

// CRUD de Cidades
app.post("/cidades", async (req, res) => {
    // 📌 ATUALIZADO: Recebe os campos de foto do Front-end
    const { id_pais, nome, populacao_total, latitude, longitude, 
            foto_url, foto_descricao, fotografo_nome, fotografo_perfil } = req.body;
    
    // Converte id_pais para número imediatamente para uso no 'connect'
    const paisIdNumber = Number(id_pais);

    if (!paisIdNumber || !nome || !populacao_total || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: "Todos os campos obrigatórios devem ser preenchidos." });
    }

    try {
        // 💡 CORREÇÃO DE CAPITALIZAÇÃO E RELACIONAMENTO: usando prisma.cidade em minúsculo
        const novaCidade = await prisma.cidade.create({
            data: {
                nome, 
                populacao_total: Number(populacao_total), 
                latitude: Number(latitude), 
                longitude: Number(longitude),
                
                // CORREÇÃO PRISMA: Usa o campo de relacionamento 'pais' com 'connect'
                pais: {
                    connect: {
                        id: paisIdNumber,
                    },
                },
                
                // Campos da foto
                foto_url: foto_url || null,
                foto_descricao: foto_descricao || null,
                fotografo_nome: fotografo_nome || null,
                fotografo_perfil: fotografo_perfil || null,
            },

            include: {
                pais: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return res.status(201).json(novaCidade);
    } catch (err) {
        if (err.code === 'P2002') { 
            return res.status(409).json({ error: "Já existe uma cidade com este nome." });
        }
        console.error("Erro ao criar cidade:", err);
        return res.status(500).json({ error: "Erro interno ao cadastrar cidade." });
    }
});

app.get("/cidades", async (req, res) => {
    try {
        // 💡 CORREÇÃO DE CAPITALIZAÇÃO: usando prisma.cidade em minúsculo
        const cidades = await prisma.cidade.findMany({
            orderBy: { nome: 'asc' },
            include: {
                pais: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return res.json(cidades);
    } catch (err) {
        console.error("Erro ao listar cidades:", err);
        return res.status(500).json({ error: "Erro interno ao listar cidades." });
    }
});

app.put("/cidades/:id", async (req, res) => {
    const id = Number(req.params.id);
    const dados = req.body; // Inclui os novos campos de foto, se enviados.

    // 🛑 IMPORTANTE: Se você passar 'id_pais' no update, você DEVE usar 'connect'
    // Não altere 'dados.id_pais' para um Number diretamente se o campo de relacionamento existe.
    // Em PUTs, a abordagem mais segura é remover o id_pais do objeto de dados e usar 'connect'.
    const updateData = {};
    if (dados.id_pais !== undefined) {
        updateData.pais = { connect: { id: Number(dados.id_pais) } };
        delete dados.id_pais; // Remove para evitar conflito com o 'connect'
    }
    // Converte outros campos
    if (dados.populacao_total !== undefined) dados.populacao_total = Number(dados.populacao_total);
    if (dados.latitude !== undefined) dados.latitude = Number(dados.latitude);
    if (dados.longitude !== undefined) dados.longitude = Number(dados.longitude);

    // Mescla o que sobrou de 'dados' com o objeto 'updateData'
    Object.assign(updateData, dados);
    
    try {
        // 💡 CORREÇÃO DE CAPITALIZAÇÃO: usando prisma.cidade em minúsculo
        const cidadeAtualizada = await prisma.cidade.update({
            where: { id },
            data: updateData, // Usa o objeto de dados corrigido (com 'connect' se necessário)
            
            include: {
                pais: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return res.json(cidadeAtualizada);
    } catch (err) {
        if (err.code === 'P2025') { 
            return res.status(404).json({ error: "Cidade não encontrada." });
        }
        if (err.code === 'P2002') { 
            return res.status(409).json({ error: "Já existe uma cidade com este nome." });
        }
        console.error("Erro ao atualizar cidade:", err);
        return res.status(500).json({ error: "Erro interno ao atualizar cidade." });
    }
});

app.delete("/cidades/:id", async (req, res) => { 
    const id = Number(req.params.id);

    try {
        // 💡 CORREÇÃO DE CAPITALIZAÇÃO: usando prisma.cidade em minúsculo
        await prisma.cidade.delete({
            where: { id },
        });
        return res.status(204).send();
    } catch (err) {
        if (err.code === 'P2025') {
            return res.status(404).json({ error: "Cidade não encontrada." });
        }
        console.error("Erro ao excluir cidade:", err);
        return res.status(500).json({ error: "Erro interno ao excluir cidade." });
    }
});

app.get("/clima", async (req, res) => {
    // A rota receberá a latitude (lat) e longitude (lon) como query parameters
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: "Parâmetros 'lat' e 'lon' são obrigatórios." });
    }
    
    // URL da API do OpenWeatherMap (usando a versão 2.5)
    // units=metric: para obter Celsius
    // lang=pt: para obter descrição em português
    const weatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=pt`;

    try {
        const response = await axios.get(weatherUrl);
        
        // Mapeamos e simplificamos a resposta para enviar apenas o essencial ao Front-end
        const weatherData = {
            temperatura: response.data.main.temp,
            sensacao_termica: response.data.main.feels_like,
            temperatura_min: response.data.main.temp_min,
            temperatura_max: response.data.main.temp_max,
            pressao: response.data.main.pressure,
            umidade: response.data.main.humidity,
            descricao: response.data.weather[0].description,
            icone: response.data.weather[0].icon,
            velocidade_vento: response.data.wind.speed,
            nome_local: response.data.name,
        };
        
        return res.json(weatherData);

    } catch (error) {
        console.error("Erro ao buscar clima:", error.message);
        // Retorna o status de erro da API externa (e.g., 401, 404, 500)
        return res.status(error.response ? error.response.status : 500).json({ 
            error: "Falha ao obter dados climáticos. Verifique a chave da API ou as coordenadas.",
            details: error.response?.data
        });
    }
});

const mapUnsplashResponse = (photo) => ({
    url: photo.urls.regular, // Ou 'small'/'thumb' dependendo da sua necessidade
    download_url: photo.links.download_location, // Opcional, para obedecer às regras do Unsplash
    descricao: photo.alt_description || photo.description || 'Foto sem descrição',
    // Dados de Atribuição (MUITO IMPORTANTES para o Unsplash!)
    fotografo_nome: photo.user.name,
    fotografo_perfil: photo.user.links.html,
    unsplash_link: photo.links.html,
});

app.get("/fotos", async (req, res) => {
    // A rota receberá o termo de busca (nome da cidade ou país)
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ error: "O parâmetro 'query' (termo de busca) é obrigatório." });
    }
    
    // URL da API de busca do Unsplash. Usamos client_id (Client-Side Authentication)
    // Embora estejamos no Back-end, este é o método mais simples para requisições não autenticadas
    const unsplashUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&client_id=${UNSPLASH_ACCESS_KEY}&per_page=1`;

    try {
        const response = await axios.get(unsplashUrl);
        
        // Verifica se há resultados
        if (response.data.results.length === 0) {
            return res.status(404).json({ error: `Nenhuma foto encontrada para "${query}".` });
        }
        
        // Retorna apenas a primeira foto encontrada
        const photo = response.data.results[0];
        const simplePhoto = mapUnsplashResponse(photo);
        
        return res.json(simplePhoto);

    } catch (error) {
        console.error(`Erro ao buscar foto para "${query}":`, error.message);
        return res.status(error.response ? error.response.status : 500).json({ 
            error: "Falha ao obter dados do Unsplash.",
            details: error.response?.data
        });
    }
});

app.listen(Number(process.env.PORT), () => {
  console.log("Servidor rodando na porta " + process.env.PORT);
});
