import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import styles from './PortalLayout.module.css';

const menuItems = [
  { label: 'Início', to: '/inicio' },
  {
    label: 'Arquivos',
    children: [
      { label: 'Série Fechada', to: '/arquivo/serie-fechada' },
      { label: 'Série Aberta', to: '/arquivo/serie-aberta' },
    ],
  },
  { label: 'Faturamento', to: '/faturamento' },
  { label: 'Sorteio', to: '/sorteio' },
  { label: 'Resultados', to: '/resultados' },
  { label: 'Resgate', to: '/resgate' },
  { label: 'Integração', to: '/integracao' },
];

const traditionalMenuItems = [
  { label: 'Inicial', to: '/inicio' },
  { label: 'Sorteio', to: '/sorteio' },
  { label: 'Resultados', to: '/resultados' },
  { label: 'Proposta', to: '/proposta' },
  { label: 'Integração', to: '/integracao' },
];

const notifications = [
  {
    id: 1,
    title: 'Nova atualização disponível',
    date: 'Hoje, 10:30',
    detail: 'Uma nova atualização do Portal do Parceiro está disponível. Consulte as novidades e continue acompanhando suas operações.',
  },
  {
    id: 2,
    title: 'Faturamento disponível',
    date: 'Ontem, 15:45',
    detail: 'O faturamento do período atual foi disponibilizado para consulta na área de Faturamento.',
  },
  {
    id: 3,
    title: 'Atenção ao calendário de sorteios',
    date: '12/08/2026',
    detail: 'Confira o calendário atualizado dos próximos sorteios para manter seu acompanhamento em dia.',
  },
];

