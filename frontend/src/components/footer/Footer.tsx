import './styleFooter.css'
import logo_texto from '../../assets/logo_texto.png'

export default function Footer() {
    return (
        <div className="footer">
            <div className="footer_interno">
                <img src={logo_texto} alt="texto_logo_orbisdb" className="logo_footer" />
                <hr className="decorativo"></hr>
                <div className="conteudo_footer">
                    <div className="descricao_orbis">
                        <p className="texto_descricao_orbis">O OrbisDB é uma plataforma especializada no gerenciamento e catalogação de dados geográficos globais. Seu objetivo principal é fornecer uma ferramenta unificada e estruturada para armazenar, consultar e manter informações detalhadas sobre continentes, países e cidades. Ao centralizar dados cruciais, como população, área, clima e detalhes fotográficos, o OrbisDB permite aos usuários ter uma visão organizada e atualizada da distribuição e características do nosso planeta para fins de análise e referência.</p>
                    </div>
                    <div className="navegacao_footer">
                        <h3 className="titulo_seção_footer">Navegação Rápida</h3>
                        <div className="itens_footer_grupo">
                            <a href="/" className="item_footer">
                                <p className="texto_item_footer">Home</p>
                            </a>
                            <a href="/cidades" className="item_footer">
                                <p className="texto_item_footer">Cidades</p>
                            </a>
                            <a href="/paises" className="item_footer">
                                <p className="texto_item_footer">Países</p>
                            </a>
                            <a href="/continentes" className="item_footer">
                                <p className="texto_item_footer">Continentes</p>
                            </a>
                        </div>
                    </div>
                    <div>
                        <h3 className="titulo_seção_footer">Conecte-se Comigo!</h3>
                        <div className="itens_footer_grupo">
                            <a href="https://github.com/juliasoares17" target="_blank" className="item_footer">
                                <p className="texto_item_footer">GitHub</p>
                            </a>
                            <a href="https://mail.google.com/mail/?view=cm&to=juliapereira1448@gmail.com" target="_blank" className="item_footer">
                                <p className="texto_item_footer">Email</p>
                            </a>
                            <a href="https://www.linkedin.com/in/julia-soares-pereira-9ab79830b/" target="_blank" className="item_footer">
                                <p className="texto_item_footer">Linkedin</p>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            <div className="fim_footer">
                <p>© 2025 Titus Systems. Todos os direitos reservados.</p>
            </div>
        </div>
    );
}