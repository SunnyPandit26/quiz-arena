import React, { useEffect, useState } from 'react';
import styles from './History.module.css';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testDetails, setTestDetails] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3000/quiz-history', { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setHistory(data.history);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const fetchTestDetails = async (test) => {
    try {
      setSelectedTest(test);
      setTestDetails({ loading: true });
      
      const response = await fetch(`http://localhost:3000/quiz-details?subject=${test.subject}&level=${test.level}&timestamp=${test.timestamp}`, 
        { credentials: 'include' });
      const data = await response.json();
      
      if (data.success) {
        setTestDetails(data.details);
      } else {
        setTestDetails({ error: 'Could not load test details' });
      }
    } catch (error) {
      setTestDetails({ error: 'Failed to fetch test details' });
    }
  };

  const closeDetails = () => {
    setSelectedTest(null);
    setTestDetails(null);
  };

  if (loading) return <div className={styles.loading}>Loading history...</div>;

  // Show detailed view if a test is selected
  if (selectedTest) {
    return (
      <div className={styles.container}>
        <div className={styles.backRow}>
          <button onClick={closeDetails} className={styles.backBtn}>
            ← Back to History
          </button>
          <h2 className={styles.detailHeading}>
            {selectedTest.subject} Level {selectedTest.level} - Detailed Results
          </h2>
        </div>

        {/* Test Summary */}
        <div className={styles.summaryCard}>
          <h3>Test Summary</h3>
          <div className={styles.summaryGrid}>
            <div>
              <strong>Score:</strong> {selectedTest.totalScore}/{selectedTest.totalQuestions}
            </div>
            <div>
              <strong>Percentage:</strong> {selectedTest.percentage}%
            </div>
            <div>
              <strong>Status:</strong> 
              <span className={selectedTest.percentage >= 70 ? styles.pass : styles.fail}>
                {selectedTest.percentage >= 70 ? 'PASSED ✓' : 'FAILED ✗'}
              </span>
            </div>
            <div>
              <strong>Date:</strong> {new Date(selectedTest.timestamp).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Test Details */}
        {testDetails && (
          <div>
            {testDetails.loading && (
              <div className={styles.loading}>
                Loading detailed results and generating graph...
              </div>
            )}
            
            {testDetails.error && (
              <div className={styles.error}>
                {testDetails.error}
              </div>
            )}
            
            {testDetails.questions && (
              <div>
                {/* Individual Test Graph */}
                {testDetails.plotPath && (
                  <div className={styles.graphCard}>
                    <h3>Performance Analysis for This Test</h3>
                    <img 
                      src={`http://localhost:3000/quiz_results/${testDetails.plotPath}`} 
                      alt="Individual Test Results Graph" 
                      className={styles.graph}
                      onLoad={() => {
                        console.log('✅ Individual test graph loaded successfully');
                        console.log('Image URL:', `http://localhost:3000/quiz_results/${testDetails.plotPath}`);
                      }}
                      onError={(e) => {
                        console.error('❌ Individual test graph failed to load');
                        console.error('Failed URL:', e.target.src);
                        console.error('Plot path:', testDetails.plotPath);
                        console.error('Test details debug:', testDetails.debugInfo);
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'block';
                      }}
                    />
                    <div className={styles.graphError}>
                      ❌ Graph failed to load. 
                      <br />
                      <small>Plot: {testDetails.plotPath}</small>
                      <br />
                      <small>URL: http://localhost:3000/quiz_results/{testDetails.plotPath}</small>
                      <br />
                      <details>
                        <summary>Debug Info</summary>
                        <pre>{JSON.stringify(testDetails.debugInfo, null, 2)}</pre>
                      </details>
                    </div>
                  </div>
                )}

                {/* Show message if no graph available */}
                {testDetails.questions && !testDetails.plotPath && (
                  <div className={styles.warning}>
                    📊 Graph generation failed for this test. Detailed breakdown available below.
                  </div>
                )}

                <h3>Question-wise Breakdown</h3>
                {testDetails.questions.map((q, index) => (
                  <div 
                    key={index} 
                    className={`${styles.questionBox} ${q.isCorrect ? styles.correct : styles.incorrect}`}
                  >
                    <div className={styles.questionText}>
                      <strong>Question {q.questionNumber}:</strong> {q.question}
                    </div>
                    <div className={styles.answerRow}>
                      <strong>Your Answer:</strong> 
                      <span className={q.isCorrect ? styles.answerCorrect : styles.answerWrong}>
                        {q.userAnswer || 'Not Answered'}
                      </span>
                    </div>
                    <div className={styles.answerRow}>
                      <strong>Correct Answer:</strong> 
                      <span className={styles.answerCorrect}>
                        {q.correctAnswer}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Main history list view
  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Quiz History</h2>
      {history.length === 0 ? (
        <p className={styles.noData}>No quiz attempts yet.</p>
      ) : (
        <div className={styles.historyList}>
          {history.map((attempt, index) => (
            <div key={index} className={styles.card}>
              <h3 className={styles.cardTitle}>
                {attempt.subject} - Level {attempt.level}
              </h3>
              
              <div className={styles.cardBody}>
                <p>
                  <strong>Score:</strong> {attempt.totalScore}/{attempt.totalQuestions} ({attempt.percentage}%)
                </p>
                <p>
                  <strong>Date:</strong> {new Date(attempt.timestamp).toLocaleString()}
                </p>
              </div>

              <div className={styles.cardFooter}>
                <div className={attempt.percentage >= 70 ? styles.passBadge : styles.failBadge}>
                  {attempt.percentage >= 70 ? 'Passed' : 'Failed'}
                </div>

                <button
                  onClick={() => fetchTestDetails(attempt)}
                  className={styles.viewBtn}
                >
                  📊 View Details & Graph
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
