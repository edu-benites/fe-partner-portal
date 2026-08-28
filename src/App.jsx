import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Access from './pages/Access.jsx';
import ProfileSelection from './pages/ProfileSelection.jsx';
import Home from './pages/Home.jsx';
import PortalLayout from './components/PortalLayout/PortalLayout.jsx';
import PartnerProfile from './pages/PartnerProfile.jsx';
import LotteryList from './pages/LotteryList.jsx';
import Integration from './pages/Integration.jsx';
import DrawnNumbers from './pages/DrawnNumbers.jsx';
import Billing from './pages/Billing.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Access />} />
        <Route path="/perfil" element={<ProfileSelection />} />
        <Route path="/portal" element={<Navigate to="/perfil" replace />} />
        <Route path="/widgets/sorteios" element={<LotteryList embedded />} />
        <Route path="/widgets/faturamento" element={<Billing embedded />} />
        <Route path="/widgets/resultados" element={<DrawnNumbers embedded />} />
        <Route element={<PortalLayout />}>
          <Route path="/inicio" element={<Home />} />
          <Route path="/arquivo/serie-fechada" element={<Home title="Série Fechada" />} />
          <Route path="/arquivo/serie-aberta" element={<Home title="Série Aberta" />} />
          <Route path="/faturamento" element={<Billing />} />
          <Route path="/sorteio" element={<LotteryList />} />
          <Route path="/resultados" element={<DrawnNumbers />} />
          <Route path="/resgate" element={<Home title="Resgate" />} />
          <Route path="/proposta" element={<Home title="Proposta" />} />
          <Route path="/perfil-usuario" element={<PartnerProfile />} />
          <Route path="/integracao" element={<Integration />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
