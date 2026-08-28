const DATABASE_NAME = 'mag-partner-portal';
const STORE_NAME = 'lotteryManagement';
const SNAPSHOT_STORE_NAME = 'dashboardSnapshots';
const DATABASE_VERSION = 2;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('account', ['CNPJ', 'Modality'], { unique: false });
      }
      if (!database.objectStoreNames.contains(SNAPSHOT_STORE_NAME)) database.createObjectStore(SNAPSHOT_STORE_NAME, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionResult(transaction, request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    transaction.onerror = () => reject(transaction.error);
  });
}

export function flattenLotteryManagement(data, cnpj, modality) {
  return (data?.lotteriesManagementDetail || []).flatMap((period) => (
    (period.lotteriesManagementOfferDetail || []).map((offer) => ({
      id: `${cnpj}|${modality}|${period.periodDays}|${offer.offerId}`,
      DashboardPeriod: period.periodDays,
      CNPJ: cnpj,
      Modality: modality,
      OfferId: offer.offerId,
      OfferName: offer.offerName,
      ProductName: offer.productName,
      ReducedProductName: offer.reducedProductName,
      MonthDate: `${offer.yearLottery}-${String(offer.monthLottery).padStart(2, '0')}-01`,
      QtyContractsWinners: offer.qtyContractsWinners,
      TotalLoteryAmount: offer.totalLotteryAmount,
      AveragePayHour: offer.averagePayHour,
      QtyTotalNumbersLottery: offer.qtyTotalNumbersLottery,
    }))
  ));
}

export async function replaceLotteryRows(data, cnpj, modality) {
  const database = await openDatabase();
  const rows = flattenLotteryManagement(data, cnpj, modality);
  const transaction = database.transaction(STORE_NAME, 'readwrite');
  const store = transaction.objectStore(STORE_NAME);
  const existingRows = await transactionResult(transaction, store.getAll());
  existingRows.filter((row) => row.CNPJ === cnpj && row.Modality === modality).forEach((row) => store.delete(row.id));
  rows.forEach((row) => store.put(row));
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  return rows;
}

export async function getLotteryRows(cnpj, modality) {
  const database = await openDatabase();
  const transaction = database.transaction(STORE_NAME, 'readonly');
  const rows = await transactionResult(transaction, transaction.objectStore(STORE_NAME).index('account').getAll([cnpj, modality]));
  database.close();
  return rows;
}

export async function saveDashboardSnapshot(data, rows, cnpj, modality) {
  const database = await openDatabase();
  const transaction = database.transaction(SNAPSHOT_STORE_NAME, 'readwrite');
  transaction.objectStore(SNAPSHOT_STORE_NAME).put({
    id: `${cnpj}|${modality}`,
    response: data,
    rows,
    fetchedAt: Date.now(),
  });
  await new Promise((resolve, reject) => {
    transaction.oncomplete = resolve;
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}

export async function getDashboardSnapshot(cnpj, modality) {
  const database = await openDatabase();
  const transaction = database.transaction(SNAPSHOT_STORE_NAME, 'readonly');
  const snapshot = await transactionResult(transaction, transaction.objectStore(SNAPSHOT_STORE_NAME).get(`${cnpj}|${modality}`));
  database.close();
  return snapshot || null;
}
