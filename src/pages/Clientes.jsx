import { useState, useEffect } from 'react';
import { Plus, Trash2, Search, UserPlus, FileText, AlertCircle, X, Check } from 'lucide-react';
import Modal from '../components/Modal';
import { useDataSync } from '../lib/useDataSync';
import {
  getClients,
  saveClient,
  deleteClient,
  getLoans,
  saveLoan,
  deleteLoan,
  getTransactions,
} from '../utils/storage';
import {
  generateId,
  generateInstallments,
  formatCurrency,
  formatDate,
  formatCPF,
  formatPhone,
  getLoanStats,
  getLoanStatus,
  calculateCashBalance,
} from '../utils/calculations';
import './Clientes.css';

export default function ClientesPage() {
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [search, setSearch] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [showLoanModal, setShowLoanModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [expandedClient, setExpandedClient] = useState(null);
  const [loanError, setLoanError] = useState('');
  // Confirm delete states
  const [confirmDeleteClient, setConfirmDeleteClient] = useState(null);
  const [confirmDeleteLoan, setConfirmDeleteLoan] = useState(null);

  // Form states
  const [clientForm, setClientForm] = useState({ name: '', phone: '', cpf: '' });
  const [loanForm, setLoanForm] = useState({
    guaranteeItem: '',
    guaranteeValue: '',
    loanAmount: '',
    loanDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadData();
  }, []);

  useDataSync(() => loadData());

  async function loadData() {
    try {
      const [c, l, t] = await Promise.all([
        getClients(),
        getLoans(),
        getTransactions()
      ]);
      setClients(c);
      setLoans(l);
      setTransactions(t);
    } catch (err) {
      console.error(err);
    }
  }

  // Current cash balance
  const cashBalance = calculateCashBalance(loans, transactions);

  // ========== CLIENT CRUD ==========
  async function handleSaveClient(e) {
    e.preventDefault();
    const client = {
      id: generateId(),
      name: clientForm.name.trim(),
      phone: clientForm.phone.trim(),
      cpf: clientForm.cpf.trim()
    };
    await saveClient(client);
    setClientForm({ name: '', phone: '', cpf: '' });
    setShowClientModal(false);
    loadData(true);
  }

  async function executeDeleteClient(clientId) {
    await deleteClient(clientId);
    setConfirmDeleteClient(null);
    if (expandedClient === clientId) {
      setExpandedClient(null);
    }
    loadData(true);
  }

  // ========== LOAN CRUD ==========
  function openLoanModal(client) {
    setSelectedClient(client);
    setLoanError('');
    setLoanForm({
      guaranteeItem: '',
      guaranteeValue: '',
      loanAmount: '',
      loanDate: new Date().toISOString().split('T')[0],
    });
    setShowLoanModal(true);
  }

  async function handleSaveLoan(e) {
    e.preventDefault();
    setLoanError('');

    const loanAmount = parseFloat(loanForm.loanAmount);
    const guaranteeValue = parseFloat(loanForm.guaranteeValue);

    if (loanAmount > cashBalance.balance) {
      setLoanError(`Valor excede o caixa disponível. Saldo atual: ${formatCurrency(cashBalance.balance)}`);
      return;
    }

    const { installments, totalToReceive, installmentValue } = generateInstallments(
      loanAmount,
      loanForm.loanDate
    );

    const loan = {
      clientId: selectedClient.id,
      guaranteeItem: loanForm.guaranteeItem.trim(),
      guaranteeValue,
      loanAmount,
      totalToReceive,
      installmentValue,
      loanDate: loanForm.loanDate,
      installments
    };

    await saveLoan(loan);
    setShowLoanModal(false);
    loadData(true);
  }

  async function executeDeleteLoan(loanId) {
    await deleteLoan(loanId);
    setConfirmDeleteLoan(null);
    loadData(true);
  }

  // Computed
  const loanPreview = loanForm.loanAmount
    ? (() => {
        const amount = parseFloat(loanForm.loanAmount);
        if (isNaN(amount) || amount <= 0) return null;
        const total = amount * 1.3;
        const installment = total / 30;
        const exceedsCash = amount > cashBalance.balance;
        return { total, installment, exceedsCash };
      })()
    : null;

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.cpf.includes(search) ||
      c.phone.includes(search)
  );

  function getClientLoans(clientId) {
    return loans.filter((l) => l.clientId === clientId);
  }

  const statusLabels = {
    new: { label: 'Novo', class: 'badge-info' },
    active: { label: 'Ativo', class: 'badge-success' },
    overdue: { label: 'Atrasado', class: 'badge-danger' },
    completed: { label: 'Concluído', class: 'badge-success' },
  };


  return (
    <div className="clientes-page animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Clientes & Empréstimos</h1>
        <button className="btn btn-primary" onClick={() => setShowClientModal(true)}>
          <UserPlus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Search */}
      <div className="search-bar glass-card">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          className="search-input"
          placeholder="Pesquisar por nome, CPF ou telefone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="empty-state glass-card">
          <UsersIcon size={48} />
          <p>Nenhum cliente cadastrado</p>
        </div>
      ) : (
        <div className="clients-list">
          {filteredClients.map((client) => {
            const clientLoans = getClientLoans(client.id);
            const isExpanded = expandedClient === client.id;
            const isConfirmingDelete = confirmDeleteClient === client.id;

            return (
              <div key={client.id} className="client-card glass-card">
                <div
                  className="client-card-header"
                  onClick={() =>
                    setExpandedClient(isExpanded ? null : client.id)
                  }
                >
                  <div className="client-info">
                    <div className="client-avatar">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="client-details">
                      <h3 className="client-name">{client.name}</h3>
                      <div className="client-meta">
                        <span>{formatCPF(client.cpf)}</span>
                        <span>·</span>
                        <span>{formatPhone(client.phone)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="client-actions-header" onClick={(e) => e.stopPropagation()}>
                    <span className="badge badge-info">
                      {clientLoans.length} empréstimo{clientLoans.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      className="btn btn-accent btn-sm"
                      onClick={() => openLoanModal(client)}
                    >
                      <Plus size={14} />
                      Empréstimo
                    </button>

                    {/* Delete with inline confirmation */}
                    {!isConfirmingDelete ? (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setConfirmDeleteClient(client.id)}
                      >
                        <Trash2 size={14} />
                        Excluir
                      </button>
                    ) : (
                      <div className="confirm-delete-inline">
                        <span className="confirm-delete-text">Confirmar?</span>
                        <button
                          className="btn btn-danger btn-sm btn-confirm-yes"
                          onClick={() => executeDeleteClient(client.id)}
                        >
                          <Check size={14} />
                          Sim
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setConfirmDeleteClient(null)}
                        >
                          <X size={14} />
                          Não
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Expanded: show loans */}
                {isExpanded && (
                  <div className="client-loans animate-slide-up">
                    {clientLoans.length === 0 ? (
                      <p className="no-loans-text">Nenhum empréstimo registrado</p>
                    ) : (
                      clientLoans.map((loan) => {
                        const stats = getLoanStats(loan);
                        const status = getLoanStatus(loan);
                        const statusInfo = statusLabels[status];
                        const progressPct = (stats.totalPaid / 30) * 100;
                        const isConfirmingLoanDelete = confirmDeleteLoan === loan.id;

                        return (
                          <div key={loan.id} className="loan-item">
                            <div className="loan-item-header">
                              <div className="loan-item-info">
                                <div className="loan-guarantee">
                                  <FileText size={14} />
                                  <span>{loan.guaranteeItem}</span>
                                  <span className="loan-guarantee-value">
                                    (avaliação: {formatCurrency(loan.guaranteeValue)})
                                  </span>
                                </div>
                                <span className={`badge ${statusInfo.class}`}>
                                  {statusInfo.label}
                                </span>
                              </div>

                              {/* Loan delete with inline confirmation */}
                              {!isConfirmingLoanDelete ? (
                                <button
                                  className="btn btn-ghost btn-sm btn-icon-delete"
                                  onClick={() => setConfirmDeleteLoan(loan.id)}
                                >
                                  <Trash2 size={14} />
                                </button>
                              ) : (
                                <div className="confirm-delete-inline">
                                  <span className="confirm-delete-text">Excluir?</span>
                                  <button
                                    className="btn btn-danger btn-sm btn-confirm-yes"
                                    onClick={() => executeDeleteLoan(loan.id)}
                                  >
                                    <Check size={14} />
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setConfirmDeleteLoan(null)}
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                              )}
                            </div>

                            <div className="loan-numbers">
                              <div className="loan-stat">
                                <span className="loan-stat-label">Emprestado</span>
                                <span className="loan-stat-value">{formatCurrency(loan.loanAmount)}</span>
                              </div>
                              <div className="loan-stat">
                                <span className="loan-stat-label">Total a Receber</span>
                                <span className="loan-stat-value">{formatCurrency(loan.totalToReceive)}</span>
                              </div>
                              <div className="loan-stat">
                                <span className="loan-stat-label">Parcela</span>
                                <span className="loan-stat-value">{formatCurrency(loan.installmentValue)}/dia</span>
                              </div>
                              <div className="loan-stat">
                                <span className="loan-stat-label">Recebido</span>
                                <span className="loan-stat-value accent">{formatCurrency(stats.totalReceived)}</span>
                              </div>
                              <div className="loan-stat">
                                <span className="loan-stat-label">Data</span>
                                <span className="loan-stat-value">{formatDate(loan.loanDate)}</span>
                              </div>
                            </div>

                            <div className="loan-progress">
                              <div className="progress-info">
                                <span>{stats.totalPaid}/30 parcelas pagas</span>
                                <span>{progressPct.toFixed(0)}%</span>
                              </div>
                              <div className="progress-bar">
                                <div
                                  className="progress-fill"
                                  style={{ width: `${progressPct}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: New Client */}
      <Modal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        title="Novo Cliente"
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowClientModal(false)}>
              Cancelar
            </button>
            <button className="btn btn-primary" form="clientForm">
              <UserPlus size={16} />
              Cadastrar
            </button>
          </>
        }
      >
        <form id="clientForm" onSubmit={handleSaveClient}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="label">Nome Completo</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ex: João da Silva"
              value={clientForm.name}
              onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })}
              required
            />
          </div>
          <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="label">Telefone</label>
              <input
                className="form-input"
                type="text"
                placeholder="(00) 00000-0000"
                value={clientForm.phone}
                onChange={(e) =>
                  setClientForm({ ...clientForm, phone: formatPhone(e.target.value) })
                }
                required
              />
            </div>
            <div className="form-group">
              <label className="label">CPF</label>
              <input
                className="form-input"
                type="text"
                placeholder="000.000.000-00"
                value={clientForm.cpf}
                onChange={(e) =>
                  setClientForm({ ...clientForm, cpf: formatCPF(e.target.value) })
                }
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Modal: New Loan */}
      <Modal
        isOpen={showLoanModal}
        onClose={() => setShowLoanModal(false)}
        title={`Novo Empréstimo — ${selectedClient?.name || ''}`}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setShowLoanModal(false)}>
              Cancelar
            </button>
            <button
              className="btn btn-accent"
              form="loanForm"
              disabled={cashBalance.balance <= 0}
            >
              <Plus size={16} />
              Registrar Empréstimo
            </button>
          </>
        }
      >
        {/* Cash balance warning */}
        <div className="loan-cash-info">
          <span className="loan-cash-label">Caixa disponível:</span>
          <span className={`loan-cash-value ${cashBalance.balance <= 0 ? 'negative' : ''}`}>
            {formatCurrency(cashBalance.balance)}
          </span>
        </div>

        {loanError && (
          <div className="loan-error-banner">
            <AlertCircle size={18} />
            <span>{loanError}</span>
          </div>
        )}

        <form id="loanForm" onSubmit={handleSaveLoan}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="label">Item de Garantia</label>
            <input
              className="form-input"
              type="text"
              placeholder="Ex: Celular Samsung Galaxy S24"
              value={loanForm.guaranteeItem}
              onChange={(e) => setLoanForm({ ...loanForm, guaranteeItem: e.target.value })}
              required
              disabled={cashBalance.balance <= 0}
            />
          </div>

          <div className="form-row form-row-2" style={{ marginBottom: 16 }}>
            <div className="form-group">
              <label className="label">Valor Estimado da Garantia</label>
              <input
                className="form-input"
                type="number"
                step="0.01"
                min="0"
                placeholder="R$ 0,00"
                value={loanForm.guaranteeValue}
                onChange={(e) => setLoanForm({ ...loanForm, guaranteeValue: e.target.value })}
                required
                disabled={cashBalance.balance <= 0}
              />
            </div>
            <div className="form-group">
              <label className="label">Valor Emprestado</label>
              <input
                className={`form-input ${loanPreview?.exceedsCash ? 'input-error' : ''}`}
                type="number"
                step="0.01"
                min="0"
                placeholder="R$ 0,00"
                value={loanForm.loanAmount}
                onChange={(e) => {
                  setLoanForm({ ...loanForm, loanAmount: e.target.value });
                  setLoanError('');
                }}
                required
                disabled={cashBalance.balance <= 0}
              />
              {loanPreview?.exceedsCash && (
                <span className="input-error-text">Excede o caixa disponível</span>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="label">Data do Empréstimo</label>
            <input
              className="form-input"
              type="date"
              value={loanForm.loanDate}
              onChange={(e) => setLoanForm({ ...loanForm, loanDate: e.target.value })}
              required
              disabled={cashBalance.balance <= 0}
            />
          </div>

          {/* Live Preview */}
          {loanPreview && !loanPreview.exceedsCash && (
            <div className="loan-preview">
              <h4 className="loan-preview-title">📊 Cálculo Automático</h4>
              <div className="loan-preview-row">
                <span>Total a Receber (30%)</span>
                <strong>{formatCurrency(loanPreview.total)}</strong>
              </div>
              <div className="loan-preview-row">
                <span>Valor da Parcela Diária</span>
                <strong>{formatCurrency(loanPreview.installment)}</strong>
              </div>
              <div className="loan-preview-row">
                <span>Quantidade de Parcelas</span>
                <strong>30 dias (exceto domingos)</strong>
              </div>
              <div className="loan-preview-row">
                <span>Lucro Bruto</span>
                <strong className="accent-text">{formatCurrency(loanPreview.total - parseFloat(loanForm.loanAmount))}</strong>
              </div>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}

function UsersIcon({ size }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  );
}
