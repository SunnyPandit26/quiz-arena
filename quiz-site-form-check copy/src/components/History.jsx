import React, { useEffect, useState } from 'react';

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

  if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>Loading history...</div>;

  // Show detailed view if a test is selected
  if (selectedTest) {
    return (
      <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ marginBottom: '20px' }}>
          <button 
            onClick={closeDetails}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginRight: '20px'
            }}
          >
            ← Back to History
          </button>
          <h2 style={{ display: 'inline-block', margin: 0 }}>
            {selectedTest.subject} Level {selectedTest.level} - Detailed Results
          </h2>
        </div>

        {/* Test Summary */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3>Test Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div>
              <strong>Score:</strong> {selectedTest.totalScore}/{selectedTest.totalQuestions}
            </div>
            <div>
              <strong>Percentage:</strong> {selectedTest.percentage}%
            </div>
            <div>
              <strong>Status:</strong> 
              <span style={{
                color: selectedTest.percentage >= 70 ? '#4CAF50' : '#f44336',
                fontWeight: 'bold',
                marginLeft: '5px'
              }}>
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
              <div style={{ textAlign: 'center', padding: '50px' }}>
                Loading detailed results and generating graph...
              </div>
            )}
            
            {testDetails.error && (
              <div style={{
                background: '#f8d7da',
                color: '#721c24',
                padding: '15px',
                borderRadius: '5px',
                textAlign: 'center'
              }}>
                {testDetails.error}
              </div>
            )}
            
            {testDetails.questions && (
              <div>
                {/* Individual Test Graph - FIXED */}
                {/* Individual Test Graph - ENHANCED ERROR HANDLING */}
{testDetails.plotPath && (
  <div style={{
    background: 'white',
    padding: '20px',
    borderRadius: '10px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    textAlign: 'center'
  }}>
    <h3>Performance Analysis for This Test</h3>
    <img 
      src={`http://localhost:3000/quiz_results/${testDetails.plotPath}`} 
      alt="Individual Test Results Graph" 
      style={{
        maxWidth: '100%',
        height: 'auto',
        border: '2px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}
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
    <div style={{
      display: 'none',
      color: '#f44336',
      background: '#ffeaea',
      padding: '15px',
      borderRadius: '5px',
      marginTop: '10px'
    }}>
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
                  <div style={{
                    background: '#fff3cd',
                    color: '#856404',
                    padding: '15px',
                    borderRadius: '5px',
                    marginBottom: '20px',
                    textAlign: 'center'
                  }}>
                    📊 Graph generation failed for this test. Detailed breakdown available below.
                  </div>
                )}

                <h3>Question-wise Breakdown</h3>
                {testDetails.questions.map((q, index) => (
                  <div key={index} style={{
                    background: 'white',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '15px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    borderLeft: `4px solid ${q.isCorrect ? '#4CAF50' : '#f44336'}`
                  }}>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Question {q.questionNumber}:</strong> {q.question}
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <strong>Your Answer:</strong> 
                      <span style={{
                        color: q.isCorrect ? '#4CAF50' : '#f44336',
                        fontWeight: 'bold',
                        marginLeft: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: q.isCorrect ? '#e8f5e8' : '#ffeaea'
                      }}>
                        {q.userAnswer || 'Not Answered'}
                      </span>
                    </div>
                    <div>
                      <strong>Correct Answer:</strong> 
                      <span style={{
                        color: '#4CAF50',
                        fontWeight: 'bold',
                        marginLeft: '10px',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#e8f5e8'
                      }}>
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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Quiz History</h2>
      {history.length === 0 ? (
        <p style={{ textAlign: 'center' }}>No quiz attempts yet.</p>
      ) : (
        <div style={{ 
            display: 'flex',
            flexDirection: 'column',
          gap: '20px' 
        }}>
          {history.map((attempt, index) => (
            <div key={index} style={{
              width: '65vw',
              background: 'white',
              borderRadius: '10px',
              padding: '20px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              border: '1px solid #e0e0e0'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>
                {attempt.subject} - Level {attempt.level}
              </h3>
              
              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Score:</strong> {attempt.totalScore}/{attempt.totalQuestions} ({attempt.percentage}%)
                </p>
                <p style={{ margin: '5px 0' }}>
                  <strong>Date:</strong> {new Date(attempt.timestamp).toLocaleString()}
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  backgroundColor: attempt.percentage >= 70 ? '#d4edda' : '#f8d7da',
                  color: attempt.percentage >= 70 ? '#155724' : '#721c24'
                }}>
                  {attempt.percentage >= 70 ? 'Passed' : 'Failed'}
                </div>

                <button
                  onClick={() => fetchTestDetails(attempt)}
                  style={{
                    padding: '10px 16px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#0056b3'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#007bff'}
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
