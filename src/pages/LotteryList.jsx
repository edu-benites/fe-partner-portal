import { useEffect, useState } from 'react';
import ExportButtons from '../components/ExportButtons/ExportButtons.jsx';
import WidgetExportButton from '../components/WidgetExport/WidgetExportButton.jsx';
import { getLotteryPayments } from '../services/lotteryPaymentService.js';
import styles from './LotteryList.module.css';

const pageSize = 10;
const statuses = [
  { label: 'Não iniciado', value: 'NaoIniciado', className: styles.pending },
  { label: 'Em andamento', value: 'EmAndamento', className: styles.progress },
  { label: 'Concluído', value: 'Concluido', className: styles.done },
];
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

function paymentStatusClass(status) {
  if (status === 'Processamento') return styles.processing;
  if (status === 'Pendente') return styles.pendingPayment;
  if (status === 'Pgto. Parcial') return styles.partialPayment;
  return '';
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(date);
}

function valueOrDash(value) {
  return value === null || value === undefined || value === '' ? '—' : value;
}

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index);
  const items = [0, totalPages - 1];
  for (let index = currentPage - 1; index <= currentPage + 1; index += 1) {
    if (index > 0 && index < totalPages - 1) items.push(index);
  }
  const pages = [...new Set(items)].sort((first, second) => first - second);
  return pages.flatMap((page, index) => index && page - pages[index - 1] > 1 ? [`ellipsis-${page}`, page] : [page]);
}

