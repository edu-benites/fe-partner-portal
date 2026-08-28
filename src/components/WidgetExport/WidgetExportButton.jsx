import { useState } from 'react';
import styles from './WidgetExportButton.module.css';

export default function WidgetExportButton({ widgetName, widgetPath, description = 'Disponibilize esta tela dentro do sistema da sua empresa.' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const widgetUrl = `${window.location.origin}${widgetPath}`;
  const embedCode = `<iframe\n  src="${widgetUrl}"\n  title="${widgetName}"\n  width="100%"\n  height="600"\n  frameborder="0"\n  style="border: 0; border-radius: 12px;"\n></iframe>`;

  async function copyCode() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2200);
  }

  return (
    <>
      <button className={styles.trigger} type="button" onClick={() => setIsOpen(true)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M8 8h8M8 12h5M8 16h3" /></svg>
        <span>Integrar tela</span>
      </button>
      {isOpen && <div className={styles.backdrop} role="presentation" onMouseDown={() => setIsOpen(false)}>
        <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="widget-title" onMouseDown={(event) => event.stopPropagation()}>
          <button className={styles.close} type="button" aria-label="Fechar integração" onClick={() => setIsOpen(false)}>×</button>
          <p className={styles.eyebrow}>Integração</p>
          <h2 id="widget-title">{widgetName} no seu sistema</h2>
          <p className={styles.description}>{description}</p>
          <ol className={styles.steps}>
            <li>Copie o código abaixo.</li>
            <li>Cole no local onde deseja exibir a tela.</li>
            <li>Ajuste a altura conforme o espaço disponível.</li>
          </ol>
          <div className={styles.codeHeader}><strong>Código de incorporação</strong><button type="button" onClick={copyCode}>{copied ? 'Copiado' : 'Copiar código'}</button></div>
          <pre className={styles.code}><code>{embedCode}</code></pre>
          <p className={styles.note}>A tela será carregada de forma segura dentro de um iframe e continuará recebendo atualizações do Portal do Parceiro.</p>
        </section>
      </div>}
    </>
  );
}
