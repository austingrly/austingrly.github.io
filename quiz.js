/* ============================================================
   quiz.js  —  HTTP Protocol Quiz Logic
   External JavaScript file for quiz.html
   ============================================================ */

// ---- Answer Key ----
// Each entry defines the correct answer(s) and display text for feedback.
const answerKey = {
  q1: {
    type: 'fill',
    // Accepted answers as lowercase strings for case-insensitive comparison
    correct: ['protocol'],
    displayAnswer: 'Protocol',
    questionText: 'HTTP stands for Hypertext Transfer ___________.',
    points: 1
  },
  q2: {
    type: 'radio',
    correct: '404',
    displayAnswer: '404 Not Found',
    questionText: 'Which HTTP status code indicates a resource was not found?',
    points: 1
  },
  q3: {
    type: 'radio',
    correct: 'http2',
    displayAnswer: 'HTTP/2',
    questionText: 'Which HTTP version introduced multiplexing?',
    points: 1
  },
  q4: {
    type: 'radio',
    correct: 'tls',
    displayAnswer: 'TLS (Transport Layer Security)',
    questionText: 'HTTPS adds security using which technology?',
    points: 1
  },
  q5: {
    type: 'checkbox',
    // All selections must match exactly — no extras, no missing
    correct: ['GET', 'POST', 'DELETE'],
    displayAnswer: 'GET, POST, and DELETE',
    questionText: 'Which of the following are valid HTTP request methods?',
    points: 2   // Worth 2 points since it requires selecting multiple correct answers
  }
};

// Total possible points
const TOTAL_POINTS = Object.values(answerKey).reduce((sum, q) => sum + q.points, 0);

// Passing threshold: 70%
const PASS_THRESHOLD = 0.70;

// ---- Collect User Answers from the Form ----
function collectAnswers() {
  const answers = {};

  // Q1: fill-in-the-blank text input
  const q1Input = document.getElementById('q1');
  answers.q1 = q1Input ? q1Input.value.trim() : '';

  // Q2, Q3, Q4: radio buttons (single selection)
  ['q2', 'q3', 'q4'].forEach(qName => {
    const selected = document.querySelector(`input[name="${qName}"]:checked`);
    answers[qName] = selected ? selected.value : null;
  });

  // Q5: checkboxes (multiple selections)
  const q5Checked = Array.from(document.querySelectorAll('input[name="q5"]:checked'));
  answers.q5 = q5Checked.map(cb => cb.value);

  return answers;
}

// ---- Grade a Single Answer ----
// Returns { earned, isCorrect, yourAnswerDisplay }
function gradeQuestion(qKey, userAnswer) {
  const key = answerKey[qKey];

  if (key.type === 'fill') {
    // Case-insensitive comparison against accepted answers array
    const normalized = userAnswer.toLowerCase();
    const isCorrect = key.correct.includes(normalized);
    return {
      earned: isCorrect ? key.points : 0,
      isCorrect,
      yourAnswerDisplay: userAnswer === '' ? '(no answer given)' : `"${userAnswer}"`
    };
  }

  if (key.type === 'radio') {
    const isCorrect = userAnswer === key.correct;
    // Find the label text for the selected radio button
    const labelEl = userAnswer
      ? document.querySelector(`input[name="${qKey}"][value="${userAnswer}"]`)?.parentElement
      : null;
    const labelText = labelEl ? labelEl.textContent.trim() : '(no answer selected)';
    return {
      earned: isCorrect ? key.points : 0,
      isCorrect,
      yourAnswerDisplay: labelText
    };
  }

  if (key.type === 'checkbox') {
    // Must match all correct answers exactly — no extras allowed
    const sortedUser    = [...userAnswer].sort().join(',');
    const sortedCorrect = [...key.correct].sort().join(',');
    const isCorrect = sortedUser === sortedCorrect;
    const displaySelected = userAnswer.length > 0
      ? userAnswer.join(', ')
      : '(nothing selected)';
    return {
      earned: isCorrect ? key.points : 0,
      isCorrect,
      yourAnswerDisplay: displaySelected
    };
  }

  return { earned: 0, isCorrect: false, yourAnswerDisplay: '(unknown)' };
}

