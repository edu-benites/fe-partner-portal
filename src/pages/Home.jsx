import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { getLotteryManagement } from '../services/lotteryService.js';
import { getDashboardSnapshot, getLotteryRows, replaceLotteryRows, saveDashboardSnapshot } from '../services/lotteryStorage.js';
import styles from './Home.module.css';

const currencyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
// Dashboard data is intentionally refreshed every 30 minutes to avoid unnecessary API calls.
const DASHBOARD_CACHE_TTL_MS = 30 * 60 * 1000;

function periodLabel(period) {
  return period === -365 ? 'Último ano' : `Últimos ${Math.abs(period)} dias`;
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function formatCurrencyValue(value) {
  return hasValue(value) ? currencyFormatter.format(Number(value)) : '—';
}

function formatQuantity(value) {
  return hasValue(value) ? Number(value).toLocaleString('pt-BR') : '—';
}

function ChartTooltip({ active, payload, label, formatValue }) {
  if (!active || !payload?.length) return null;
  return <div className={styles.tooltip}><span>{label}</span><strong>{formatValue(Number(payload[0].value))}</strong></div>;
}

function DashboardSkeleton() {
  return <div className={styles.loadingContent} aria-label="Carregando painel" aria-busy="true"><div className={styles.metrics}>{Array.from({ length: 4 }, (_, index) => <article className={styles.skeletonMetric} key={index}><span /><strong /><small /></article>)}</div><div className={styles.skeletonFilter}><span /><div><i /><i /><i /></div></div><div className={styles.charts}>{Array.from({ length: 4 }, (_, index) => <article className={`${styles.chartCard} ${styles.skeletonChart}`} key={index}><div className={styles.skeletonChartHeading}><span /><i /></div><div className={styles.skeletonChartBody}><span /><span /><span /><span /></div></article>)}</div></div>;
}

function Chart({ title, rows, field, formatValue, variant = 'columns', color }) {
  const data = rows.map((row) => ({
    name: row.ReducedProductName || row.OfferName || 'Promoção',
    value: hasValue(row[field]) ? Number(row[field]) : null,
  }));
  const availableValues = data.filter((item) => item.value !== null && item.value > 0);

  return (
    <article className={styles.chartCard} style={{ '--chart-color': color }}>
      <div className={styles.chartHeading}><div><p className={styles.chartKicker}>Por promoção</p><h2>{title}</h2></div><span className={styles.chartCount}>{availableValues.length}</span></div>
      {availableValues.length ? <div className={styles.chartCanvas}><ResponsiveContainer width="100%" height={250}>
        {variant === 'line' ? <LineChart data={data} margin={{ top: 12, right: 12, left: -12, bottom: 42 }}><CartesianGrid stroke="#e8eff2" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={62} axisLine={false} tickLine={false} tick={{ fill: '#718691', fontSize: 10 }} tickFormatter={(value) => value.length > 13 ? `${value.slice(0, 13)}...` : value} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#91a5ae', fontSize: 10 }} width={42} /><Tooltip content={<ChartTooltip formatValue={formatValue} />} /><Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }} /></LineChart> : <BarChart layout={variant === 'horizontal' ? 'vertical' : 'horizontal'} data={data} margin={{ top: 12, right: 12, left: variant === 'horizontal' ? 35 : -12, bottom: variant === 'horizontal' ? 12 : 42 }}><CartesianGrid stroke="#e8eff2" strokeDasharray="4 4" vertical={variant !== 'horizontal'} horizontal={variant === 'horizontal'} />{variant === 'horizontal' ? <><XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#91a5ae', fontSize: 10 }} /><YAxis type="category" dataKey="name" width={90} axisLine={false} tickLine={false} tick={{ fill: '#718691', fontSize: 10 }} tickFormatter={(value) => value.length > 12 ? `${value.slice(0, 12)}...` : value} /></> : <><XAxis dataKey="name" angle={-28} textAnchor="end" interval={0} height={62} axisLine={false} tickLine={false} tick={{ fill: '#718691', fontSize: 10 }} tickFormatter={(value) => value.length > 13 ? `${value.slice(0, 13)}...` : value} /><YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#91a5ae', fontSize: 10 }} width={42} /></>}<Tooltip content={<ChartTooltip formatValue={formatValue} />} cursor={{ fill: 'rgba(0, 105, 166, .06)' }} /><Bar dataKey="value" fill={color} radius={variant === 'horizontal' ? [0, 6, 6, 0] : [6, 6, 2, 2]} maxBarSize={44} /></BarChart>}
      </ResponsiveContainer></div> : <div className={styles.emptyState}><span>Sem dados</span><strong>Nenhum valor disponível</strong><p>Não há informações para exibir neste período.</p></div>}
    </article>
  );
}

export default function Home({ title = 'Início' }) {
  const isHome = title === 'Início';
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!isHome) return undefined;

    let cancelled = false;
    const cnpj = sessionStorage.getItem('@Mag:cnpj');
    const modality = sessionStorage.getItem('@Mag:modality');

    async function syncDashboard() {
      if (!cnpj || !modality) {
        setError('Não foi possível identificar o parceiro e a modalidade ativos.');
        setStatus('error');
        return;
      }

      const cachedSnapshot = await getDashboardSnapshot(cnpj, modality).catch(() => null);
      if (cachedSnapshot && Date.now() - cachedSnapshot.fetchedAt < DASHBOARD_CACHE_TTL_MS) {
        if (cancelled) return;
        const cachedRows = cachedSnapshot.rows || [];
        setRows(cachedRows);
        setSummary(cachedSnapshot.response);
        setSelectedPeriod(cachedSnapshot.response?.lotteriesManagementDetail?.[0]?.periodDays ?? cachedRows[0]?.DashboardPeriod ?? null);
        setNotice('Dados carregados da consulta local. A atualização automática ocorre a cada 30 minutos.');
        setStatus('ready');
        return;
      }

      try {
        const response = await getLotteryManagement(modality, cnpj);
        const syncedRows = await replaceLotteryRows(response, cnpj, modality);
        await saveDashboardSnapshot(response, syncedRows, cnpj, modality);
        if (cancelled) return;
        setRows(syncedRows);
        setSummary(response);
        setNotice('Dados atualizados. A próxima consulta automática ocorrerá em até 30 minutos.');
        setSelectedPeriod(response?.lotteriesManagementDetail?.[0]?.periodDays ?? syncedRows[0]?.DashboardPeriod ?? null);
        setStatus('ready');
      } catch (requestError) {
        console.error('Erro ao consultar as loterias:', requestError);
        const cachedRows = await getLotteryRows(cnpj, modality).catch(() => []);
        if (cancelled) return;
        if (cachedRows.length) {
          setRows(cachedRows);
          setSelectedPeriod(cachedRows[0].DashboardPeriod);
          setNotice('Não foi possível atualizar os dados. Exibindo a última consulta salva.');
          setStatus('cached');
        } else {
          setError('Não foi possível carregar os dados de loterias. Tente novamente mais tarde.');
          setStatus('error');
        }
      }
    }

    syncDashboard();
    return () => { cancelled = true; };
  }, [isHome]);

  if (!isHome) {
    return <section className={styles.page}><div className={styles.heading}><div><p className={styles.eyebrow}>Portal do Parceiro</p><h1>{title}</h1></div></div><div className={styles.comingSoon}><span>Em breve</span><h2>Esta área está sendo preparada</h2><p>Os recursos de {title.toLowerCase()} estarão disponíveis nas próximas etapas do portal.</p></div></section>;
  }

  const visibleRows = rows.filter((row) => row.DashboardPeriod === selectedPeriod);
  const periods = [...new Set(rows.map((row) => row.DashboardPeriod))];
  const fallbackSummary = {
    totalLotteryAmount: rows.reduce((total, row) => total + Number(row.TotalLoteryAmount || 0), 0),
    qtyTotalLotteryNumbers: rows.reduce((total, row) => total + Number(row.QtyTotalNumbersLottery || 0), 0),
    qtyLotteriesWinners: rows.reduce((total, row) => total + Number(row.QtyContractsWinners || 0), 0),
    qtyPendingRegulation: 0,
  };
  const dashboardSummary = summary || fallbackSummary;

  return (
    <section className={styles.page}>
      <div className={styles.heading}><div><p className={styles.eyebrow}>Visão geral</p><h1>Início</h1><p className={styles.cachePolicy}>Atualização automática dos dados a cada 30 minutos.</p></div></div>
      {status === 'loading' && <DashboardSkeleton />}
      {status === 'error' && <div className={styles.state}>{error}</div>}
      {(status === 'ready' || status === 'cached') && <>
        {notice && <p className={styles.notice}>{notice}</p>}
        <div className={styles.metrics}>
           <article><span className={styles.metricLabel}>Valor pago total</span><strong>{formatCurrencyValue(dashboardSummary.totalLotteryAmount)}</strong><small>Acumulado no período</small></article>
           <article><span className={styles.metricLabel}>Qtd. de número da sorte</span><strong>{formatQuantity(dashboardSummary.qtyTotalLotteryNumbers)}</strong><small>Números contabilizados</small></article>
           <article><span className={styles.metricLabel}>Sorteios premiados</span><strong>{formatQuantity(dashboardSummary.qtyLotteriesWinners)}</strong><small>Premiações realizadas</small></article>
           <article><span className={styles.metricLabel}>Pendentes de regulação</span><strong>{formatQuantity(dashboardSummary.qtyPendingRegulation)}</strong><small>Aguardando análise</small></article>
        </div>
        <div className={styles.filterArea}><span>Período</span><div className={styles.buttonGroup} role="group" aria-label="Filtrar por período">{periods.map((period) => <button key={period} type="button" className={selectedPeriod === period ? styles.selectedPeriod : ''} aria-pressed={selectedPeriod === period} onClick={() => setSelectedPeriod(period)}>{periodLabel(period)}</button>)}</div></div>
        <div className={styles.charts}>
          <Chart title="Tempo médio de pagamento" rows={visibleRows} field="AveragePayHour" formatValue={(value) => `${value}h`} color="#e07a3f" />
          <Chart title="Valor pago em prêmios" rows={visibleRows} field="TotalLoteryAmount" formatValue={(value) => currencyFormatter.format(value)} color="#087ea4" />
          <Chart title="Qtd. números da sorte" rows={visibleRows} field="QtyTotalNumbersLottery" formatValue={(value) => value.toLocaleString('pt-BR')} variant="line" color="#7257b8" />
           <Chart title="Resultados por promoção" rows={visibleRows} field="QtyContractsWinners" formatValue={(value) => value.toLocaleString('pt-BR')} variant="horizontal" color="#2c9a78" />
        </div>
      </>}
    </section>
  );
}