export default function PortalLayout() {
  const navigate = useNavigate();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const profileAreaRef = useRef(null);
  const profile = sessionStorage.getItem('@Mag:accessProfile') || 'tradicional';
  const modality = sessionStorage.getItem('@Mag:modality');
  const cnpj = sessionStorage.getItem('@Mag:cnpj') || 'Não informado';
  const partnerName = sessionStorage.getItem('@Mag:partnerName') || 'Parceiro MAG';
  const partnerLogo = sessionStorage.getItem('@Mag:partnerLogo') || '/images/logo-default.svg';
  const userName = sessionStorage.getItem('@Mag:userName') || 'Usuário do parceiro';
  const profileLabel = profile === 'incentivo' ? 'Incentivo' : 'Tradicional';
  const visibleMenuItems = modality === 'traditional' ? traditionalMenuItems : menuItems;

  useEffect(() => {
    function closeProfileOnOutsideClick(event) {
      if (!profileAreaRef.current?.contains(event.target)) setIsProfileOpen(false);
    }

    document.addEventListener('mousedown', closeProfileOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeProfileOnOutsideClick);
  }, []);

  function formatCnpj(value) {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3').replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
  }

  return (
    <div className={styles.appShell}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <NavLink className={styles.brand} to="/inicio" aria-label="Ir para o início">
            <img src="/images/logo-white.svg" alt="MAG Capitalização" />
          </NavLink>
          <div className={styles.headerInfo}>
            <span className={styles.partnerName}>Portal do Parceiro</span>
            <span className={styles.profileBadge}>{profileLabel}</span>
          </div>
          <div className={styles.notificationArea}>
            <button
              className={styles.notificationButton}
              type="button"
              aria-label="Abrir notificações"
              aria-expanded={isNotificationOpen}
              data-tooltip="Notificações"
              onClick={() => setIsNotificationOpen((isOpen) => !isOpen)}
            >
              <span className={styles.bellIcon} aria-hidden="true">&#128276;</span>
              <span className={styles.notificationCount}>{notifications.length}</span>
            </button>
            {isNotificationOpen && (
              <section className={styles.notificationPanel} aria-label="Notificações">
                <div className={styles.notificationHeading}>
                  <strong>Notificações</strong>
                  <span>{notifications.length} novas</span>
                </div>
                <div className={styles.notificationList}>
                  {notifications.map((notification) => (
                    <button
                      className={styles.notificationItem}
                      type="button"
                      key={notification.id}
                      onClick={() => {
                        setSelectedNotification(notification);
                        setIsNotificationOpen(false);
                      }}
                    >
                      <span className={styles.notificationDot} />
                      <span className={styles.notificationText}>
                        <strong>{notification.title}</strong>
                        <small>{notification.date}</small>
                      </span>
                      <span className={styles.notificationArrow} aria-hidden="true">›</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
          <div className={styles.profileArea} ref={profileAreaRef}>
            <button
              className={styles.profileButton}
              type="button"
              aria-label="Abrir perfil do usuário"
              aria-expanded={isProfileOpen}
              data-tooltip="Perfil"
              onClick={() => setIsProfileOpen((isOpen) => !isOpen)}
            >
              <span className={styles.userIcon} aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.6 3.1-5.5 7-5.5s6.3 1.9 7 5.5" /></svg></span>
            </button>
            <section className={`${styles.profilePanel} ${isProfileOpen ? styles.profilePanelOpen : ''}`} aria-label="Perfil do usuário">
              <div className={styles.profileHeading}><div><strong>{userName}</strong><small>{profileLabel}</small></div><span className={styles.profileAvatar}><img src={partnerLogo} alt="Logo do parceiro" /></span></div>
              <div className={styles.partnerDetails}><div><span>Parceiro</span><strong>{partnerName}</strong></div><div><span>CNPJ</span><strong>{formatCnpj(cnpj)}</strong></div></div>
              <button className={styles.profileMenuItem} type="button" onClick={() => navigate('/perfil-usuario')}>Perfil</button>
              <button className={styles.profileChangeMode} type="button" onClick={() => { sessionStorage.removeItem('@Mag:accessProfile'); sessionStorage.removeItem('@Mag:modality'); navigate('/perfil'); }}>Trocar modalidade</button>
              <button className={styles.profileLogout} type="button" onClick={() => { sessionStorage.clear(); navigate('/'); }}>Sair</button>
            </section>
          </div>
          <button className={styles.menuToggle} type="button" aria-label={isMenuOpen ? 'Fechar menu principal' : 'Abrir menu principal'} aria-expanded={isMenuOpen} onClick={() => setIsMenuOpen((isOpen) => !isOpen)}>
            <span /><span /><span />
          </button>
        </div>
      </header>
      <nav className={`${styles.navigation} ${isMenuOpen ? styles.navigationOpen : ''}`} aria-label="Menu principal">
        <div className={styles.navigationContent}>
          {visibleMenuItems.map((item) => (
            item.children ? (
              <div className={styles.group} key={item.label}>
                <span className={styles.groupLabel} tabIndex="0" role="button" aria-haspopup="true">{item.label}</span>
                <div className={styles.submenu}>
                  {item.children.map((child) => <NavLink className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} to={child.to} key={child.to} onClick={() => setIsMenuOpen(false)}>{child.label}</NavLink>)}
                </div>
              </div>
            ) : (
              <div className={styles.menuEntry} key={item.to}>
                <NavLink className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`} to={item.to} end={item.to === '/inicio'} onClick={() => setIsMenuOpen(false)}>{item.label}</NavLink>
              </div>
            )
          ))}
        </div>
      </nav>
      <div className={styles.body}>
        <main className={styles.main}><Outlet /></main>
      </div>
      {selectedNotification && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setSelectedNotification(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="notification-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className={styles.modalClose} type="button" aria-label="Fechar detalhe" onClick={() => setSelectedNotification(null)}>×</button>
            <p className={styles.modalEyebrow}>Notificação</p>
            <h2 id="notification-title">{selectedNotification.title}</h2>
            <p className={styles.modalDate}>{selectedNotification.date}</p>
            <p className={styles.modalDetail}>{selectedNotification.detail}</p>
            <button className={styles.modalAction} type="button" onClick={() => setSelectedNotification(null)}>Entendi</button>
          </section>
        </div>
      )}
    </div>
  );
}
