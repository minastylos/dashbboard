// ========== BUSINESS LOGIC & CALCULATIONS ==========

/**
 * Generate a unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

/**
 * Format a number as BRL currency
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Format a date string to pt-BR
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR');
}

/**
 * Format date to short form DD/MM
 */
export function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Check if a date is Sunday (0 = Sunday)
 */
function isSunday(date) {
  return date.getDay() === 0;
}

/**
 * Get the next business day (skipping Sundays only)
 */
function nextBusinessDay(date) {
  const next = new Date(date);
  next.setDate(next.getDate() + 1);
  while (isSunday(next)) {
    next.setDate(next.getDate() + 1);
  }
  return next;
}

/**
 * Generate 30 installments for a loan.
 * - Total to receive = loanAmount * 1.30 (30% interest)
 * - Each installment = total / 30
 * - First installment is the next business day after the loan date
 * - Skips Sundays
 */
export function generateInstallments(loanAmount, loanDate) {
  const totalToReceive = loanAmount * 1.3;
  const installmentValue = Math.round((totalToReceive / 30) * 100) / 100;
  const installments = [];

  let currentDate = new Date(loanDate + 'T12:00:00');

  for (let i = 0; i < 30; i++) {
    currentDate = nextBusinessDay(currentDate);
    const dateStr = currentDate.toISOString().split('T')[0];

    installments.push({
      index: i,
      date: dateStr,
      value: installmentValue,
      paid: false,
      paidDate: null,
    });
  }

  return { installments, totalToReceive, installmentValue };
}

/**
 * Calculate how many installments were paid and total received for a loan
 */
export function getLoanStats(loan) {
  const paidInstallments = loan.installments.filter((i) => i.paid);
  const totalPaid = paidInstallments.length;
  const totalReceived = paidInstallments.reduce((acc, i) => acc + i.value, 0);
  const totalPending = loan.installments.length - totalPaid;
  const totalPendingValue = totalPending * loan.installmentValue;
  const isCompleted = totalPaid === 30;

  return { totalPaid, totalReceived, totalPending, totalPendingValue, isCompleted };
}

/**
 * Get the loan status label
 */
export function getLoanStatus(loan) {
  const { totalPaid, isCompleted } = getLoanStats(loan);
  if (isCompleted) return 'completed';

  const today = new Date().toISOString().split('T')[0];
  const overdueCount = loan.installments.filter(
    (i) => !i.paid && i.date < today
  ).length;

  if (overdueCount > 0) return 'overdue';
  if (totalPaid > 0) return 'active';
  return 'new';
}

/**
 * Calculate the full cash balance:
 * Caixa = Aportes - Retiradas - Total Emprestado + Total Recebido
 */
export function calculateCashBalance(loans, transactions) {
  const totalAportes = transactions
    .filter((t) => t.type === 'aporte')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalRetiradas = transactions
    .filter((t) => t.type === 'retirada')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalLent = loans.reduce((acc, l) => acc + l.loanAmount, 0);

  const totalReceived = loans.reduce((acc, l) => {
    const { totalReceived: received } = getLoanStats(l);
    return acc + received;
  }, 0);

  return {
    totalAportes,
    totalRetiradas,
    totalLent,
    totalReceived,
    balance: totalAportes - totalRetiradas - totalLent + totalReceived,
  };
}

/**
 * Calculate the forecasted cash balance until end of month.
 * = Current Balance + pending installments that are due this month
 */
export function calculateForecastedBalance(loans, transactions) {
  const { balance } = calculateCashBalance(loans, transactions);

  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const endOfMonthStr = endOfMonth.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  let forecastedReceivables = 0;
  loans.forEach((loan) => {
    loan.installments.forEach((inst) => {
      if (!inst.paid && inst.date >= todayStr && inst.date <= endOfMonthStr) {
        forecastedReceivables += inst.value;
      }
    });
  });

  return {
    currentBalance: balance,
    forecastedReceivables,
    forecastedBalance: balance + forecastedReceivables,
    endOfMonth: endOfMonthStr,
  };
}

