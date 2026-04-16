import { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CalendarCheck,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from 'lucide-react';
import { useDataSync } from '../lib/useDataSync';
import { getClients, getLoans, getTransactions, updateLoanInstallment } from '../utils/storage';
import {
  calculateCashBalance,
  calculateForecastedBalance,
  calculateTotalForecast,
  calculateROI,
  getTodayInstallments,
  getOverdueInstallments,
  formatCurrency,
  formatDate,
} from '../utils/calculations';
import './Dashboard.css';

export default function DashboardPage() {
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useDataSync(() => loadData(true));

  async function loadData(isRealtime = false) {
    if (!isRealtime) setLoading(true);
    try {
      const [c, l, t] = await Promise.all([
        getClients(),
        getLoans(),
        getTransactions()
      ]);

      // Map back snake_case to camelCase if necessary, or update calculations to handle both
      // For simplicity, let's map clientId to client_id in the calculations or here
      const mappedLoans = l.map(loan => ({
        ...loan,
        clientId: loan.client_id,
        loanAmount: parseFloat(loan.loan_amount),
        totalToReceive: parseFloat(loan.total_to_receive),
        installmentValue: parseFloat(loan.installment_value),
        guaranteeValue: parseFloat(loan.guarantee_value),
        loanDate: loan.loan_date
      }));

      const mappedTransactions = t.map(trans => ({
        ...trans,
        amount: parseFloat(trans.amount)
      }));

      setClients(c);
      setLoans(mappedLoans);
      setTransactions(mappedTransactions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const cashBalance = calculateCashBalance(loans, transactions);
  const forecast = calculateForecastedBalance(loans, transactions);
  const totalForecast = calculateTotalForecast(loans, transactions);
  const roi = calculateROI(loans);
  const todayInstallments = getTodayInstallments(loans, clients);
  const overdueInstallments = getOverdueInstallments(loans, clients);

  async function handleTogglePaid(loanId, installmentIndex, currentPaid) {
    await updateLoanInstallment(loanId, installmentIndex, !currentPaid);
    loadData(true);
  }

  const activeLoans = loans.filter((l) => {
    const paid = l.installments.filter((i) => i.paid).length;
    return paid < 30;
  });


  return (
    <div className="dashboard-page animate-fade-in">
      <h1 className="page-title">Painel de Controle</h1>

      {/* Stats Row */}
      <div className="stats-grid stats-grid-5">
        <div className="stat-card accent">
          <div className="stat-icon">
            <DollarSign size={22} />
          </div>
          <span className="stat-label">Caixa Atual</span>
          <span className="stat-value">{formatCurrency(cashBalance.balance)}</span>
          <span className="stat-sub">
            {formatCurrency(cashBalance.totalAportes)} aportes · {formatCurrency(cashBalance.totalRetiradas)} retiradas
          </span>
        </div>

        <div className="stat-card primary">
          <div className="stat-icon">
            <CalendarCheck size={22} />
          </div>
          <span className="stat-label">Caixa Previsto (mês)</span>
          <span className="stat-value">{formatCurrency(forecast.forecastedBalance)}</span>
          <span className="stat-sub">
            + {formatCurrency(forecast.forecastedReceivables)} em recebíveis
          </span>
        </div>

        <div className="stat-card accent">
          <div className="stat-icon">
            <TrendingUp size={22} />
          </div>
          <span className="stat-label">Caixa Previsto Final</span>
          <span className="stat-value">{formatCurrency(totalForecast.totalForecast)}</span>
          <span className="stat-sub">
            + {formatCurrency(totalForecast.totalPendingReceivables)} pendente total
          </span>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon">
            <TrendingUp size={22} />
          </div>
          <span className="stat-label">ROI Consolidado</span>
          <span className="stat-value">
            {roi.roiConsolidated > 0 ? '+' : ''}{roi.roiConsolidated.toFixed(1)}%
          </span>
          <span className="stat-sub">
            Previsto ao fim: {roi.roiForecast > 0 ? '+' : ''}{roi.roiForecast.toFixed(1)}%
          </span>
        </div>

        <div className="stat-card warn">
          <div className="stat-icon">
            <AlertTriangle size={22} />
          </div>
          <span className="stat-label">Parcelas em Atraso</span>
          <span className="stat-value">{overdueInstallments.length}</span>
          <span className="stat-sub">
            {formatCurrency(overdueInstallments.reduce((a, i) => a + i.value, 0))} pendente
          </span>
        </div>
      </div>

      {/* Second Row */}
      <div className="stats-grid stats-grid-3">
        <div className="stat-card primary">
          <div className="stat-icon">
            <Users size={22} />
          </div>
          <span className="stat-label">Total de Clientes</span>
          <span className="stat-value">{clients.length}</span>
        </div>

        <div className="stat-card accent">
          <div className="stat-icon">
            <ArrowUpRight size={22} />
          </div>
          <span className="stat-label">Empréstimos Ativos</span>
          <span className="stat-value">{activeLoans.length}</span>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon">
            <ArrowDownRight size={22} />
          </div>
          <span className="stat-label">Total Emprestado</span>
          <span className="stat-value">{formatCurrency(cashBalance.totalLent)}</span>
          <span className="stat-sub">{formatCurrency(cashBalance.totalReceived)} recebido</span>
        </div>
      </div>

      {/* Today's Installments */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">
            <Clock size={18} />
            Cobranças de Hoje
          </h2>
          <span className="badge badge-info">{todayInstallments.length} parcelas</span>
        </div>

        {todayInstallments.length === 0 ? (
          <div className="empty-state">
            <CalendarCheck size={40} />
            <p>Nenhuma parcela para cobrar hoje</p>
          </div>
        ) : (
          <div className="table-wrapper glass-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Garantia</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {todayInstallments.map((inst) => (
                  <tr key={`${inst.loanId}-${inst.installmentIndex}`}>
                    <td>
                      <div className="client-cell">
                        <span className="client-name">{inst.clientName}</span>
                        {inst.clientPhone && (
                          <span className="client-phone">{inst.clientPhone}</span>
                        )}
                      </div>
                    </td>
                    <td>{inst.guaranteeItem}</td>
                    <td className="font-mono">{formatCurrency(inst.value)}</td>
                    <td>
                      {inst.paid ? (
                        <span className="badge badge-success">Pago</span>
                      ) : (
                        <span className="badge badge-warning">Pendente</span>
                      )}
                    </td>
                    <td>
                      <label className="custom-checkbox">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Overdue */}
      {overdueInstallments.length > 0 && (
        <div className="dashboard-section">
          <div className="section-header">
            <h2 className="section-title section-title-warn">
              <AlertTriangle size={18} />
              Parcelas em Atraso
            </h2>
            <span className="badge badge-danger">{overdueInstallments.length} atrasadas</span>
          </div>

          <div className="table-wrapper glass-card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Garantia</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {overdueInstallments.map((inst) => (
                  <tr key={`${inst.loanId}-${inst.installmentIndex}`}>
                    <td>
                      <div className="client-cell">
                        <span className="client-name">{inst.clientName}</span>
                      </div>
                    </td>
                    <td>{inst.guaranteeItem}</td>
                    <td className="text-warn">{formatDate(inst.date)}</td>
                    <td className="font-mono">{formatCurrency(inst.value)}</td>
                    <td>
                      <label className="custom-checkbox">
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() =>
                            handleTogglePaid(
                              inst.loanId,
                              inst.installmentIndex,
                              false
                            )
                          }
                        />
                        <span className="checkmark">
                          <svg viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        </span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
