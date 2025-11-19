import './styleNavbar.css'
import logo from '../../assets/logo_imagem.png'
import logo_texto from '../../assets/logo_texto.png'
import { Link } from 'react-router-dom';

export default function Navbar(){
    return (
        <div className='navbar'>
            <div className='logo'>
                <img src={logo} alt="imagem_logo_orbisdb" className='imagem_logo_orbisdb'/>
                <Link to="/">
                    <img src={logo_texto} alt="texto_logo_orbisdb" className='texto_logo_orbisdb'/>
                </Link>
            </div>
            <div className="conteudo_navbar">
                <h3><Link to="/cidades" className='item_navbar'>Cidades</Link></h3>
                <h3><Link to="/paises"  className='item_navbar'>Países</Link></h3>
                <h3><Link to='/continentes' className='item_navbar'>Continentes</Link></h3>
            </div>
        </div>
    )

}