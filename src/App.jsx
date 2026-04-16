import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import Sidebar from './components/Sidebar';
import DashboardPage from './pages/Dashboard';
import ClientesPage from './pages/Clientes';
import ParcelasPage from './pages/Parcelas';
import FinanceiroPage from './pages/Financeiro';
import ROIPage from './pages/ROI';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/parcelas" element={<ParcelasPage />} />
              <Route path="/financeiro" element={<FinanceiroPage />} />
              <Route path="/roi" element={<ROIPage />} />
            </Routes>
          </main>
        </div>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
