// Quiz.jsx - Updated with 70% unlock + Next Level button
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
  const [showReview, setShowReview] = useState(false);
  const [score, setScore] = useState(0);
  const [started, setStarted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passed, setPassed] = useState(false);
  const [unlocking, setUnlocking] = useState(false); // NEW: Loading state

  useEffect(() => {
    setQuestions([]);
    setCurrent(0);
    setAnswers({});
    setSubmitted(false);
    setShowReview(false);
    setStarted(false);
    setLoading(true);
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

  // UPDATED: submitQuiz with 70% unlock logic
  const submitQuiz = async () => {
    let correct = 0;
    questions.forEach((q, idx) => { if (answers[idx] === q.correct) correct++; });
    const total = questions.length || 1;
    const didPass = (correct / total) >= 0.7; // 70% PASS THRESHOLD

    setScore(correct);
    setPassed(didPass);
    setSubmitted(true);

    // UNLOCK NEXT LEVEL if passed (70%+)
    if (didPass) {
      setUnlocking(true);
      try {
        const response = await fetch('http://localhost:3000/progress', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            subject: subject,
            highestUnlocked: level + 1  // Unlock next level
          })
        });
        
        if (response.ok) {
          console.log('✅ Next level unlocked successfully!');
        }
      } catch (error) {
        console.error('❌ Unlock failed:', error);
      } finally {
        setUnlocking(false);
      }
    }
  };

  const goToReview = () => {
    setShowReview(true);
  };

  if (loading) return <div className={styles.quizWrapper}><h2 className={styles.loading}>Loading...</h2></div>;

  if (!started) {
    return (
      <div className={styles.quizWrapper}>
        <div className={`${styles.quizCard} ${styles.startScreen}`}>
          <h1>{subject.toUpperCase()}</h1>
          <p>Level: {level}</p>
          <button onClick={() => setStarted(true)} className={styles.startBtn}>Start Quiz</button>
        </div>
      </div>
    );
  }

  // RESULT SCREEN - 70% pass = Next Level button
  if (submitted && !showReview) {
    return (
      <div className={styles.quizWrapper}>
        <div className={`${styles.quizCard} ${styles.resultBox}`}>
          <h2>Quiz Finished!</h2>
          <p className={styles.scoreText}>Score: {score} / {questions.length}</p>
          <div className={`${styles.status} ${passed ? styles.pass : styles.fail}`}>
            {passed ? 'Passed ✅' : 'Failed ❌'}
          </div>
          
          {/* NEW: Next Level Button if Passed */}
          {passed && (
            <div className={styles.nextLevelSection}>
              <button 
                onClick={() => navigate(`/start/${subject}`)} 
                disabled={unlocking}
                className={styles.nextLevelBtn}
              >
                {unlocking ? 'Unlocking...' : `Go to Level ${level + 1} →`}
              </button>
            </div>
          )}
          
          <div className={styles.resultActions}>
            <button onClick={goToReview} className={styles.reviewBtn}>Review Answers</button>
            <button onClick={() => navigate(`/start/${subject}`)} className={styles.resultBtn}>Back</button>
            {!passed && <button onClick={() => window.location.reload()} className={styles.resultBtn}>Retry</button>}
          </div>
        </div>
      </div>
    );
  }

  // REVIEW SCREEN (same as before)
  if (submitted && showReview) {
    return (
      <div className={styles.quizWrapper}>
        <div className={styles.quizCard}>
          <div className={styles.reviewHeader}>
            <h2>📝 Review Your Answers</h2>
            <p>Score: {score}/{questions.length} • {passed ? 'Passed ✅' : 'Failed ❌'}</p>
          </div>

          <div className={styles.reviewQuestions}>
            {questions.map((q, qIndex) => {
              const userAnswer = answers[qIndex];
              const correctAnswer = q.correct;
              const isCorrect = userAnswer === correctAnswer;
              const answered = !!userAnswer;

              return (
                <div key={qIndex} className={`${styles.reviewQuestion} ${isCorrect ? styles.reviewCorrect : ''} ${!answered ? styles.reviewUnanswered : ''}`}>
                  <div className={styles.reviewQNumber}>
                    Q{qIndex + 1}
                    {answered && (
                      <span className={`${styles.reviewQStatus} ${isCorrect ? styles.correct : styles.wrong}`}>
                        {isCorrect ? '✅ Correct' : '❌ Wrong'}
                      </span>
                    )}
                    {!answered && <span className={styles.reviewQStatus}>⚪ Not Answered</span>}
                  </div>
                  
                  <div className={styles.reviewQText}>{q.question}</div>

                  <div className={styles.reviewOptions}>
                    {q.options.map((opt, optIndex) => {
                      const isUserAnswer = opt === userAnswer;
                      const isCorrectAnswer = opt === correctAnswer;
                      let status = '';

                      if (isCorrectAnswer) status = 'correct';
                      else if (isUserAnswer && !isCorrectAnswer) status = 'wrong';
                      else if (isUserAnswer) status = 'selected';

                      return (
                        <div key={optIndex} className={`${styles.reviewOption} ${styles[status]}`}>
                          <span>{opt}</span>
                          {isCorrectAnswer && <span className={styles.correctTag}>✅ Correct Answer</span>}
                          {isUserAnswer && !isCorrectAnswer && <span className={styles.yourTag}>👆 Your Answer</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.resultActions}>
            <button onClick={() => navigate(`/start/${subject}`)} className={styles.resultBtn}>Back to Start</button>
            <button onClick={() => window.location.reload()} className={styles.retryBtn}>Retry Quiz</button>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE QUIZ SCREEN (unchanged)
  const q = questions[current] || { question: '', options: [] };

  return (
    <div className={styles.quizWrapper}>
      <div className={styles.quizCard}>
        <div className={styles.questionBox}>
          <span className={styles.qHeader}>Question {current + 1} of {questions.length}</span>
          <p className={styles.questionText}>{q.question}</p>
        </div>

        <div className={styles.optionsList}>
          {q.options.map((opt, i) => (
            <label key={i} className={styles.optionLabel}>
              <input 
                type="radio" 
                name="quiz-option" 
                checked={answers[current] === opt} 
                onChange={() => handleAnswer(opt)} 
                className={styles.radioInput}
              />
              <span className={styles.optionText}>{opt}</span>
            </label>
          ))}
        </div>

        <div className={styles.actions}>
          <button disabled={current === 0} onClick={prevQuestion} className={styles.navBtn}>Previous</button>
          {current < questions.length - 1 ? (
            <button onClick={nextQuestion} className={styles.navBtn}>Next</button>
          ) : (
            <button onClick={submitQuiz} className={styles.submitBtn}>Submit</button>
          )}
        </div>
      </div>
    </div>
  );
}
