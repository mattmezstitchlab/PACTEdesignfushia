import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Contrats from './pages/Contrats';
import FicheContrat from './pages/FicheContrat';
import Nouveau from './pages/Nouveau';
import Parties from './pages/Parties';
import Modeles from './pages/Modeles';
import Evenements from './pages/Evenements';
import Alertes from './pages/Alertes';
import Dossiers from './pages/Dossiers';
import Analyse from './pages/Analyse';
import ReglesIA from './pages/ReglesIA';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/contrats" element={<Contrats />} />
          <Route path="/contrats/:id" element={<FicheContrat />} />
          <Route path="/nouveau" element={<Nouveau />} />
          <Route path="/parties" element={<Parties />} />
          <Route path="/modeles" element={<Modeles />} />
          <Route path="/evenements" element={<Evenements />} />
          <Route path="/alertes" element={<Alertes />} />
          <Route path="/dossiers" element={<Dossiers />} />
          <Route path="/analyse" element={<Analyse />} />
          <Route path="/regles-ia" element={<ReglesIA />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