/**
 * Calculate the total forecasted balance at the end of all active loans.
 * = Current Balance + all pending installments (regardless of month)
 */
export function calculateTotalForecast(loans, transactions) {
  const { balance } = calculateCashBalance(loans, transactions);
  const todayStr = new Date().toISOString().split('T')[0];

  let totalPendingReceivables = 0;
  loans.forEach((loan) => {
    loan.installments.forEach((inst) => {
      if (!inst.paid) {
        totalPendingReceivables += inst.value;
      }
    });
  });

  return {
    currentBalance: balance,
    totalPendingReceivables,
    totalForecast: balance + totalPendingReceivables,
  };
}

/**
 * Calculate consolidated ROI:
 * ROI = (Total Received - Total Lent that is already fully or partially paid) / Total Lent * 100
 *
 * Simplified:
 * ROI Consolidated = (Total Received from all loans / Total Lent for those loans) - 1
 *
 * ROI Forecasted = assumes all installments will be paid
 *   = (Total to Receive from all active loans / Total Lent) - 1
 */
export function calculateROI(loans) {
  if (loans.length === 0) {
    return { roiConsolidated: 0, roiForecast: 0 };
  }

  const totalLent = loans.reduce((acc, l) => acc + l.loanAmount, 0);

  if (totalLent === 0) {
    return { roiConsolidated: 0, roiForecast: 0 };
  }

  const totalReceived = loans.reduce((acc, l) => {
    const { totalReceived: received } = getLoanStats(l);
    return acc + received;
  }, 0);

  const totalToReceive = loans.reduce((acc, l) => acc + l.totalToReceive, 0);

  const roiConsolidated = ((totalReceived - totalLent) / totalLent) * 100;
  const roiForecast = ((totalToReceive - totalLent) / totalLent) * 100;

  return { roiConsolidated, roiForecast, totalLent, totalReceived, totalToReceive };
}

/**
 * Get today's installments across all loans
 */
export function getTodayInstallments(loans, clients) {
  const today = new Date().toISOString().split('T')[0];
  const result = [];

  loans.forEach((loan) => {
    const client = clients.find((c) => c.id === loan.clientId);
    loan.installments.forEach((inst, idx) => {
      if (inst.date === today) {
        result.push({
          loanId: loan.id,
          installmentIndex: idx,
          clientName: client ? client.name : 'Desconhecido',
          clientPhone: client ? client.phone : '',
          value: inst.value,
          paid: inst.paid,
          date: inst.date,
          guaranteeItem: loan.guaranteeItem,
        });
      }
    });
  });

  return result;
}

/**
 * Get overdue installments (past dates, not paid)
 */
export function getOverdueInstallments(loans, clients) {
  const today = new Date().toISOString().split('T')[0];
  const result = [];

  loans.forEach((loan) => {
    const client = clients.find((c) => c.id === loan.clientId);
    loan.installments.forEach((inst, idx) => {
      if (!inst.paid && inst.date < today) {
        result.push({
          loanId: loan.id,
          installmentIndex: idx,
          clientName: client ? client.name : 'Desconhecido',
          clientPhone: client ? client.phone : '',
          value: inst.value,
          date: inst.date,
          guaranteeItem: loan.guaranteeItem,
        });
      }
    });
  });

  return result;
}

/**
 * Format CPF: 000.000.000-00
 */
export function formatCPF(cpf) {
  const cleaned = cpf.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  if (cleaned.length <= 9)
    return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  return `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9)}`;
}

/**
 * Format phone: (00) 00000-0000
 */
export function formatPhone(phone) {
  const cleaned = phone.replace(/\D/g, '').slice(0, 11);
  if (cleaned.length <= 2) return cleaned;
  if (cleaned.length <= 7) return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`;
  return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
}
