import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import styles from './quiz.module.css';

export default function Quiz() {
  const { subject } = useParams();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const level = useMemo(() => Number(search.get('level') || 1), [search]);

  const [questions, setQuestions] = useState([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [passed, setPassed] = useState(false);
  
  // New state for results
  const [quizResults, setQuizResults] = useState(null);

  const PASS_THRESHOLD = 0.7;

  useEffect(() => {
    setQuestions([]);
    setCurrent(0);
    setAnswers({});
    setSubmitted(false);
    setScore(0);
    setStarted(false);
    setLoading(true);
    setUnlocking(false);
    setPassed(false);
    setQuizResults(null);
  }, [subject, level]);

  useEffect(() => {
    const url = `http://localhost:3000/quiz?subject=${encodeURIComponent(subject)}&level=${encodeURIComponent(level)}`;
    fetch(url, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setQuestions(Array.isArray(data) ? data : data.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, [subject, level, location.key]);

  const handleAnswer = (opt) => setAnswers(prev => ({ ...prev, [current]: opt }));
  const nextQuestion = () => current < questions.length - 1 && setCurrent(c => c + 1);
  const prevQuestion = () => current > 0 && setCurrent(c => c - 1);

  const submitQuiz = async () => {
    let correct = 0;
    questions.forEach((q, idx) => { if (answers[idx] === q.correct) correct++; });

    const total = questions.length || 1;
    const ratio = correct / total;
    const didPass = ratio >= PASS_THRESHOLD;

    setScore(correct);
    setPassed(didPass);
    setSubmitted(true);

    console.log('Quiz passed:', didPass);
    console.log('Current level:', level);
    console.log('Should unlock level:', level + 1);

    // ALWAYS SUBMIT FOR CSV AND GRAPH - NO CONDITION CHECK
    setTimeout(() => {
      fetch('http://localhost:3000/submit-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          subject,
          level,
          answers,
          questions,
          score: correct,
          totalQuestions: total
        })
      }).then(response => response.json())
        .then(result => {
          if (result.success) {
            console.log('✅ Quiz submitted, graph data:', result);
            setQuizResults(result);
          }
        })
        .catch(error => console.log('❌ CSV submission failed:', error));
    }, 100);

    // ORIGINAL PROGRESS LOGIC - ONLY FOR UNLOCKING LEVELS
    if (didPass) {
      try {
        setUnlocking(true);
        const progressResponse = await fetch('http://localhost:3000/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ subject, highestUnlocked: level + 1 })
        });
        const progressResult = await progressResponse.json();
        console.log('Progress update result:', progressResult);
      } catch (error) {
        console.error('Progress update failed:', error);
      } finally {
        setUnlocking(false);
      }
    }
  };

  const goNextLevel = () => {
    const nextLevel = Number(level) + 1;
    const nextUrl = `/quiz/${encodeURIComponent(subject)}?level=${nextLevel}`;
    navigate(nextUrl, { replace: false, state: { ts: Date.now() } });
  };

  if (loading) return <h2 className={styles.loading}>Loading…</h2>;

  if (!started) {
    return (
      <div className={styles.quizWrapper}>
        <div className={`${styles.quizCard} ${styles.startScreen}`}>
          <h1>Subject: {subject}</h1>
          <p>Level: {level}</p>
          <button onClick={() => setStarted(true)} className={styles.startBtn}>
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    const total = questions.length;
    const ratio = total ? score / total : 0;

    return (
      <div className={styles.quizWrapper}>
        <div className={`${styles.quizCard} ${styles.resultBox}`}>
          <h2>Quiz Finished!</h2>
          <p>Score: {score} / {total} ({Math.round(ratio * 100)}%)</p>
          <p className={`${styles.resultStatus} ${passed ? styles.pass : styles.fail}`}>
            Status: {passed ? 'Passed ✅ (Next level unlocked)' : 'Failed ❌ (Try Again)'}
          </p>

          {/* ALWAYS SHOW GRAPH - NO CONDITION */}
          {quizResults && quizResults.plotPath && (
            <div className={styles.graphSection}>
              <h3>Your Performance Analysis:</h3>
              <img 
                src={`http://localhost:3000/quiz_results/${quizResults.plotPath}`} 
                alt="Quiz Results Graph" 
                className={styles.resultGraph}
                onLoad={() => console.log('✅ Graph loaded successfully')}
                onError={(e) => {
                  console.error('❌ Graph failed to load:', e);
                  console.error('Image URL:', e.target.src);
                }}
              />
            </div>
          )}

          {/* Show loading message while graph is being generated */}
          {!quizResults && (
            <div className={styles.graphSection}>
              <h3>Generating your performance graph...</h3>
              <p>Please wait...</p>
            </div>
          )}

          {/* Question-wise breakdown - ALWAYS SHOW */}
          <div className={styles.breakdown}>
            <h4>Question Breakdown:</h4>
            <div className={styles.questionList}>
              {questions.map((q, idx) => (
                <div key={idx} className={styles.questionResult}>
                  <p><strong>Q{idx + 1}:</strong> {q.question}</p>
                  <p>Your Answer: <span className={answers[idx] === q.correct ? styles.correct : styles.incorrect}>
                    {answers[idx] || 'Not Answered'}
                  </span></p>
                  <p>Correct Answer: <span className={styles.correct}>{q.correct}</span></p>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.resultActions}>
            <button
              onClick={() => navigate(`/start/${encodeURIComponent(subject)}`, { state: { refresh: true } })}
              className={styles.resultBtn}
            >
              Back to Levels
            </button>
            
            {/* Show different buttons based on pass/fail */}
            {passed ? (
              <button disabled={unlocking} onClick={goNextLevel} className={styles.resultBtn}>
                {unlocking ? 'Unlocking…' : `Go to Level ${Number(level) + 1}`}
              </button>
            ) : (
              <button onClick={() => window.location.reload()} className={styles.resultBtn}>
                Try Again
              </button>
            )}
            
            <button 
              onClick={() => navigate('/history')} 
              className={styles.resultBtn}
            >
              View All History
            </button>
          </div>
        </div>
      </div>
    );
  }

  const q = questions[current] || { question: '', options: [] };

  return (
    <div className={styles.quizWrapper}>
      <div className={styles.quizCard}>
        <div className={styles.questionBox}>
          <h2>Question {current + 1} of {questions.length}</h2>
          <p>{q.question}</p>
        </div>
        <div>
          {q.options.map((opt, i) => (
            <button
              key={i}
              onClick={() => handleAnswer(opt)}
              className={`${styles.optionBtn} ${answers[current] === opt ? styles.optionSelected : ''}`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className={styles.actions}>
          {current > 0 && (
            <button onClick={prevQuestion} className={styles.navBtn}>Previous</button>
          )}
          {current < questions.length - 1 && (
            <button onClick={nextQuestion} className={styles.navBtn}>Next</button>
          )}
          {current === questions.length - 1 && (
            <button 
              onClick={submitQuiz} 
              className={`${styles.navBtn} ${styles.submitBtn}`}
            >
              Submit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
