import { supabase } from '../lib/supabase';

// ========== DB HELPERS (SHARED DATABASE) ==========

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
  return data;
}

export async function saveClient(client) {
  const { data, error } = await supabase
    .from('clients')
    .upsert({
      id: client.id.includes('-') ? client.id : undefined, // Supabase uses UUID, handle accordingly
      name: client.name,
      phone: client.phone,
      cpf: client.cpf
    })
    .select();

  if (error) console.error('Error saving client:', error);
  return data;
}

export async function deleteClient(id) {
  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('id', id);

  if (error) console.error('Error deleting client:', error);
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
  return data || [];
}

export async function saveLoan(loan) {
  const { data, error } = await supabase
    .from('loans')
    .insert({
      client_id: loan.clientId,
      guarantee_item: loan.guaranteeItem,
      guarantee_value: loan.guaranteeValue,
      loan_amount: loan.loanAmount,
      total_to_receive: loan.totalToReceive,
      installment_value: loan.installmentValue,
      loan_date: loan.loanDate,
      installments: loan.installments
    })
    .select();

  if (error) console.error('Error saving loan:', error);
  return data;
}

export async function deleteLoan(id) {
  const { error } = await supabase
    .from('loans')
    .delete()
    .eq('id', id);

  if (error) console.error('Error deleting loan:', error);
}

export async function updateLoanInstallment(loanId, installmentIndex, paid) {
  // First get current installments
  const { data: loan, error: fetchError } = await supabase
    .from('loans')
    .select('installments')
    .eq('id', loanId)
    .single();

  if (fetchError || !loan) return;

  const newInstallments = [...loan.installments];
  newInstallments[installmentIndex].paid = paid;
  newInstallments[installmentIndex].paidDate = paid ? new Date().toISOString() : null;

  const { error: updateError } = await supabase
    .from('loans')
    .update({ installments: newInstallments })
    .eq('id', loanId);

  if (updateError) console.error('Error updating installment:', updateError);
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
  return data || [];
}

export async function saveTransaction(transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      date: transaction.date
    })
    .select();

  if (error) console.error('Error saving transaction:', error);
  return data;
}

export async function deleteTransaction(id) {
  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id);

  if (error) console.error('Error deleting transaction:', error);
}
