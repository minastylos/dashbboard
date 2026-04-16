import { supabase } from '../lib/supabase';

// ========== STORAGE — SUPABASE (banco compartilhado entre os 3 gestores) ==========
// Todas as funções retornam dados em camelCase para as páginas.
// A conversão snake_case ↔ camelCase acontece somente aqui.

const channel = new BroadcastChannel('emprestimo_express_sync');

function notifyLocalChange() {
  channel.postMessage({ type: 'data_changed', ts: Date.now() });
}

// ========== CLIENTS ==========
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching clients:', error);
    return [];
  }

  return (data || []).map(c => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    cpf: c.cpf,
    createdAt: c.created_at,
  }));
}

export async function saveClient(client) {
  const { data, error } = await supabase
    .from('clients')
    .insert({
      id: client.id,
      name: client.name,
      phone: client.phone,
      cpf: client.cpf,
    })
    .select();

  if (error) console.error('Error saving client:', error);
  notifyLocalChange();
  return data;
}

export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) console.error('Error deleting client:', error);
  notifyLocalChange();
}

// ========== LOANS ==========
export async function getLoans() {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching loans:', error);
    return [];
  }

  return (data || []).map(l => ({
    id: l.id,
    clientId: l.client_id,
    guaranteeItem: l.guarantee_item,
    guaranteeValue: parseFloat(l.guarantee_value),
    loanAmount: parseFloat(l.loan_amount),
    totalToReceive: parseFloat(l.total_to_receive),
    installmentValue: parseFloat(l.installment_value),
    loanDate: l.loan_date,
    installments: l.installments,
    createdAt: l.created_at,
  }));
}

export async function saveLoan(loan) {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
      client_id: loan.clientId,
      guarantee_item: loan.guaranteeItem,
      guarantee_value: loan.guaranteeValue,
      loan_amount: loan.loanAmount,
      total_to_receive: loan.totalToReceive,
      installment_value: loan.installmentValue,
      loan_date: loan.loanDate,
      installments: loan.installments,
    })
    .select();

  if (error) console.error('Error saving loan:', error);
  notifyLocalChange();
  return data;
}

export async function deleteLoan(id) {
  const { error } = await supabase.from('loans').delete().eq('id', id);
  if (error) console.error('Error deleting loan:', error);
  notifyLocalChange();
}

export async function updateLoanInstallment(loanId, installmentIndex, paid) {
  const { data: loan, error: fetchError } = await supabase
    .from('loans')
    .select('installments')
    .eq('id', loanId)
    .single();

  if (fetchError || !loan) return;

  const updated = [...loan.installments];
  updated[installmentIndex].paid = paid;
  updated[installmentIndex].paidDate = paid ? new Date().toISOString() : null;

  const { error } = await supabase
    .from('loans')
    .update({ installments: updated })
    .eq('id', loanId);

  if (error) console.error('Error updating installment:', error);
  notifyLocalChange();
}

// ========== TRANSACTIONS ==========
export async function getTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }

  return (data || []).map(t => ({
    id: t.id,
    type: t.type,
    amount: parseFloat(t.amount),
    description: t.description,
    date: t.date,
    createdAt: t.created_at,
  }));
}

export async function saveTransaction(transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      id: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date,
    })
    .select();

  if (error) console.error('Error saving transaction:', error);
  notifyLocalChange();
  return data;
}

export async function deleteTransaction(id) {
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) console.error('Error deleting transaction:', error);
  notifyLocalChange();
}
