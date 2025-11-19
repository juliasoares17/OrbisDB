import Navbar from './components/navabar/Navbar';
import AppRoutes from './routers/mainRouter';
import './App.css'
import Footer from './components/footer/Footer';

function App() {

  return (
    <>
      <Navbar></Navbar>
      <main className='main-container'>
        <AppRoutes />
      </main>
      <Footer></Footer>
    </>
  )
}

export default App
