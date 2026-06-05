'use client';

import React from 'react';
import styles from './ProfileManager.module.scss';

export default function ProfileManager() {
  const mockProfiles = [
    { id: '1', name: 'Основной профиль', count: 12 },
    { id: '2', name: 'IT Терминология', count: 45 },
  ];
  const activeId = '1';

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Управление профилями обучения</h2>
      
      <div className={styles.grid}>
        {mockProfiles.map((prof) => (
          <div 
            key={prof.id} 
            className={`${styles.profileCard} ${prof.id === activeId ? styles.active : ''}`}
          >
            <div>
              <div className={styles.profileName}>👤 {prof.name}</div>
              <div className={styles.profileMeta}>Слов в профиле: {prof.count}</div>
            </div>
            {prof.id === activeId && <span className={styles.activeIndicator}>● Активен</span>}
          </div>
        ))}

        <button className={styles.createCard}>
          <span>+</span> Создать новый профиль
        </button>
      </div>
    </div>
  );
}