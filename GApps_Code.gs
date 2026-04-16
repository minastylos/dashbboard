/**
 * EMPRÉSTIMO EXPRESS - BACKEND (GOOGLE APS SCRIPT)
 * Este script gerencia a persistência dos dados na Planilha Google.
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Empréstimo Express - Dashboard')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Inicializa a planilha se estiver vazia
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  const sheets = {
    'clientes': ['id', 'name', 'phone', 'cpf', 'createdAt'],
    'emprestimos': ['id', 'clientId', 'guaranteeItem', 'guaranteeValue', 'loanAmount', 'totalToReceive', 'installmentValue', 'loanDate', 'installments', 'createdAt'],
    'transacoes': ['id', 'type', 'amount', 'description', 'date', 'createdAt']
  };

  for (let name in sheets) {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(sheets[name]);
      sheet.getRange(1, 1, 1, sheets[name].length).setFontWeight('bold').setBackground('#f3f3f3');
    }
  }
}

// --- Funções Genéricas de CRUD ---

function getData(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0];
  return values.slice(1).map(row => {
    let obj = {};
    headers.forEach((h, i) => {
      let val = row[i];
      // Tenta parsear JSON (para as parcelas)
      if (h === 'installments' && typeof val === 'string') {
        try { val = JSON.parse(val); } catch(e) {}
      }
      obj[h] = val;
    });
    return obj;
  });
}

function saveData(sheetName, data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const row = headers.map(h => {
    let val = data[h];
    if (h === 'installments') return JSON.stringify(val);
    return val;
  });
  
  sheet.appendRow(row);
  return { success: true };
}

function updateInstallments(loanId, newInstallments) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('emprestimos');
  const values = sheet.getDataRange().getValues();
  const headers = values[0];
  const idCol = headers.indexOf('id') + 1;
  const instCol = headers.indexOf('installments') + 1;
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol-1] === loanId) {
      sheet.getRange(i + 1, instCol).setValue(JSON.stringify(newInstallments));
      return { success: true };
    }
  }
}

function deleteRow(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const values = sheet.getDataRange().getValues();
  const idCol = values[0].indexOf('id');
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][idCol] === id) {
      sheet.deleteRow(i + 1);
      return { success: true };
    }
  }
}

function getAllData() {
  // Garante que as tabelas existem antes de carregar
  setupDatabase();
  
  return {
    clients: getData('clientes'),
    loans: getData('emprestimos'),
    transactions: getData('transacoes')
  };
}
