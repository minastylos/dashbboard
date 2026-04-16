import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Wallet,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
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

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
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
        {!collapsed && (
          <div className="sidebar-footer-text">
            <span>Dashboard v1.0</span>
          </div>
        )}
      </div>
    </aside>
  );
}
