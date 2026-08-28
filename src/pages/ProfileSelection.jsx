import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ProfileSelection.module.css';

const profiles = [
  { id: 'incentivo', modality: 'incentive', title: 'Incentivo', description: 'O Portal de Serviços da MAG Capitalização reúne ferramentas para gerenciar promoções, permitindo consultar e enviar arquivos, acompanhar faturamento, monitorar sorteios, cadastrar beneficiários e visualizar resgates com valores e datas de pagamento.', icon: 'I' },
  { id: 'tradicional', modality: 'traditional', title: 'Tradicional', description: 'Uma plataforma completa que permite monitorar sorteios em andamento, concluídos e ainda não iniciados. Oferece um dashboard completo para gestão dos sorteios com relatórios exportáveis.', icon: 'T' },
];

export default function ProfileSelection() {
  const navigate = useNavigate();
  const [selectedProfile, setSelectedProfile] = useState('');
  const continueToPortal = () => {
    if (!selectedProfile) return;
    const profile = profiles.find(({ id }) => id === selectedProfile);
    sessionStorage.setItem('@Mag:accessProfile', selectedProfile);
    sessionStorage.setItem('@Mag:modality', profile.modality);
    navigate('/inicio');
  };

  return (
    <main className={styles.container}>
      <section className={styles.card} aria-labelledby="profile-title">
        <div className={styles.brandRow}>
          <img src="/images/logo-default.svg" alt="MAG Capitalização" />
        </div>
        <p className={styles.eyebrow}>Acesso identificado</p>
        <h1 id="profile-title">Como você deseja acessar?</h1>
        <p className={styles.description}>Selecione um perfil para continuar no Portal do Parceiro.</p>
        <div className={styles.options} role="radiogroup" aria-label="Perfil de acesso">
          {profiles.map((profile) => (
            <button
              className={`${styles.option} ${selectedProfile === profile.id ? styles.selected : ''}`}
              key={profile.id}
              type="button"
              role="radio"
              aria-checked={selectedProfile === profile.id}
              onClick={() => setSelectedProfile(profile.id)}
            >
              <span className={styles.icon}>{profile.icon}</span>
              <span className={styles.optionText}><strong>{profile.title}</strong><small>{profile.description}</small></span>
              <span className={styles.radio} aria-hidden="true" />
            </button>
          ))}
        </div>
        <button className={styles.submit} type="button" disabled={!selectedProfile} onClick={continueToPortal}>Selecionar modalidade</button>
      </section>
    </main>
  );
}
