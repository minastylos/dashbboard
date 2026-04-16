import { useState, useEffect, useMemo } from 'react';
import { CalendarCheck, ChevronLeft, ChevronRight, Filter, Clock, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';
import { useDataSync } from '../lib/useDataSync';
import { getClients, getLoans, updateLoanInstallment } from '../utils/storage';
import {
  formatCurrency,
  formatDate,
  formatDateShort,
  getLoanStatus,
} from '../utils/calculations';
import './Parcelas.css';

export default function ParcelasPage() {
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  
  // Filters: today, overdue, paid, future, all
  const [filterStatus, setFilterStatus] = useState('today');

  useEffect(() => {
    loadData();
  }, []);

  useDataSync(() => loadData());

  async function loadData() {
    try {
      const [c, l] = await Promise.all([
        getClients(),
        getLoans()
      ]);
      setClients(c);
      setLoans(l);
    } catch (err) {
      console.error(err);
    }
  }

  const todayStr = new Date().toISOString().split('T')[0];

  // Get all installments across all loans
  const allInstallments = useMemo(() => {
    const result = [];
    loans.forEach((loan) => {
      const client = clients.find((c) => c.id === loan.clientId);
      loan.installments.forEach((inst, idx) => {
        result.push({
          loanId: loan.id,
          installmentIndex: idx,
          clientName: client ? client.name : 'Desconhecido',
          clientPhone: client ? client.phone : '',
          value: inst.value,
          paid: inst.paid,
          paidDate: inst.paidDate,
          date: inst.date,
          guaranteeItem: loan.guaranteeItem,
          loanAmount: loan.loanAmount,
          installmentNumber: idx + 1,
          loanStatus: getLoanStatus(loan),
        });
      });
    });
    return result;
  }, [loans, clients]);

  // Filtered installments based on view
  const filteredInstallments = useMemo(() => {
    if (filterStatus === 'today') {
      return allInstallments.filter(i => i.date === todayStr);
    }
    if (filterStatus === 'overdue') {
      return allInstallments.filter(i => !i.paid && i.date < todayStr).sort((a,b) => a.date.localeCompare(b.date));
    }
    if (filterStatus === 'paid') {
      return allInstallments.filter(i => i.paid).sort((a,b) => b.date.localeCompare(a.date));
    }
    if (filterStatus === 'future') {
      return allInstallments.filter(i => !i.paid && i.date > todayStr).sort((a,b) => a.date.localeCompare(b.date));
    }
    if (filterStatus === 'byDate') {
      return allInstallments.filter(i => i.date === selectedDate);
    }
    return allInstallments;
  }, [allInstallments, filterStatus, todayStr, selectedDate]);

  async function handleTogglePaid(loanId, installmentIndex, currentPaid) {
    await updateLoanInstallment(loanId, installmentIndex, !currentPaid);
    loadData(true);
  }

  // Navigation for "By Date" view
  function goToPreviousDay() {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  function goToNextDay() {
    const d = new Date(selectedDate + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  const dateObj = new Date(selectedDate + 'T12:00:00');
  const dayName = dateObj.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });


  return (
    <div className="parcelas-page animate-fade-in">
      <h1 className="page-title">Controle de Cobranças</h1>

      {/* Filter Row */}
      <div className="filter-tabs glass-card">
        <button 
          className={`filter-tab ${filterStatus === 'today' ? 'active' : ''}`}
          onClick={() => setFilterStatus('today')}
        >
          <Clock size={18} />
          Hoje
        </button>
        <button 
          className={`filter-tab ${filterStatus === 'overdue' ? 'active' : ''}`}
          onClick={() => setFilterStatus('overdue')}
        >
          <AlertTriangle size={18} />
          Em Atraso
        </button>
        <button 
          className={`filter-tab ${filterStatus === 'paid' ? 'active' : ''}`}
          onClick={() => setFilterStatus('paid')}
        >
          <CheckCircle size={18} />
          Pagas
        </button>
        <button 
          className={`filter-tab ${filterStatus === 'future' ? 'active' : ''}`}
          onClick={() => setFilterStatus('future')}
        >
          <Calendar size={18} />
          Futuras
        </button>
        <button 
          className={`filter-tab ${filterStatus === 'byDate' ? 'active' : ''}`}
          onClick={() => setFilterStatus('byDate')}
        >
          <Filter size={18} />
          Por Data
        </button>
      </div>

      {/* Date Navigation (only for byDate) */}
      {filterStatus === 'byDate' && (
        <div className="date-nav glass-card animate-slide-up">
          <button className="btn btn-ghost btn-sm" onClick={goToPreviousDay}>
            <ChevronLeft size={18} />
          </button>
          <div className="date-display">
            <span className="date-main">{dateFormatted}</span>
            <span className="date-day">{dayName}</span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={goToNextDay}>
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Stats Summary for current filter */}
      <div className="filter-stats animate-fade-in">
        <div className="filter-stat-item">
          <span className="label">Total no filtro</span>
          <span className="value">{formatCurrency(filteredInstallments.reduce((a,i) => a+i.value, 0))}</span>
        </div>
        <div className="filter-stat-item">
          <span className="label">Quantidade</span>
          <span className="value">{filteredInstallments.length} parcelas</span>
        </div>
      </div>

      {/* Installments List */}
      {filteredInstallments.length === 0 ? (
        <div className="empty-state glass-card">
          <CalendarCheck size={48} />
          <p>Nenhuma parcela encontrada para este filtro.</p>
        </div>
      ) : (
        <div className="installments-list">
          {filteredInstallments.map((inst) => (
            <div
              key={`${inst.loanId}-${inst.installmentIndex}`}
              className={`installment-card glass-card ${inst.paid ? 'paid' : ''}`}
            >
              <div className="installment-left">
                <label className="custom-checkbox checkbox-lg">
                  <input
                    type="checkbox"
                    checked={inst.paid}
                    onChange={() =>
                      handleTogglePaid(
                        inst.loanId,
                        inst.installmentIndex,
                        inst.paid
                      )
                    }
                  />
                  <span className="checkmark">
                    <svg viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </span>
                </label>
              </div>

              <div className="installment-info">
                <div className="installment-client-name">{inst.clientName}</div>
                <div className="installment-meta">
                  <span>{inst.guaranteeItem}</span>
                  <span>·</span>
                  <span>Parcela {inst.installmentNumber}/30</span>
                  {filterStatus !== 'today' && filterStatus !== 'byDate' && (
                    <>
                      <span>·</span>
                      <span className={inst.date < todayStr && !inst.paid ? 'text-warn' : ''}>
                        {formatDate(inst.date)}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="installment-value">
                <span className={`installment-amount ${inst.paid ? 'paid' : ''}`}>
                  {formatCurrency(inst.value)}
                </span>
                {inst.paid && (
                  <span className="badge badge-success">Pago</span>
                )}
                {!inst.paid && inst.date < todayStr && (
                  <span className="badge badge-danger">Atrasado</span>
                )}
                {!inst.paid && inst.date === todayStr && (
                  <span className="badge badge-warning">Hoje</span>
                )}
                {!inst.paid && inst.date > todayStr && (
                  <span className="badge badge-info">Futuro</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
