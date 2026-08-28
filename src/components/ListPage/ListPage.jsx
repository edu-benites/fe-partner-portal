import styles from './ListPage.module.css';

function getPageItems(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index);
  const pages = [0, totalPages - 1];
  for (let index = currentPage - 1; index <= currentPage + 1; index += 1) {
    if (index > 0 && index < totalPages - 1) pages.push(index);
  }
  const orderedPages = [...new Set(pages)].sort((first, second) => first - second);
  return orderedPages.flatMap((page, index) => index && page - orderedPages[index - 1] > 1 ? [`ellipsis-${page}`, page] : [page]);
}

export function ListPage({ eyebrow, title, description, actions, children, embedded = false }) {
  return <section className={`${styles.page} ${embedded ? styles.embedded : ''}`}><div className={styles.heading}><div><p className={styles.eyebrow}>{eyebrow}</p><h1>{title}</h1>{description && <p>{description}</p>}</div>{actions && <div className={styles.actions}>{actions}</div>}</div>{children}</section>;
}

export function ListToolbar({ children }) {
  return <div className={styles.toolbar}>{children}</div>;
}

export function ListCard({ title, eyebrow, count, children }) {
  return <div className={styles.card}><div className={styles.cardHeader}><div>{eyebrow && <p className={styles.cardEyebrow}>{eyebrow}</p>}<h2>{title}</h2></div>{count !== undefined && <span>{count}</span>}</div>{children}</div>;
}

export function StatusTabs({ items, value, onChange, label = 'Status' }) {
  return <div className={styles.tabs} role="tablist" aria-label={label}>{items.map((item) => <button key={item.value} id={`tab-${item.value}`} role="tab" type="button" className={value === item.value ? styles.tabActive : ''} aria-selected={value === item.value} tabIndex={value === item.value ? 0 : -1} onClick={() => onChange(item.value)}>{item.label}</button>)}</div>;
}

export function ListPagination({ page, totalPages, loading = false, onPageChange }) {
  const pages = Math.max(0, totalPages);
  return <div className={styles.pagination}><span>Página {pages ? page + 1 : 0} de {pages || 0}</span><div><button type="button" disabled={page === 0 || loading} onClick={() => onPageChange(page - 1)}>Anterior</button>{getPageItems(page, pages).map((pageItem) => typeof pageItem === 'string' ? <span className={styles.ellipsis} key={pageItem}>...</span> : <button key={pageItem} className={pageItem === page ? styles.currentPage : ''} type="button" aria-current={pageItem === page ? 'page' : undefined} disabled={loading} onClick={() => onPageChange(pageItem)}>{pageItem + 1}</button>)}<button type="button" disabled={!pages || page + 1 >= pages || loading} onClick={() => onPageChange(page + 1)}>Próxima</button></div></div>;
}