export default function LotteryList({ embedded = false }) {
  const modality = sessionStorage.getItem('@Mag:modality') || 'traditional';
  const partnerName = sessionStorage.getItem('@Mag:partnerName') || 'Parceiro MAG';
  const partnerLogo = sessionStorage.getItem('@Mag:partnerLogo') || '/images/logo-default.svg';
  const cnpj = sessionStorage.getItem('@Mag:cnpj') || '';
  const [status, setStatus] = useState(statuses[0]);
  const [filters, setFilters] = useState({ contractKey: '', startDate: '', endDate: '', payValue: '', numberProposal: '' });
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedLottery, setSelectedLottery] = useState(null);

  async function loadPayments(nextPage = page, nextFilters = filters, nextStatus = status) {
    setLoading(true);
    setError('');
    try {
      const response = await getLotteryPayments({ modality, statusBeneficiaries: nextStatus.value, offset: nextPage, limit: pageSize, ...nextFilters });
      setRows(Array.isArray(response) ? response : response?.items || []);
      setTotalPages(Array.isArray(response) ? (response.length ? 1 : 0) : response?.numberOfPages || 0);
      setPage(nextPage);
    } catch (requestError) {
      console.error('Erro ao consultar os pagamentos dos sorteios:', requestError);
      setRows([]);
      setTotalPages(0);
      setError('Não foi possível carregar os sorteios. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPayments(0, filters, status);
  }, [status]);

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submitFilters(event) {
    event.preventDefault();
    loadPayments(0, filters, status);
  }

  const exportColumns = status.value === 'EmAndamento' ? [
    { label: 'Chave do título', value: (row) => row.contract?.contractKey },
    { label: 'Data do sorteio', value: (row) => row.dateLottery, format: formatDate },
    { label: 'Valor a ser pago', value: (row) => row.payValue, format: (value) => value == null ? '—' : money.format(Number(value)) },
    { label: 'Última alteração', value: (row) => row.dateStatus, format: formatDate },
    { label: 'Status', value: (row) => row.paymentStatus },
  ] : status.value === 'Concluido' ? [
    { label: 'Chave do título', value: (row) => row.contract?.contractKey },
    { label: 'Data de sorteio', value: (row) => row.dateLottery, format: formatDate },
    { label: 'Valor total pago', value: (row) => row.payValue, format: (value) => value == null ? '—' : money.format(Number(value)) },
    { label: 'Data de pagamento', value: (row) => row.datePayRegistration, format: formatDate },
  ] : [
    { label: 'Proposta', value: (row) => row.numberProposal },
    { label: 'Chave do título', value: (row) => row.contract?.contractKey },
    { label: 'Data do sorteio', value: (row) => row.dateLottery, format: formatDate },
    { label: 'Valor a ser pago', value: (row) => row.payValue, format: (value) => value == null ? '—' : money.format(Number(value)) },
    { label: 'Qtd. beneficiários', value: (row) => row.offer?.numberOfWinners },
  ];

  async function getAllRowsForExport() {
    if (totalPages <= 1) return rows;
    const pages = await Promise.all(Array.from({ length: totalPages }, (_, pageNumber) => getLotteryPayments({ modality, statusBeneficiaries: status.value, offset: pageNumber, limit: pageSize, ...filters })));
    return pages.flatMap((response) => Array.isArray(response) ? response : response?.items || []);
  }

  const appliedFilters = Object.entries(filters).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`);

  function renderRow(lottery, index) {
    const key = lottery.idPaymentLottery || lottery.idProposal || index;
    if (status.value === 'EmAndamento') {
      return <tr key={key}><td>{valueOrDash(lottery.contract?.contractKey)}</td><td>{formatDate(lottery.dateLottery)}</td><td>{lottery.payValue == null ? '—' : money.format(Number(lottery.payValue))}</td><td>{formatDate(lottery.dateStatus)}</td><td><span className={`${styles.status} ${paymentStatusClass(lottery.paymentStatus)}`}>{valueOrDash(lottery.paymentStatus)}</span></td></tr>;
    }
    if (status.value === 'Concluido') {
      return <tr key={key}><td>{valueOrDash(lottery.contract?.contractKey)}</td><td>{formatDate(lottery.dateLottery)}</td><td>{lottery.payValue == null ? '—' : money.format(Number(lottery.payValue))}</td><td>{formatDate(lottery.datePayRegistration)}</td><td><button className={styles.action} type="button" onClick={() => setSelectedLottery(lottery)}>Ver histórico</button></td></tr>;
    }
    return <tr key={key}><td>{valueOrDash(lottery.numberProposal)}</td><td>{valueOrDash(lottery.contract?.contractKey)}</td><td>{formatDate(lottery.dateLottery)}</td><td>{lottery.payValue === null || lottery.payValue === undefined || lottery.payValue === '' ? '—' : money.format(Number(lottery.payValue))}</td><td>{valueOrDash(lottery.offer?.numberOfWinners)}</td><td><button className={styles.action} type="button" onClick={() => setSelectedLottery(lottery)}>Ver detalhes</button></td></tr>;
  }

  return (
    <section className={`${styles.page} ${embedded ? styles.embedded : ''}`}>
      <div className={styles.heading}>
        <div><p className={styles.eyebrow}>Gestão de operações</p><h1>Sorteios</h1><p>Consulte os pagamentos e o andamento das promoções do parceiro.</p></div>
        {!embedded && <div className={styles.headingActions}><ExportButtons rows={rows} columns={exportColumns} title="Sorteios" tab={status.label} filters={appliedFilters} getAllRows={getAllRowsForExport} partnerLogo={partnerLogo} partnerName={partnerName} cnpj={cnpj} /><WidgetExportButton widgetName="Sorteios" widgetPath="/widgets/sorteios" description="Disponibilize a consulta de sorteios dentro do sistema da sua empresa." /></div>}
      </div>

      <div className={styles.statusTabs} role="tablist" aria-label="Status dos sorteios">
        {statuses.map((item) => <button key={item.value} id={`status-tab-${item.value}`} role="tab" type="button" className={`${styles.statusTab} ${status.value === item.value ? styles.statusTabActive : ''}`} aria-selected={status.value === item.value} tabIndex={status.value === item.value ? 0 : -1} onClick={() => setStatus(item)}>{item.label}<span className={styles.tabIndicator} /></button>)}
      </div>

      <form className={styles.toolbar} onSubmit={submitFilters}>
        <label className={styles.filterField}>Chave do título<input name="contractKey" value={filters.contractKey} onChange={updateFilter} placeholder="Digite a chave" /></label>
        <label className={styles.filterField}>Data de sorteio<input name="startDate" type="date" value={filters.startDate} onChange={updateFilter} /></label>
        <label className={styles.filterField}>Até<input name="endDate" type="date" value={filters.endDate} onChange={updateFilter} /></label>
        <label className={styles.filterField}>Valor a ser pago<input name="payValue" inputMode="decimal" value={filters.payValue} onChange={updateFilter} placeholder="R$ 0,00" /></label>
        <label className={styles.filterField}>Número de proposta<input name="numberProposal" value={filters.numberProposal} onChange={updateFilter} placeholder="Digite o número" /></label>
        <button className={styles.searchButton} type="submit" disabled={loading}>Consultar</button>
      </form>

      <div className={styles.listCard}>
        <div className={styles.listHeader}><h2>{status.label}</h2><span>{rows.length} registros nesta página</span></div>
        {loading ? <p className={styles.empty}>Carregando sorteios...</p> : error ? <p className={styles.error} role="alert">{error}</p> : rows.length ? <><div className={styles.tableWrapper}><table><thead><tr>{status.value === 'EmAndamento' ? <><th>Chave do título</th><th>Data do sorteio</th><th>Valor a ser pago</th><th>Última alteração</th><th>Status</th></> : status.value === 'Concluido' ? <><th>Chave do título</th><th>Data de sorteio</th><th>Valor total pago</th><th>Data de pagamento</th><th>Histórico</th></> : <><th>Proposta</th><th>Chave do título</th><th>Data do sorteio</th><th>Valor a ser pago</th><th>Qtd. beneficiários</th><th><span className={styles.srOnly}>Ações</span></th></>}</tr></thead><tbody>{rows.map(renderRow)}</tbody></table></div><div className={styles.pagination}><span>Página {page + 1} de {Math.max(1, totalPages)}</span><div><button type="button" disabled={page === 0 || loading} onClick={() => loadPayments(page - 1)}>Anterior</button>{getPageItems(page, totalPages).map((pageItem) => typeof pageItem === 'string' ? <span className={styles.paginationEllipsis} key={pageItem}>...</span> : <button key={pageItem} className={pageItem === page ? styles.currentPage : ''} type="button" aria-current={pageItem === page ? 'page' : undefined} disabled={loading} onClick={() => loadPayments(pageItem)}>{pageItem + 1}</button>)}<button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => loadPayments(page + 1)}>Próxima</button></div></div></> : <p className={styles.empty}>Nenhum sorteio encontrado com os filtros selecionados.</p>}
      </div>

      {selectedLottery && <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setSelectedLottery(null)}><section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="lottery-detail-title" onMouseDown={(event) => event.stopPropagation()}><button className={styles.close} type="button" aria-label="Fechar detalhes" onClick={() => setSelectedLottery(null)}>×</button><p className={styles.eyebrow}>{status.value === 'Concluido' ? 'Histórico de pagamento' : 'Detalhes do sorteio'}</p><h2 id="lottery-detail-title">{status.value === 'Concluido' ? `Título ${valueOrDash(selectedLottery.contract?.contractKey)}` : `Proposta ${valueOrDash(selectedLottery.numberProposal)}`}</h2>{status.value === 'Concluido' ? <p className={styles.empty}>O histórico de pagamento será disponibilizado aqui.</p> : <dl><div><dt>Chave do título</dt><dd>{valueOrDash(selectedLottery.contract?.contractKey)}</dd></div><div><dt>Data do sorteio</dt><dd>{formatDate(selectedLottery.dateLottery)}</dd></div><div><dt>Valor a ser pago</dt><dd>{selectedLottery.payValue == null ? '—' : money.format(Number(selectedLottery.payValue))}</dd></div><div><dt>Beneficiários</dt><dd>{valueOrDash(selectedLottery.offer?.numberOfWinners)}</dd></div></dl>}</section></div>}
    </section>
  );
}
