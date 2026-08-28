import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';
import WidgetExportButton from '../components/WidgetExport/WidgetExportButton.jsx';
import { getLotteryResults } from '../services/lotteryResultsService.js';
import styles from './DrawnNumbers.module.css';

const limit = 10;

function toInputDate(date) {
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}

function today() {
  return toInputDate(new Date());
}

function firstDayOfYear() {
  return `${new Date().getFullYear()}-01-01`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${value}T00:00:00`));
}

function formatNumber(value) {
  return String(value ?? '').padStart(6, '0');
}

function groupByDate(items) {
  return Object.entries(items.reduce((groups, item) => ({ ...groups, [item.lotteryResultsDate]: [...(groups[item.lotteryResultsDate] || []), item] }), {})).sort(([dateA], [dateB]) => dateB.localeCompare(dateA));
}

function getCalendarDays(startDate, endDate) {
  const days = [];
  const current = new Date(`${endDate}T12:00:00`);
  const minimumDate = new Date(current);
  minimumDate.setDate(minimumDate.getDate() - 29);
  const rangeStart = new Date(`${startDate}T12:00:00`);
  if (rangeStart > minimumDate) minimumDate.setTime(rangeStart.getTime());
  while (current >= minimumDate && days.length < 60) {
    days.push(toInputDate(current));
    current.setDate(current.getDate() - 1);
  }
  return days;
}

function getLastSixtyDays() {
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 59);
  return { startDate: toInputDate(start), endDate: toInputDate(end) };
}

function ResultsSkeleton() {
  return <div className={styles.skeletonResults} aria-label="Carregando resultados" aria-busy="true"><div className={styles.skeletonSummary}><span /><i /></div><div className={styles.skeletonDate}><span /><div><i /><small /></div></div><div className={styles.skeletonResultList}>{Array.from({ length: 3 }, (_, index) => <div className={styles.skeletonResultRow} key={index}><span /><span /><span /><span /></div>)}</div></div>;
}

export default function DrawnNumbers({ embedded = false }) {
  const [filters, setFilters] = useState({ startDate: firstDayOfYear(), endDate: today(), winningNumber: '' });
  const [results, setResults] = useState([]);
  const [resultDates, setResultDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [filtersBeforeDate, setFiltersBeforeDate] = useState(null);
  const [isCalendarDragging, setIsCalendarDragging] = useState(false);
  const calendarDrag = useRef({ active: false, moved: false, startX: 0, scrollLeft: 0 });
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedId, setExpandedId] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  async function loadCalendar() {
    try {
      const calendarFilters = getLastSixtyDays();
      const firstPage = await getLotteryResults({ ...calendarFilters, limit, offset: 0, code: sessionStorage.getItem('@Mag:code') || '' });
      const numberOfPages = Math.max(1, firstPage?.numberOfPages || 0);
      const pages = await Promise.all(Array.from({ length: numberOfPages }, (_, pageNumber) => pageNumber === 0 ? firstPage : getLotteryResults({ ...calendarFilters, limit, offset: pageNumber, code: sessionStorage.getItem('@Mag:code') || '' })));
      setResultDates([...new Set(pages.flatMap((pageResponse) => (pageResponse?.items || []).map((item) => item.lotteryResultsDate))) ]);
    } catch (requestError) {
      console.error('Erro ao consultar as datas dos sorteios:', requestError);
    }
  }

  async function loadResults(nextPage, nextFilters = filters) {
    setStatus('loading');
    setError('');
    try {
      const response = await getLotteryResults({ ...nextFilters, limit, offset: nextPage, code: sessionStorage.getItem('@Mag:code') || '' });
      setResults(response?.items || []);
      setTotalPages(response?.numberOfPages || 0);
      setPage(nextPage);
      setExpandedId(null);
      setStatus('ready');
    } catch (requestError) {
      console.error('Erro ao consultar os números sorteados:', requestError);
      setError('Não foi possível carregar os números sorteados. Tente novamente.');
      setStatus('error');
    }
  }

  useEffect(() => {
    loadCalendar();
    loadResults(0);
  }, []);

  useEffect(() => {
    const viewport = document.querySelector(`.${styles.calendarViewport}`);
    const scroller = viewport?.querySelector(`.${styles.calendarScroller}`);
    if (!viewport || !scroller) return undefined;
    const updateShadows = () => {
      const maxScroll = scroller.scrollWidth - scroller.clientWidth;
      viewport.classList.toggle(styles.shadowLeft, scroller.scrollLeft > 1);
      viewport.classList.toggle(styles.shadowRight, maxScroll - scroller.scrollLeft > 1);
    };
    updateShadows();
    scroller.addEventListener('scroll', updateShadows);
    window.addEventListener('resize', updateShadows);
    return () => { scroller.removeEventListener('scroll', updateShadows); window.removeEventListener('resize', updateShadows); };
  }, []);

  function submitFilters(event) {
    event.preventDefault();
    setSelectedDate(null);
    setFiltersBeforeDate(null);
    loadResults(0, filters);
  }

  function selectCalendarDate(date) {
    if (calendarDrag.current.moved) {
      calendarDrag.current.moved = false;
      return;
    }
    if (selectedDate === date) {
      const previousFilters = filtersBeforeDate || { ...filters, startDate: getLastSixtyDays().startDate, endDate: getLastSixtyDays().endDate };
      setSelectedDate(null);
      setFiltersBeforeDate(null);
      setFilters(previousFilters);
      loadResults(0, previousFilters);
      return;
    }
    if (!selectedDate) setFiltersBeforeDate(filters);
    setSelectedDate(date);
    const nextFilters = { ...filters, startDate: date, endDate: date };
    setFilters(nextFilters);
    loadResults(0, nextFilters);
  }

  function startCalendarDrag(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    calendarDrag.current = { active: true, moved: false, startX: event.clientX, scrollLeft: event.currentTarget.scrollLeft };
    setIsCalendarDragging(true);
  }

  function moveCalendarDrag(event) {
    if (!calendarDrag.current.active) return;
    const distance = event.clientX - calendarDrag.current.startX;
    if (Math.abs(distance) > 4) calendarDrag.current.moved = true;
    event.currentTarget.scrollLeft = calendarDrag.current.scrollLeft - distance;
  }

  function endCalendarDrag(event) {
    if (!calendarDrag.current.active) return;
    calendarDrag.current.active = false;
    setIsCalendarDragging(false);
  }

  function toggleRow(idLottery) {
    setExpandedId((currentId) => currentId === idLottery ? null : idLottery);
  }

  const filteredResults = selectedDate ? results.filter((item) => item.lotteryResultsDate === selectedDate) : results;
  const groupedResults = groupByDate(filteredResults);
  const calendarRange = getLastSixtyDays();
  const calendarDays = getCalendarDays(calendarRange.startDate, calendarRange.endDate);

  return (
    <section className={`${styles.page} ${embedded ? styles.embedded : ''}`}>
      <div className={styles.heading}><div><p className={styles.eyebrow}>Resultados oficiais</p><h1>Resultados</h1><p>Consulte o número principal e o Ranking de cada sorteio realizado.</p></div>{!embedded && <WidgetExportButton widgetName="Resultados" widgetPath="/widgets/resultados" description="Disponibilize os resultados dos sorteios dentro do sistema da sua empresa." />}</div>
      <form className={styles.filters} onSubmit={submitFilters}><div className={styles.filterControls}><label>Data inicial<input type="date" value={filters.startDate} max={filters.endDate} onChange={(event) => setFilters((current) => ({ ...current, startDate: event.target.value }))} required /></label><label>Data final<input type="date" value={filters.endDate} min={filters.startDate} max={today()} onChange={(event) => setFilters((current) => ({ ...current, endDate: event.target.value }))} required /></label><label className={styles.numberFilter}>Número sorteado<input type="text" inputMode="numeric" maxLength="6" placeholder="Digite o número" value={filters.winningNumber} onChange={(event) => setFilters((current) => ({ ...current, winningNumber: event.target.value.replace(/\D/g, '').slice(0, 6) }))} /></label><button className={styles.searchButton} type="submit"><Search size={17} />Consultar</button></div><div className={styles.calendarCard}><div className={styles.calendarHeader}><h2>Calendário de resultados (últimos 60 dias)</h2></div><div className={styles.calendarViewport}><div className={`${styles.calendarScroller} ${isCalendarDragging ? styles.calendarDragging : ''}`} onPointerDown={startCalendarDrag} onPointerMove={moveCalendarDrag} onPointerUp={endCalendarDrag} onPointerCancel={endCalendarDrag}>{calendarDays.map((date) => { const dateObject = new Date(`${date}T12:00:00`); const hasResult = resultDates.includes(date); const month = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(dateObject).replace('.', ''); return <button className={`${styles.calendarDay} ${hasResult ? styles.hasResult : ''} ${selectedDate === date ? styles.selectedDate : ''}`} key={date} type="button" disabled={!hasResult} aria-pressed={selectedDate === date} title={hasResult ? 'Há sorteio realizado neste dia' : 'Não há sorteio neste dia'} onClick={() => selectCalendarDate(date)}><small>{new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(dateObject).replace('.', '')}</small><strong>{dateObject.getDate()}</strong><span>{month}</span>{hasResult && <i />}</button>; })}</div></div></div></form>
      {status === 'loading' && <ResultsSkeleton />}
      {status === 'error' && <div className={styles.state}>{error}</div>}
      {status === 'ready' && <>
        <div className={styles.resultSummary}><strong>{results.length ? `${results.length} resultados nesta página` : 'Nenhum resultado encontrado'}</strong><span>Selecione uma linha para visualizar o Ranking</span></div>
        <div className={styles.results}>{groupedResults.map(([date, items]) => <section className={styles.dateGroup} key={date}><div className={styles.dateHeading}><span className={styles.dateIcon}>{new Date(`${date}T00:00:00`).getDate()}</span><div><h2>{formatDate(date)}</h2><small>{items.length} {items.length === 1 ? 'sorteio' : 'sorteios'}</small></div></div><div className={styles.tableCard}><table><thead><tr><th>Produto</th><th>Número sorteado principal</th><th>Extração</th><th>Entidade responsável</th><th><span className={styles.srOnly}>Expandir</span></th></tr></thead><tbody>{items.map((item) => <><tr className={`${styles.resultRow} ${expandedId === item.idLottery ? styles.rowExpanded : ''}`} key={item.idLottery} tabIndex="0" onClick={() => toggleRow(item.idLottery)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); toggleRow(item.idLottery); } }}><td><strong>{item.productShortName}</strong><small>ID {item.idLottery}</small></td><td><span className={styles.winningNumber}>{formatNumber(item.winningNumber)}</span></td><td>{item.numberExtractLottery}</td><td>{item.responsibleEntity}</td><td className={styles.expandIcon}>{expandedId === item.idLottery ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</td></tr>{expandedId === item.idLottery && <tr className={styles.detailRow} key={`${item.idLottery}-detail`}><td colSpan="5"><div className={styles.ranking}><div><p className={styles.rankingKicker}>Ranking</p><h3>Números sorteados</h3></div><div className={styles.rankingNumbers}>{item.winningNumberRankings?.map((number, index) => <span key={`${item.idLottery}-${number}-${index}`} className={formatNumber(number) === formatNumber(item.winningNumber) ? styles.mainRanking : ''}>{formatNumber(number)}</span>)}</div></div></td></tr>}</>)}</tbody></table></div></section>)}</div>
        {totalPages > 1 && <div className={styles.pagination}><span>Página {page + 1} de {totalPages}</span><div className={styles.paginationControls}><button type="button" disabled={page === 0 || status === 'loading'} onClick={() => loadResults(page - 1)}>Anterior</button>{Array.from({ length: totalPages }, (_, pageNumber) => <button className={pageNumber === page ? styles.currentPage : ''} type="button" key={pageNumber} aria-current={pageNumber === page ? 'page' : undefined} disabled={status === 'loading'} onClick={() => loadResults(pageNumber)}>{pageNumber + 1}</button>)}<button type="button" disabled={page + 1 >= totalPages || status === 'loading'} onClick={() => loadResults(page + 1)}>Próxima</button></div></div>}
      </>}
    </section>
  );
}
