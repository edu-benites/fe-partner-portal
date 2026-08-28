import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Access.module.css';
import { getPartners } from '../services/partnerService.js';

function onlyDigits(value) {
  return value.replace(/\D/g, '').slice(0, 14);
}

function formatCnpj(value) {
  const digits = onlyDigits(value);
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function isValidCnpj(value) {
  const digits = onlyDigits(value);
  if (digits.length !== 14 || /^([0-9])\1+$/.test(digits)) return false;

  const calculateDigit = (length) => {
    const weights = length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((total, weight, index) => total + Number(digits[index]) * weight, 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  return calculateDigit(12) === Number(digits[12]) && calculateDigit(13) === Number(digits[13]);
}

export default function Access() {
  const navigate = useNavigate();
  const [cnpj, setCnpj] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValidCnpj(cnpj)) {
      setError('Digite um CNPJ válido para continuar.');
      return;
    }

    const normalizedCnpj = onlyDigits(cnpj);
    setIsLoading(true);
    setError('');

    try {
      const partnerData = await getPartners(normalizedCnpj);
      const partner = Array.isArray(partnerData) ? partnerData[0] : partnerData;
      sessionStorage.setItem('@Mag:cnpj', normalizedCnpj);
      sessionStorage.setItem('@Mag:partnerData', JSON.stringify(partner || {}));
      sessionStorage.setItem('@Mag:partnerLogo', partner?.logos?.positive || '/images/logo-default.svg');
      sessionStorage.setItem('@Mag:partnerName', partner?.legalName || partner?.name || 'Parceiro MAG');
      sessionStorage.setItem('@Mag:userName', partner?.userName || partner?.user?.name || partner?.legalName || partner?.name || 'Usuário do parceiro');
      navigate('/perfil');
    } catch (requestError) {
      console.error('Erro ao consultar o parceiro:', requestError);
      setError('Não foi possível localizar este parceiro. Confira o CNPJ e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className={styles.container}>
      <section className={styles.card} aria-labelledby="access-title">
        <img className={styles.logo} src="/images/logo-default.svg" alt="MAG Capitalização" />
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Portal do parceiro</p>
          <h1 id="access-title">Acesse sua conta</h1>
          <p className={styles.description}>Informe o CNPJ da sua empresa para entrar no portal.</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <label className={styles.field} htmlFor="cnpj">
            CNPJ
            <input
              id="cnpj"
              name="cnpj"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="00.000.000/0000-00"
              value={cnpj}
              maxLength={18}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'cnpj-error' : undefined}
              onChange={(event) => {
                setCnpj(formatCnpj(event.target.value));
                setError('');
              }}
            />
          </label>
          {error && <p id="cnpj-error" className={styles.error} role="alert">{error}</p>}
          <button className={styles.submit} type="submit" disabled={isLoading}>
            {isLoading ? 'Consultando...' : 'Acessar'}
          </button>
        </form>
        <p className={styles.footer}>Ambiente seguro MAG</p>
      </section>
    </main>
  );
}