// ---- Build and Display Results ----
function showResults(answers) {
  let totalEarned = 0;
  const resultCards = [];

  // Grade each question and accumulate score
  Object.keys(answerKey).forEach(qKey => {
    const result = gradeQuestion(qKey, answers[qKey]);
    totalEarned += result.earned;
    resultCards.push({ qKey, result, key: answerKey[qKey] });
  });

  const passed      = (totalEarned / TOTAL_POINTS) >= PASS_THRESHOLD;
  const percentage  = Math.round((totalEarned / TOTAL_POINTS) * 100);
  const passLabel   = passed ? 'PASS' : 'FAIL';
  const bannerClass = passed ? 'pass' : 'fail';

  // ---- Render Score Banner ----
  const bannerContainer = document.getElementById('score-banner-container');
  bannerContainer.innerHTML = `
    <div class="score-banner ${bannerClass}">
      <h2>${passLabel}</h2>
      <div class="score-number">${totalEarned} / ${TOTAL_POINTS} points</div>
      <p style="margin:0.4rem 0 0;">${percentage}% — Passing score is 70%</p>
    </div>
  `;

  // ---- Render Per-Question Breakdown ----
  const detailContainer = document.getElementById('results-detail');
  const cardsHTML = resultCards.map((item, idx) => {
    const { qKey, result, key } = item;
    const statusClass  = result.isCorrect ? 'correct' : 'incorrect';
    const statusLabel  = result.isCorrect ? '✓ Correct' : '✗ Incorrect';
    const pointsLabel  = `${result.earned}/${key.points} pt${key.points > 1 ? 's' : ''}`;

    return `
      <div class="result-item ${statusClass}">
        <span class="points-badge">${pointsLabel}</span>
        <span class="result-status">${statusLabel}</span>
        <p class="result-question">Q${idx + 1}: ${key.questionText}</p>
        <p class="result-your-answer">Your answer: <strong>${result.yourAnswerDisplay}</strong></p>
        ${!result.isCorrect
          ? `<p class="result-correct-answer">Correct answer: ${key.displayAnswer}</p>`
          : ''}
      </div>
    `;
  }).join('');

  detailContainer.innerHTML = cardsHTML;

  // ---- Show the results section ----
  const resultsSection = document.getElementById('results-section');
  resultsSection.style.display = 'block';

  // Scroll smoothly to results so the user can see their score
  resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ---- Validate: ensure every question has been answered ----
function validate(answers) {
  if (!answers.q1) return 'Please answer Question 1 (fill in the blank).';
  if (!answers.q2) return 'Please select an answer for Question 2.';
  if (!answers.q3) return 'Please select an answer for Question 3.';
  if (!answers.q4) return 'Please select an answer for Question 4.';
  if (answers.q5.length === 0) return 'Please select at least one answer for Question 5.';
  return null;
}

// ---- Submit Handler ----
document.getElementById('submit-btn').addEventListener('click', function () {
  const answers = collectAnswers();
  const error   = validate(answers);

  if (error) {
    alert(error);
    return;
  }

  // Hide the form and show results
  document.getElementById('quiz-form').style.display = 'none';
  showResults(answers);
});

// ---- Reset / Retake Handler ----
// Clears all inputs and hides the results section
document.getElementById('reset-btn').addEventListener('click', function () {
  // Reset all form inputs to their default state
  document.getElementById('quiz-form').reset();

  // Clear the dynamically inserted results HTML
  document.getElementById('score-banner-container').innerHTML = '';
  document.getElementById('results-detail').innerHTML = '';

  // Re-show the form and hide results
  document.getElementById('quiz-form').style.display = 'flex';
  document.getElementById('results-section').style.display = 'none';

  // Scroll back to the top of the quiz
  document.getElementById('quiz-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
