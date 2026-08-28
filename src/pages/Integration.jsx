import { useState } from 'react';
import styles from './Integration.module.css';

function getInitialForm() {
  return {
    name: '',
    clientId: '',
    clientSecret: '',
    origins: '',
    tokenLifetime: '5',
    scopes: 'widgets:sorteios:read',
  };
}

export default function Integration() {
  const [form, setForm] = useState(getInitialForm);
  const [saved, setSaved] = useState(false);
  const cnpj = sessionStorage.getItem('@Mag:cnpj') || '';
  const modality = sessionStorage.getItem('@Mag:modality') || '';

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setSaved(false);
  }

  function saveConfiguration(event) {
    event.preventDefault();
    // The client secret must be sent to a backend endpoint, never persisted in the browser.
    const { clientSecret, ...safeConfiguration } = form;
    sessionStorage.setItem('@Mag:integrationConfig', JSON.stringify({ ...safeConfiguration, cnpj, modality }));
    setSaved(true);
  }

  return (
    <section className={styles.page}>
      <div className={styles.heading}><div><p className={styles.eyebrow}>Conecte o seu sistema</p><h1>Integração</h1><p>Configure os dados necessários para disponibilizar os widgets MAG no sistema do parceiro.</p></div></div>
      <div className={styles.layout}>
        <form className={styles.form} onSubmit={saveConfiguration}>
          <div className={styles.formSection}><div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>01</p><h2>Identificação</h2></div><span className={styles.locked}>Vinculado à sessão</span></div><div className={styles.fields}><label>Nome da integração<input name="name" value={form.name} onChange={updateField} placeholder="Ex.: Portal de vendas" required /></label><label>CNPJ do parceiro<input value={cnpj} readOnly /></label><label>Modalidade<input value={modality} readOnly /></label><label>Widget inicial<select value="sorteios" disabled><option value="sorteios">Sorteios</option></select></label></div></div>
          <div className={styles.formSection}><div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>02</p><h2>Credenciais do servidor</h2></div></div><p className={styles.helper}>Essas credenciais devem ser utilizadas somente no backend do sistema parceiro.</p><div className={styles.fields}><label>Client ID<input name="clientId" value={form.clientId} onChange={updateField} placeholder="Informe o client ID" required /></label><label>Client Secret<input name="clientSecret" type="password" value={form.clientSecret} onChange={updateField} placeholder="Informe o client secret" autoComplete="new-password" required /></label></div><div className={styles.warning}>Nunca inclua o `client_secret` no HTML, JavaScript do navegador ou código do iframe.</div></div>
          <div className={styles.formSection}><div className={styles.sectionHeading}><div><p className={styles.sectionKicker}>03</p><h2>Segurança do widget</h2></div></div><div className={styles.fields}><label className={styles.full}>Origens autorizadas<small>Informe um domínio por linha, incluindo o protocolo HTTPS.</small><textarea name="origins" value={form.origins} onChange={updateField} placeholder={'https://www.parceiro.com.br\nhttps://app.parceiro.com.br'} rows="3" required /></label><label>Validade do token<select name="tokenLifetime" value={form.tokenLifetime} onChange={updateField}><option value="5">5 minutos</option><option value="10">10 minutos</option><option value="15">15 minutos</option></select></label><label>Escopos autorizados<input name="scopes" value={form.scopes} onChange={updateField} required /></label></div></div>
          <div className={styles.actions}><button className={styles.submit} type="submit">Salvar configuração</button>{saved && <span className={styles.success}>Configuração salva. O segredo não foi armazenado.</span>}</div>
        </form>
        <aside className={styles.securityCard}><span className={styles.shield}>✓</span><h2>Integração segura</h2><p>O sistema do parceiro deve gerar tokens no servidor e entregá-los ao widget por um canal seguro.</p><ul><li>Token com validade curta</li><li>Escopo limitado ao widget</li><li>Vinculado ao CNPJ e à modalidade</li><li>Origem validada pela MAG</li></ul><a href="/widgets/sorteios">Visualizar widget de sorteios</a></aside>
      </div>
    </section>
  );
}
