// Dados simulados para preencher as seções de destaque
const stats = [
    { value: "40+", label: "Continentes e Regiões Mapeados", icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15.5V16h2v1.5H11zm-2-2.75V12h6v2.75H9z" },
    { value: "980+", label: "Cidades e Países Catalogados", icon: "M12 2L2 21h20L12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" },
    { value: "20k+", label: "Pontos de Dados Gerenciados", icon: "M4 17h16v-2H4v2zm0 3h16v-2H4v2zM4 11h16V9H4v2zm0-4h16V5H4v2z" }
];

// O CSS que antes estava em styleHome.css, agora injetado aqui.
// Estilo escuro para combinar com o .main-container do App.css.
const styles = `
.homepage-container {
    padding: 3rem 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    max-width: 1200px;
    margin-top: 13rem;
    color: #F0F4F8; /* Cor de texto clara */
    min-height: calc(100vh - 80px); /* Ajusta para preencher a tela */
}

.hero-section {
    text-align: center;
    margin-bottom: 4rem;
}

.hero-title {
    font-family: 'Stack Sans Text', sans-serif;
    font-size: 3.5rem;
    font-weight: 700;
    color: #52a6a6; /* Cor de destaque para o título */
    margin-bottom: 0.5rem;
}

.hero-subtitle {
    font-family: 'Roboto', sans-serif;
    font-size: 1.5rem;
    font-weight: 400;
    color: #A0B9C6; /* Subtítulo em tom um pouco mais escuro */
    margin-bottom: 1.5rem;
}

.hero-mission {
    font-family: 'Roboto', sans-serif;
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 700px;
    margin: 0 auto;
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
    width: 100%;
    margin-bottom: 4rem;
}

.stat-card {
    background-color: #1a3442; /* Um pouco mais claro que o fundo principal */
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border: 1px solid #284c60;
}

.stat-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.3);
}

.stat-value {
    font-family: 'Stack Sans Text', sans-serif;
    font-size: 2.5rem;
    font-weight: 700;
    color: #52a6a6;
    margin-bottom: 0.5rem;
}

.stat-label {
    font-family: 'Roboto', sans-serif;
    font-size: 1rem;
    color: #A0B9C6;
}

.stat-icon svg {
    width: 48px;
    height: 48px;
    fill: #52a6a6;
    margin-bottom: 0.75rem;
}

.cta-section {
    background-color: #0c1a20; /* Fundo bem escuro */
    padding: 3rem 2rem;
    border-radius: 12px;
    text-align: center;
    width: 100%;
    max-width: 800px;
}

.cta-section h2 {
    font-family: 'Stack Sans Text', sans-serif;
    font-size: 2rem;
    color: #F0F4F8;
    margin-bottom: 1rem;
}

.cta-section p {
    font-family: 'Roboto', sans-serif;
    color: #A0B9C6;
    margin-bottom: 2rem;
}

.cta-button {
    background-color: #52a6a6;
    color: #102129;
    font-family: 'Roboto', sans-serif;
    font-weight: 700;
    padding: 0.75rem 2rem;
    border: none;
    border-radius: 8px;
    font-size: 1rem;
    cursor: pointer;
    transition: background-color 0.3s ease, transform 0.2s;
}

.cta-button:hover {
    background-color: #72c0c0;
    transform: translateY(-2px);
}
`;

export default function HomePage() {
    // Para injetar o CSS, usamos a tag <style> no JSX, que é um padrão aceitável em demos de arquivo único.
    return (
        <>
            <style>{styles}</style>
            <div className='homepage-container'>
                
                {/* 1. SEÇÃO HERO */}
                <header className="hero-section">
                    <h1 className="hero-title">Bem-vindo ao OrbisDB!</h1>
                    <p className="hero-subtitle">Seu Portal Definitivo de Dados Geográficos</p>
                    <p className="hero-mission">
                        O OrbisDB oferece uma interface intuitiva e poderosa para catalogar e gerenciar 
                        dados essenciais sobre países, continentes e cidades ao redor do globo.
                        Mantenha suas informações geográficas atualizadas, estruturadas e prontas para
                        análise, tudo em um ambiente unificado.
                    </p>
                </header>

                {/* 2. GRID DE ESTATÍSTICAS/DESTAQUES */}
                <section className="stats-grid">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card">
                            <div className="stat-icon">
                                {/* Usando SVG para ícone - Mantenha este formato para evitar dependências */}
                                <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d={stat.icon} />
                                </svg>
                            </div>
                            <div className="stat-value">{stat.value}</div>
                            <div className="stat-label">{stat.label}</div>
                        </div>
                    ))}
                </section>

                {/* 3. CHAMADA PARA AÇÃO (CTA) */}
                <section className="cta-section">
                    <h2>Pronto para Começar a Mapear?</h2>
                    <p>
                        Acesse as seções Continentes, Países ou Cidades através do menu lateral 
                        e comece a explorar ou adicionar novos dados agora mesmo.
                    </p>
                    <button className="cta-button" onClick={() => {/* Lógica de navegação, se houver */}}>
                        Ver o Dashboard de Dados
                    </button>
                </section>

            </div>
        </>
    );
}