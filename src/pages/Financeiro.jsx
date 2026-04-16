import { useState, useEffect } from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Trash2,
  Wallet,
  DollarSign,
  Check,
  X,
} from 'lucide-react';
import Modal from '../components/Modal';
import { useDataSync } from '../lib/useDataSync';
import { useAuth } from '../lib/AuthContext';
import { getTransactions, saveTransaction, deleteTransaction, getLoans } from '../utils/storage';
import { generateId, formatCurrency, formatDate, calculateCashBalance } from '../utils/calculations';
import './Financeiro.css';

export default function FinanceiroPage() {
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const { isAdmin } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [transactionType, setTransactionType] = useState('aporte');
  const [form, setForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useDataSync(() => loadData());

  async function loadData() {
    try {
      const [t, l] = await Promise.all([
        getTransactions(),
        getLoans()
      ]);
      setTransactions(t);
      setLoans(l);
    } catch (err) {
      console.error(err);
    }
  }

  const cashBalance = calculateCashBalance(loans, transactions);

  const sortedTransactions = [...transactions].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  function openModal(type) {
    setTransactionType(type);
    setForm({
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    const transaction = {
      id: generateId(),
      type: transactionType,
      amount: parseFloat(form.amount),
      description: form.description.trim(),
      date: form.date,
      createdAt: new Date().toISOString(),
    };
    await saveTransaction(transaction);
    setShowModal(false);
    loadData(true);
  }

  async function executeDelete(id) {
    await deleteTransaction(id);
    setConfirmDelete(null);
    loadData(true);
  }

  const totalAportes = transactions
    .filter((t) => t.type === 'aporte')
    .reduce((a, t) => a + t.amount, 0);

  const totalRetiradas = transactions
    .filter((t) => t.type === 'retirada')
    .reduce((a, t) => a + t.amount, 0);


  return (
    <div className="financeiro-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Financeiro</h1>
        {isAdmin && (
        <div className="header-actions">
          <button className="btn btn-accent" onClick={() => openModal('aporte')}>
            <ArrowUpCircle size={18} />
            Novo Aporte
          </button>
          <button className="btn btn-danger" onClick={() => openModal('retirada')}>
            <ArrowDownCircle size={18} />
            Nova Retirada
          </button>
        </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="finance-stats">
        <div className="stat-card accent">
          <div className="stat-icon">
            <ArrowUpCircle size={22} />
          </div>
          <span className="stat-label">Total Aportes</span>
          <span className="stat-value">{formatCurrency(totalAportes)}</span>
        </div>

        <div className="stat-card warn">
          <div className="stat-icon">
            <ArrowDownCircle size={22} />
          </div>
          <span className="stat-label">Total Retiradas</span>
          <span className="stat-value">{formatCurrency(totalRetiradas)}</span>
        </div>

        <div className="stat-card primary">
          <div className="stat-icon">
            <DollarSign size={22} />
          </div>
          <span className="stat-label">Total Emprestado</span>
          <span className="stat-value">{formatCurrency(cashBalance.totalLent)}</span>
        </div>

        <div className="stat-card yellow">
          <div className="stat-icon">
            <Wallet size={22} />
          </div>
          <span className="stat-label">Caixa Atual</span>
          <span className="stat-value">{formatCurrency(cashBalance.balance)}</span>
          <span className="stat-sub">
            Recebido: {formatCurrency(cashBalance.totalReceived)}
          </span>
        </div>
      </div>

      {/* Balance Breakdown */}
      <div className="balance-breakdown glass-card">
        <h3 className="section-title">
          <Wallet size={18} />
          Composição do Caixa
        </h3>
        <div className="breakdown-items">
          <div className="breakdown-row">
            <span className="breakdown-label">
              <span className="dot dot-green" /> Aportes
            </span>
            <span className="breakdown-value positive">+ {formatCurrency(totalAportes)}</span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">
              <span className="dot dot-red" /> Retiradas
            </span>
            <span className="breakdown-value negative">- {formatCurrency(totalRetiradas)}</span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">
              <span className="dot dot-blue" /> Emprestado
            </span>
            <span className="breakdown-value negative">- {formatCurrency(cashBalance.totalLent)}</span>
          </div>
          <div className="breakdown-row">
            <span className="breakdown-label">
              <span className="dot dot-green" /> Recebido (parcelas)
            </span>
            <span className="breakdown-value positive">+ {formatCurrency(cashBalance.totalReceived)}</span>
          </div>
          <div className="breakdown-divider" />
          <div className="breakdown-row breakdown-total">
            <span className="breakdown-label">Saldo</span>
            <span className={`breakdown-value ${cashBalance.balance >= 0 ? 'positive' : 'negative'}`}>
              {formatCurrency(cashBalance.balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Transaction History */}
      <div className="transaction-history">
        <h3 className="section-title">Histórico de Transações</h3>

        {sortedTransactions.length === 0 ? (
          <div className="empty-state glass-card">
            <Wallet size={48} />
            <p>Nenhuma transação registrada</p>
          </div>
        ) : (
          <div className="transactions-list">
            {sortedTransactions.map((t) => {
              const isConfirmingDelete = confirmDelete === t.id;
              return (
                <div
                  key={t.id}
                  className={`transaction-item glass-card ${t.type}`}
                >
                  <div className="transaction-icon-wrapper">
                  {t.type === 'aporte' ? (
                    <ArrowUpCircle size={20} />
                  ) : (
                    <ArrowDownCircle size={20} />
                  )}
                </div>
                <div className="transaction-details">
                  <span className="transaction-desc">
                    {t.description || (t.type === 'aporte' ? 'Aporte' : 'Retirada')}
                  </span>
                  <span className="transaction-date">{formatDate(t.date)}</span>
                </div>
                <div className="transaction-amount-col">
                  <span className={`transaction-amount ${t.type}`}>
                    {t.type === 'aporte' ? '+' : '-'} {formatCurrency(t.amount)}
                  </span>
                </div>
                <div className="transaction-actions">
                  {isAdmin && (
                  !isConfirmingDelete ? (
                    <button
                      className="btn btn-ghost btn-sm btn-icon-delete"
                      onClick={() => setConfirmDelete(t.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  ) : (
                    <div className="confirm-delete-inline">
                      <span className="confirm-delete-text">Excluir?</span>
                      <button
                        className="btn btn-danger btn-sm btn-confirm-yes"
                        onClick={() => executeDelete(t.id)}
                      >
                        <Check size={14} />
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setConfirmDelete(null)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={transactionType === 'aporte' ? '💰 Novo Aporte' : '💸 Nova Retirada'}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowModal(false)}>
              Cancelar
            </button>
            <button
              className={`btn ${transactionType === 'aporte' ? 'btn-accent' : 'btn-danger'}`}
              form="transactionForm"
            >
              <Plus size={16} />
              Registrar
            </button>
          </>
        }
      >
        <form id="transactionForm" onSubmit={handleSave}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="label">Valor</label>
            <input
              className="form-input"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="R$ 0,00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="label">Descrição (opcional)</label>
            <input
              className="form-input"
              type="text"
              placeholder={
                transactionType === 'aporte'
                  ? 'Ex: Capital inicial, Reinvestimento...'
                  : 'Ex: Retirada de lucro, pagamento...'
              }
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="label">Data</label>
            <input
              className="form-input"
              type="date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
