import styles from './PartnerProfile.module.css';

function readPartnerData() {
  try {
    return JSON.parse(sessionStorage.getItem('@Mag:partnerData') || '{}');
  } catch {
    return {};
  }
}

function labelFor(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase());
}

function getPartnerFields(data) {
  return Object.entries(data).flatMap(([key, value]) => {
    if (['logos', 'settings'].includes(key) || value === null || value === undefined) return [];
    if (typeof value === 'object') {
      return Object.entries(value).map(([nestedKey, nestedValue]) => ({ label: `${labelFor(key)} ${labelFor(nestedKey)}`, value: String(nestedValue ?? '') }));
    }
    return [{ label: labelFor(key), value: String(value) }];
  });
}

export default function PartnerProfile() {
  const partner = readPartnerData();
  const userName = sessionStorage.getItem('@Mag:userName') || 'Usuário do parceiro';
  const cnpj = sessionStorage.getItem('@Mag:cnpj') || '';
  const modality = sessionStorage.getItem('@Mag:modality') || '';
  const fields = getPartnerFields(partner).filter(({ label }) => !['Legal Name', 'Name'].includes(label));

  return (
    <section className={styles.page}>
      <div className={styles.heading}><div><p className={styles.eyebrow}>Dados de acesso</p><h1>Perfil</h1><p>Confira os dados do usuário e do parceiro conectado.</p></div></div>
      <form className={styles.form}>
        <div className={styles.formSection}><h2>Usuário</h2><div className={styles.fields}><label>Nome<input value={userName} readOnly /></label><label>Modalidade<input value={modality} readOnly /></label></div></div>
        <div className={styles.formSection}><h2>Parceiro</h2><div className={styles.fields}><label>CNPJ<input value={cnpj} readOnly /></label>{fields.map(({ label, value }) => <label key={label}>{label}<input value={value} readOnly /></label>)}</div></div>
      </form>
    </section>
  );
}
