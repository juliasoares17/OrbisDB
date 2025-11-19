import { Route, Routes } from "react-router-dom"
import HomePage from '../pages/home/HomePage'
import CidadesPage from "../pages/cidades/CidadesPage";
import PaisesPage from "../pages/paises/PaisesPage";
import ContinentesPage from "../pages/continentes/ContinentesPage";

export default function AppRoutes() {

    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/cidades" element={<CidadesPage />} />
            <Route path="/paises" element={<PaisesPage />} />
            <Route path="/continentes" element={<ContinentesPage />} />
        </Routes>
    );
}