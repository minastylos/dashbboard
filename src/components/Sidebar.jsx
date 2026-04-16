import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  LogIn,
  LogOut,
  Shield,
  Menu,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import LoginModal from './LoginModal';
import './Sidebar.css';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Painel' },
  { to: '/clientes', icon: Users, label: 'Clientes' },
  { to: '/parcelas', icon: CalendarCheck, label: 'Parcelas' },
  { to: '/financeiro', icon: Wallet, label: 'Financeiro' },
  { to: '/roi', icon: TrendingUp, label: 'ROI' },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const { user, isAdmin, logout } = useAuth();

  return (
    <>
      <div className="mobile-header">
        <div className="brand-brand" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="brand-icon" style={{ width: 32, height: 32, fontSize: '1rem' }}>E</div>
          <div className="brand-text" style={{ flexDirection: 'row', gap: '4px' }}>
            <span className="brand-name">Empréstimo</span>
            <span className="brand-sub">Express</span>
          </div>
        </div>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setMobileOpen(true)}
          style={{ padding: '6px' }}
        >
          <Menu size={24} />
        </button>
      </div>

      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-brand">
              <div className="brand-icon">E</div>
              <div className="brand-text">
                <span className="brand-name">Empréstimo</span>
                <span className="brand-sub">Express</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="brand-icon brand-icon-solo">E</div>
          )}
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed(!collapsed)}
            aria-label="Expandir/Recolher menu"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `nav-item ${isActive ? 'active' : ''}`
              }
              end={item.to === '/'}
            >
              <item.icon size={20} />
              {!collapsed && <span className="nav-label">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          {isAdmin ? (
            <div className="sidebar-auth">
              {!collapsed && (
                <div className="auth-info">
                  <Shield size={14} className="auth-icon-admin" />
                  <span className="auth-email">{user?.email?.split('@')[0]}</span>
                </div>
              )}
              <button
                className="btn-auth btn-logout"
                onClick={logout}
                title="Sair"
              >
                <LogOut size={18} />
                {!collapsed && <span>Sair</span>}
              </button>
            </div>
          ) : (
            <button
              className="btn-auth btn-login"
              onClick={() => setShowLogin(true)}
              title="Login Admin"
            >
              <LogIn size={18} />
              {!collapsed && <span>Admin Login</span>}
            </button>
          )}
        </div>
      </aside>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
}
