'use client';

import React from 'react';
import styles from './DictionaryList.module.scss';

export default function DictionaryList() {
  const mockWords = [
    { id: '1', english: 'meticulous', russian: 'дотошный', context: 'Meticulous preparation', status: 'learning' },
    { id: '2', english: 'ubiquitous', russian: 'вездесущий', context: 'Ubiquitous computing systems', status: 'new' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Слово</th>
              <th className={styles.th}>Перевод</th>
              <th className={styles.th}>Статус</th>
              <th className={styles.th}></th>
            </tr>
          </thead>
          <tbody>
            {mockWords.map((row) => (
              <tr key={row.id} className={styles.tr}>
                <td className={styles.td}>
                  <div className={styles.wordMain}>{row.english}</div>
                  <div className={styles.wordContext}>{row.context}</div>
                </td>
                <td className={styles.td} style={{ color: 'var(--text-secondary)' }}>
                  {row.russian}
                </td>
                <td className={styles.td}>
                  <span className={`${styles.badge} ${row.status === 'new' ? styles.new : styles.learning}`}>
                    {row.status === 'new' ? 'Новое' : 'В изучении'}
                  </span>
                </td>
                <td className={styles.td} style={{ textAlign: 'right' }}>
                  <button className={styles.deleteBtn}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}