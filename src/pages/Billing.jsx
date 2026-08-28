import { useEffect, useState } from 'react';
import { ChevronDown, Download, FileText, MoreHorizontal } from 'lucide-react';
import ExportButtons from '../components/ExportButtons/ExportButtons.jsx';
import WidgetExportButton from '../components/WidgetExport/WidgetExportButton.jsx';
import { getInvoices } from '../services/invoiceService.js';
import styles from './Billing.module.css';

const pageSize = 10;
const statuses = ['Todos', 'Paga', 'Cancelada', 'Pendente'];
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
const years = Array.from({ length: 5 }, (_, index) => new Date().getFullYear() - index);
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const invoiceColumns = [
  { label: 'Valor', value: (row) => row.amount, format: (value) => money.format(Number(value || 0)) },
  { label: 'Status da fatura', value: (row) => row.status },
  { label: 'Data de emissão', value: (row) => row.emissionDate, format: (value) => value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—' },
  { label: 'Data de pagamento', value: (row) => row.paymentDate, format: (value) => value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—' },
  { label: 'Data de vencimento', value: (row) => row.dueDate, format: (value) => value ? new Intl.DateTimeFormat('pt-BR').format(new Date(value)) : '—' },
  { label: 'Status dos títulos', value: (row) => row.contractsStatus?.map((item) => `${item.status}: ${item.qtyContracts}`).join(' | ') },
];

function dateRange(month, year) {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const endDate = new Date(year, month + 1, 0).toISOString().slice(0, 10);
  return { startDate, endDate };
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('pt-BR').format(date);
}

function statusClass(status) {
  return status === 'Paga' ? styles.paid : status === 'Cancelada' ? styles.cancelled : styles.pending;
}

function contractsProgress(contracts = []) {
  const total = contracts.reduce((sum, item) => sum + Number(item.qtyContracts || 0), 0);
  const active = contracts.reduce((sum, item) => sum + (item.status === 'Ativo' ? Number(item.qtyContracts || 0) : 0), 0);
  return { total, percentage: total ? Math.round((active / total) * 100) : 0 };
}

export default function Billing({ embedded = false }) {
  const today = new Date();
  const [filters, setFilters] = useState({ month: today.getMonth(), year: today.getFullYear(), status: 'Todos' });
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openPopover, setOpenPopover] = useState(null);
  const [actionPosition, setActionPosition] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  async function loadInvoices(nextPage = page, nextFilters = filters) {
    setLoading(true);
    setError('');
    const { startDate, endDate } = dateRange(nextFilters.month, nextFilters.year);
    try {
      const response = await getInvoices({ offset: nextPage, limit: pageSize, status: nextFilters.status === 'Todos' ? '' : nextFilters.status, startDate, endDate, orderField: 'DueDate', desc: true });
      setRows(response?.items || []);
      setTotalPages(response?.numberOfPages || 0);
      setPage(nextPage);
    } catch (requestError) {
      console.error('Erro ao consultar as faturas:', requestError);
      setRows([]);
      setTotalPages(0);
      setError('Não foi possível carregar as faturas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInvoices(0, filters); }, [filters.month, filters.year, filters.status]);

  useEffect(() => {
    function closePopovers(event) {
      const target = event.target;
      if (target.closest(`.${styles.contractStatus}`) || target.closest(`.${styles.contractPopover}`) || target.closest(`.${styles.more}`) || target.closest(`.${styles.actionPopover}`)) return;
      setOpenPopover(null);
      setActionPosition(null);
    }

    document.addEventListener('mousedown', closePopovers);
    return () => document.removeEventListener('mousedown', closePopovers);
  }, []);

  function updateFilter(event) {
    setFilters((current) => ({ ...current, [event.target.name]: event.target.name === 'month' || event.target.name === 'year' ? Number(event.target.value) : event.target.value }));
  }

  function documentAction(label, invoice) {
    setOpenPopover(null);
    setActionPosition(null);
    setActionMessage(`${label} da fatura ${invoice.invoiceId} será disponibilizado pelo serviço de documentos.`);
  }

  function toggleActions(event, invoiceId) {
    if (openPopover === `actions-${invoiceId}`) {
      setOpenPopover(null);
      setActionPosition(null);
      return;
    }
    const bounds = event.currentTarget.getBoundingClientRect();
    setActionPosition({ top: bounds.bottom + 6, right: window.innerWidth - bounds.right });
    setOpenPopover(`actions-${invoiceId}`);
  }

  return (
    <section className={styles.page}>
      <div className={styles.heading}><div><p className={styles.eyebrow}>Gestão financeira</p><h1>Faturamento</h1><p>Consulte suas faturas, vencimentos e situação dos títulos.</p></div>{!embedded && <div className={styles.headingActions}><ExportButtons rows={rows} columns={invoiceColumns} title="Faturamento" tab={filters.status} filters={[`Mês: ${months[filters.month]}`, `Ano: ${filters.year}`, `Status: ${filters.status}`]} partnerLogo={sessionStorage.getItem('@Mag:partnerLogo') || '/images/logo-default.svg'} partnerName={sessionStorage.getItem('@Mag:partnerName') || 'Parceiro MAG'} cnpj={sessionStorage.getItem('@Mag:cnpj') || ''} /><WidgetExportButton widgetName="Faturamento" widgetPath="/widgets/faturamento" description="Disponibilize a consulta de faturamento dentro do sistema da sua empresa." /></div>}</div>
      <div className={styles.toolbar}>
        <label>Mês<select name="month" value={filters.month} onChange={updateFilter}>{months.map((month, index) => <option value={index} key={month}>{month}</option>)}</select></label>
        <label>Ano<select name="year" value={filters.year} onChange={updateFilter}>{years.map((year) => <option value={year} key={year}>{year}</option>)}</select></label>
        <label>Status<select name="status" value={filters.status} onChange={updateFilter}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
      </div>
      {actionMessage && <p className={styles.notice} role="status">{actionMessage}</p>}
      <div className={styles.listCard}>
        <div className={styles.listHeader}><div><p className={styles.kicker}>Faturas do período</p><h2>{months[filters.month]} de {filters.year}</h2></div><span>{rows.length} registros nesta página</span></div>
        {loading ? <p className={styles.empty}>Carregando faturas...</p> : error ? <p className={styles.error} role="alert">{error}</p> : rows.length ? <><div className={styles.tableWrapper}><table><thead><tr><th>Valor</th><th>Status da fatura</th><th>Data de emissão</th><th>Data de pagamento</th><th>Data de vencimento</th><th>Status dos títulos</th><th><span className={styles.srOnly}>Ações</span></th></tr></thead><tbody>{rows.map((invoice) => { const progress = contractsProgress(invoice.contractsStatus); return <tr key={invoice.invoiceId}><td><strong>{money.format(Number(invoice.amount || 0))}</strong><small>Fatura #{invoice.invoiceId}</small></td><td><span className={`${styles.status} ${statusClass(invoice.status)}`}>{invoice.status || '—'}</span></td><td>{formatDate(invoice.emissionDate)}</td><td>{formatDate(invoice.paymentDate)}</td><td>{formatDate(invoice.dueDate)}</td><td><button className={styles.contractStatus} type="button" onClick={() => setOpenPopover(openPopover === invoice.invoiceId ? null : invoice.invoiceId)}><span className={styles.progressTrack}><span style={{ width: `${progress.percentage}%` }} /></span><span>{progress.total} títulos</span><ChevronDown size={14} /></button>{openPopover === invoice.invoiceId && <div className={styles.contractPopover}><strong>Detalhamento dos títulos</strong>{invoice.contractsStatus?.length ? invoice.contractsStatus.map((item) => <div key={item.status}><span>{item.status}</span><b>{item.qtyContracts}</b></div>) : <small>Nenhum detalhe disponível.</small>}</div>}</td><td className={styles.actionCell}><button className={styles.more} type="button" aria-label="Abrir ações da fatura" onClick={(event) => toggleActions(event, invoice.invoiceId)}><MoreHorizontal size={18} /></button>{openPopover === `actions-${invoice.invoiceId}` && <div className={styles.actionPopover} style={{ top: actionPosition?.top, right: actionPosition?.right }}><button type="button" onClick={() => documentAction('Download do boleto', invoice)}><Download size={15} />Baixar boleto</button><button type="button" onClick={() => documentAction('Download do demonstrativo', invoice)}><FileText size={15} />Baixar demonstrativo</button></div>}</td></tr>; })}</tbody></table></div><div className={styles.pagination}><span>Página {page + 1} de {Math.max(1, totalPages)}</span><div><button type="button" disabled={page === 0 || loading} onClick={() => loadInvoices(page - 1)}>Anterior</button>{Array.from({ length: totalPages }, (_, pageNumber) => <button key={pageNumber} className={pageNumber === page ? styles.currentPage : ''} type="button" aria-current={pageNumber === page ? 'page' : undefined} disabled={loading} onClick={() => loadInvoices(pageNumber)}>{pageNumber + 1}</button>)}<button type="button" disabled={page + 1 >= totalPages || loading} onClick={() => loadInvoices(page + 1)}>Próxima</button></div></div></> : <p className={styles.empty}>Nenhuma fatura encontrada para os filtros selecionados.</p>}
      </div>
    </section>
  );
}
