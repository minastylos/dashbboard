// ========== STORAGE (localStorage) ==========
// Persistência local instantânea, sem dependências externas.
// BroadcastChannel sincroniza entre abas abertas no mesmo navegador.

const KEYS = {
  clients: 'ee_clients',
  loans: 'ee_loans',
  transactions: 'ee_transactions',
};

const channel = new BroadcastChannel('emprestimo_express_sync');

function notifyChange() {
  channel.postMessage({ type: 'data_changed', ts: Date.now() });
}

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function write(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
  notifyChange();
}

// ========== CLIENTS ==========
export async function getClients() {
  return read(KEYS.clients).sort((a, b) => a.name.localeCompare(b.name));
}

export async function saveClient(client) {
  const list = read(KEYS.clients);
  list.push({ ...client, createdAt: new Date().toISOString() });
  write(KEYS.clients, list);
  return [client];
}

export async function deleteClient(id) {
  write(KEYS.clients, read(KEYS.clients).filter(c => c.id !== id));
  // Também remove empréstimos do cliente
  write(KEYS.loans, read(KEYS.loans).filter(l => l.clientId !== id));
}

// ========== LOANS ==========
export async function getLoans() {
  return read(KEYS.loans).sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );
}

export async function saveLoan(loan) {
  const list = read(KEYS.loans);
  const newLoan = {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
    clientId: loan.clientId,
    guaranteeItem: loan.guaranteeItem,
    guaranteeValue: loan.guaranteeValue,
    loanAmount: loan.loanAmount,
    totalToReceive: loan.totalToReceive,
    installmentValue: loan.installmentValue,
    loanDate: loan.loanDate,
    installments: loan.installments,
    createdAt: new Date().toISOString(),
  };
  list.push(newLoan);
  write(KEYS.loans, list);
  return [newLoan];
}

export async function deleteLoan(id) {
  write(KEYS.loans, read(KEYS.loans).filter(l => l.id !== id));
}

export async function updateLoanInstallment(loanId, installmentIndex, paid) {
  const list = read(KEYS.loans);
  const loan = list.find(l => l.id === loanId);
  if (!loan) return;

  loan.installments[installmentIndex].paid = paid;
  loan.installments[installmentIndex].paidDate = paid
    ? new Date().toISOString()
    : null;

  write(KEYS.loans, list);
}

// ========== TRANSACTIONS ==========
export async function getTransactions() {
  return read(KEYS.transactions).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );
}

export async function saveTransaction(transaction) {
  const list = read(KEYS.transactions);
  const newTx = {
    id: transaction.id,
    type: transaction.type,
    amount: transaction.amount,
    description: transaction.description,
    date: transaction.date,
    createdAt: transaction.createdAt || new Date().toISOString(),
  };
  list.push(newTx);
  write(KEYS.transactions, list);
  return [newTx];
}

export async function deleteTransaction(id) {
  write(KEYS.transactions, read(KEYS.transactions).filter(t => t.id !== id));
}
