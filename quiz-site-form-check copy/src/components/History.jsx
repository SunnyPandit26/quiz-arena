import React, { useEffect, useState } from 'react';
import styles from './History.module.css';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/quiz-history', { credentials: 'include' })
      .then(r => r.json())
      .then(data => data.success && setHistory(data.history))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const closeDetails = () => {
    setSelectedTest(null);
  };

  if (loading) return <div className={styles.loading}>Loading history...</div>;

  // Detailed view
  if (selectedTest) {
    return (
      <div className={styles.container}>
        <div className={styles.backRow}>
          <button onClick={closeDetails} className={styles.backBtn}>
            ← Back to History
          </button>
          <h2 className={styles.detailHeading}>
            {selectedTest.subject} Level {selectedTest.level} - Results
          </h2>
        </div>

        <div className={styles.summaryCard}>
          <h3>Test Summary</h3>
          <div className={styles.summaryGrid}>
            <div><strong>Score:</strong> {selectedTest.totalScore}/{selectedTest.totalQuestions}</div>
            <div><strong>Percentage:</strong> {selectedTest.percentage}%</div>
            <div><strong>Status:</strong> 
              <span className={selectedTest.percentage >= 70 ? styles.pass : styles.fail}>
                {selectedTest.percentage >= 70 ? 'PASSED ✓' : 'FAILED ✗'}
              </span>
            </div>
            <div><strong>Date:</strong> {new Date(selectedTest.timestamp).toLocaleString()}</div>
          </div>
        </div>

        <div className={styles.noGraphNotice}>
          📊 Graphs disabled (Python backend removed). CSV data saved successfully.
        </div>
      </div>
    );
  }

  // Main history list
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Quiz History</h2>
      
      {history.length === 0 ? (
        <p className={styles.noData}>No quiz attempts yet. Start taking quizzes!</p>
      ) : (
        <div className={styles.historyList}>
          {history.map((attempt, index) => (
            <div key={index} className={styles.card}>
              <h3 className={styles.cardTitle}>
                {attempt.subject} - Level {attempt.level}
              </h3>
              
              <div className={styles.cardBody}>
                <p><strong>Score:</strong> {attempt.totalScore}/{attempt.totalQuestions} ({attempt.percentage}%)</p>
                <p><strong>Date:</strong> {new Date(attempt.timestamp).toLocaleString()}</p>
              </div>

              <div className={styles.cardFooter}>
                <div className={attempt.percentage >= 70 ? styles.passBadge : styles.failBadge}>
                  {attempt.percentage >= 70 ? 'Passed' : 'Failed'}
                </div>
                <button
                  onClick={() => setSelectedTest(attempt)}
                  className={styles.viewBtn}
                >
                  📊 View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
