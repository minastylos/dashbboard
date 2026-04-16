import { useState, useEffect } from 'react';
import {
  TrendingUp,
  Target,
  PiggyBank,
  BarChart3,
  ArrowUpRight,
  CircleDollarSign,
} from 'lucide-react';
import { getLoans, getTransactions } from '../utils/storage';
import { useDataSync } from '../lib/useDataSync';
import {
  calculateROI,
  calculateCashBalance,
  calculateForecastedBalance,
  formatCurrency,
  getLoanStats,
} from '../utils/calculations';
import './ROI.css';

export default function ROIPage() {
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  useDataSync(() => loadData());

  async function loadData() {
    try {
      const [l, t] = await Promise.all([
        getLoans(),
        getTransactions()
      ]);
      setLoans(l);
      setTransactions(t);
    } catch (err) {
      console.error(err);
    }
  }


  const roi = calculateROI(loans);
  const cashBalance = calculateCashBalance(loans, transactions);
  const forecast = calculateForecastedBalance(loans, transactions);

  // Active loans (not fully paid)
  const activeLoans = loans.filter((l) => {
    const { isCompleted } = getLoanStats(l);
    return !isCompleted;
  });

  // Completed loans
  const completedLoans = loans.filter((l) => {
    const { isCompleted } = getLoanStats(l);
    return isCompleted;
  });

  const totalProfitReceived = cashBalance.totalReceived - cashBalance.totalLent;
  const totalProfitExpected = (roi.totalToReceive || 0) - (roi.totalLent || 0);

  return (
    <div className="roi-page animate-fade-in">
      <h1 className="page-title">Análise de Retorno (ROI)</h1>

      {/* Main ROI Cards */}
      <div className="roi-cards">
        <div className="roi-card glass-card roi-consolidated">
          <div className="roi-card-header">
            <div className="roi-icon-box consolidated">
              <TrendingUp size={28} />
            </div>
            <span className="roi-card-badge">Consolidado</span>
          </div>
          <h2 className="roi-card-title">ROI Consolidado</h2>
          <p className="roi-card-desc">Rentabilidade realizada até agora</p>
          <div className="roi-big-value">
            <span className={roi.roiConsolidated >= 0 ? 'positive' : 'negative'}>
              {roi.roiConsolidated >= 0 ? '+' : ''}{roi.roiConsolidated.toFixed(2)}%
            </span>
          </div>
          <div className="roi-detail-row">
            <span>Capital investido</span>
            <strong>{formatCurrency(roi.totalLent || 0)}</strong>
          </div>
          <div className="roi-detail-row">
            <span>Total recebido</span>
            <strong className="accent">{formatCurrency(roi.totalReceived || 0)}</strong>
          </div>
          <div className="roi-detail-row">
            <span>Lucro bruto realizado</span>
            <strong className={totalProfitReceived >= 0 ? 'accent' : 'warn'}>
              {formatCurrency(totalProfitReceived)}
            </strong>
          </div>
        </div>

        <div className="roi-card glass-card roi-forecast">
          <div className="roi-card-header">
            <div className="roi-icon-box forecast">
              <Target size={28} />
            </div>
            <span className="roi-card-badge">Previsão</span>
          </div>
          <h2 className="roi-card-title">ROI Previsto</h2>
          <p className="roi-card-desc">Projeção ao fim de todos os empréstimos</p>
          <div className="roi-big-value">
            <span className={roi.roiForecast >= 0 ? 'positive' : 'negative'}>
              {roi.roiForecast >= 0 ? '+' : ''}{roi.roiForecast.toFixed(2)}%
            </span>
          </div>
          <div className="roi-detail-row">
            <span>Capital investido</span>
            <strong>{formatCurrency(roi.totalLent || 0)}</strong>
          </div>
          <div className="roi-detail-row">
            <span>Total a receber estimado</span>
            <strong className="accent">{formatCurrency(roi.totalToReceive || 0)}</strong>
          </div>
          <div className="roi-detail-row">
            <span>Lucro bruto previsto</span>
            <strong className="accent">{formatCurrency(totalProfitExpected)}</strong>
          </div>
        </div>
      </div>

      {/* Extra Stats */}
      <div className="roi-extra-stats">
        <div className="stat-card primary">
          <div className="stat-icon">
            <PiggyBank size={22} />
          </div>
          <span className="stat-label">Caixa Atual</span>
          <span className="stat-value">{formatCurrency(cashBalance.balance)}</span>
        </div>

        <div className="stat-card accent">
          <div className="stat-icon">
            <CircleDollarSign size={22} />
          </div>
          <span className="stat-label">Caixa Previsto (mês)</span>
          <span className="stat-value">{formatCurrency(forecast.forecastedBalance)}</span>
          <span className="stat-sub">+ {formatCurrency(forecast.forecastedReceivables)} em recebíveis</span>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon">
            <BarChart3 size={22} />
          </div>
          <span className="stat-label">Empréstimos Ativos</span>
          <span className="stat-value">{activeLoans.length}</span>
          <span className="stat-sub">{completedLoans.length} concluídos</span>
        </div>

        <div className="stat-card warn">
          <div className="stat-icon">
            <ArrowUpRight size={22} />
          </div>
          <span className="stat-label">Recebíveis Totais</span>
          <span className="stat-value">
            {formatCurrency(
              loans.reduce((acc, l) => {
                const { totalPendingValue } = getLoanStats(l);
                return acc + totalPendingValue;
              }, 0)
            )}
          </span>
          <span className="stat-sub">Parcelas ainda não pagas</span>
        </div>
      </div>
    </div>
  );
}
