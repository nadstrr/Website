// Helper function to shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Helper function to shuffle question options and update correct index
function shuffleQuestionOptions(question) {
  const original_correct = question.correct;
  const correct_answer = question.options[original_correct];
  
  // Create array of indices and shuffle them
  const indices = question.options.map((_, i) => i);
  const shuffled_indices = shuffleArray(indices);
  
  // Shuffle the options array
  const shuffled_options = shuffleArray(question.options);
  
  // Find new index of correct answer
  const new_correct = shuffled_options.indexOf(correct_answer);
  
  return {
    question: question.question,
    options: shuffled_options,
    correct: new_correct
  };
}

const all_questions = [
  {
    question: "What is the hardest substance in the human body?",
    options: ["Bone", "Enamel", "Cartilage", "Teeth"],
    correct: 1
  },
  {
    question: "What is the common name of the object formerly known as a besom, associated with Halloween, and produced by brands like Treelen and Libman?",
    options: ["Broom", "Mop", "Brush", "Duster"],
    correct: 0
  },
  {
    question: "Which animal is known to \"laugh\" when tickled?",
    options: ["Dogs", "Rats", "Cats", "Monkeys"],
    correct: 1
  },
  {
    question: "True or False — A shrimp's heart is in its head.",
    options: ["True", "False"],
    correct: 0
  },
  {
    question: "What is the smallest country in the world?",
    options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"],
    correct: 1
  },
  {
    question: "What is the only U.S. state that does not have a rectangular flag?",
    options: ["Texas", "Ohio", "Wyoming", "Colorado"],
    correct: 1
  },
  {
    question: "What is the only U.S. state with a name that ends in three consecutive vowels?",
    options: ["Iowa", "Hawaii", "Idaho", "Utah"],
    correct: 1
  },
  {
    question: "What is the only U.S. state that borders just one other?",
    options: ["Alaska", "Maine", "Hawaii", "Rhode Island"],
    correct: 1
  },
  {
    question: "What is the oldest continuously inhabited city in the world?",
    options: ["Athens", "Jericho", "Damascus", "Rome"],
    correct: 1
  },
  {
    question: "What is the rarest blood type?",
    options: ["O-", "AB-", "B-", "A-"],
    correct: 1
  },
  {
    question: "What is the capital city of Paraguay?",
    options: ["Lima", "Asuncion", "Bogota", "Montevideo"],
    correct: 1
  },
  {
    question: "What is the world's most venomous fish?",
    options: ["Pufferfish", "Stonefish", "Lionfish", "Stingray"],
    correct: 1
  },
  {
    question: "What is the only U.S. state with a Spanish motto?",
    options: ["California", "Montana", "New Mexico", "Texas"],
    correct: 1
  }
];

// Remove duplicates and shuffle questions
const unique_questions = [];
const seen_questions = new Set();

for (const q of all_questions) {
  if (!seen_questions.has(q.question)) {
    seen_questions.add(q.question);
    unique_questions.push(q);
  }
}

// Shuffle the unique questions array
const shuffled_unique = shuffleArray(unique_questions);

// Shuffle options for each question and create final questions array
const questions = shuffled_unique.map(q => shuffleQuestionOptions(q));

let current_question_index = 0;
let selected_option = null;
let score = 0;
let total_questions = 15; // Will be limited to available questions in init
let answered_questions = 0;
let user_answers = [];
let correct_answers = [];

function init_quiz() {
  // Limit total_questions to available questions
  total_questions = Math.min(total_questions, questions.length);
  
  // Update the total questions display
  document.getElementById('total-questions').textContent = total_questions;
  
  // Create stations
  const stations_container = document.getElementById('stations');
  const track_container = document.getElementById('track-container');
  
  // Wait for layout to calculate positions
  setTimeout(() => {
    const track_width = track_container.offsetWidth;
    // Space stations evenly across the track, leaving margins
    // First station needs to be at least 75px to center the train (train is 150px wide, center at 75px)
    // Last station needs at least 75px from right edge so train doesn't get cut off
    // offsetWidth includes padding, so we need to account for it
    const container_padding = 30;
    const content_width = track_width - (container_padding * 2);
    const train_half_width = 75; // Half of train width (150px)
    const left_margin = train_half_width; // Ensure train is fully visible at start
    const right_margin = train_half_width; // Ensure train is fully visible at end
    // Available width for stations (content width minus margins for train visibility)
    const available_width = content_width - left_margin - right_margin;
    const station_spacing = available_width / (total_questions - 1);
    // Start position relative to track-container content area (after padding)
    const start_position = left_margin;
    
    for (let i = 0; i < total_questions; i++) {
      const station = document.createElement('div');
      station.className = 'station';
      station.dataset.station_index = i;
      
      // Always show numbers
      station.textContent = i + 1;
      
      if (i === 0) {
        station.classList.add('active');
      }
      
      // Mark unanswered stations
      if (i >= answered_questions) {
        station.classList.add('unanswered');
      }
      
      // Position stations evenly, centered at their left position (due to translateX(-50%))
      const station_position = start_position + i * station_spacing;
      station.style.left = `${station_position}px`;
      stations_container.appendChild(station);
    }
    
    // Set initial train position after stations are rendered
    setTimeout(() => {
      move_train_to_station(0);
      display_question(0);
    }, 50);
    
    // Add station click handlers
    document.querySelectorAll('.station').forEach((station, index) => {
      station.addEventListener('click', () => {
        if (index <= answered_questions) {
          current_question_index = index;
          move_train_to_station(index);
          display_question(index);
          update_station_states();
        }
      });
    });
  }, 100);
}

function move_train_to_station(station_index) {
  // Get the station element to find its position
  const stations = document.querySelectorAll('.station');
  if (stations.length === 0) return;
  
  const station = stations[station_index];
  if (!station) return;
  
  // Get the actual rendered center position of the station
  // Station uses translateX(-50%), so its left style value represents its center
  const station_rect = station.getBoundingClientRect();
  const track_container = document.getElementById('track-container');
  const container_rect = track_container.getBoundingClientRect();
  
  // Calculate station center relative to track container
  const station_center_x = station_rect.left - container_rect.left + (station_rect.width / 2);
  
  // Position train so its center aligns with station center
  // Train wrapper is 150px wide, so its center is at left + 75px
  const train_wrapper = document.getElementById('train-wrapper');
  const train_half_width = 75; // Half of train width (150px / 2)
  const train_position = station_center_x - train_half_width;
  train_wrapper.style.left = `${train_position}px`;
}

function update_station_states() {
  document.querySelectorAll('.station').forEach((station, index) => {
    station.classList.remove('active', 'visited', 'correct', 'incorrect', 'unanswered');
    
    // Always show numbers
    station.textContent = index + 1;
    
    if (index < answered_questions) {
      // Check if this question was answered correctly
      if (correct_answers[index]) {
        station.classList.add('correct');
      } else {
        station.classList.add('incorrect');
      }
    } else {
      station.classList.add('unanswered');
      if (index === current_question_index) {
        station.classList.add('active');
      }
    }
  });
}

function display_question(index) {
  if (index >= questions.length) {
    show_results();
    return;
  }
  
  const question_data = questions[index];
  const question_text = document.getElementById('question-text');
  const question_number = document.getElementById('question-number');
  const options_container = document.getElementById('options-container');
  const submit_btn = document.getElementById('submit-btn');
  const results_container = document.getElementById('results-container');
  
  results_container.style.display = 'none';
  document.getElementById('question-container').style.display = 'block';
  
  question_number.textContent = `Question ${index + 1}`;
  question_text.textContent = question_data.question;
  
  options_container.innerHTML = '';
  selected_option = null;
  
  const is_already_answered = answered_questions > index;
  
  question_data.options.forEach((option, option_index) => {
    const option_element = document.createElement('div');
    option_element.className = 'option';
    option_element.textContent = option;
    option_element.dataset.option_index = option_index;
    
    if (!is_already_answered) {
      option_element.addEventListener('click', () => {
        document.querySelectorAll('.option').forEach(opt => {
          opt.classList.remove('selected');
        });
        option_element.classList.add('selected');
        selected_option = option_index;
        submit_btn.style.display = 'block';
      });
    } else {
      option_element.style.pointerEvents = 'none';
    }
    
    options_container.appendChild(option_element);
  });
  
  submit_btn.style.display = 'none';
  submit_btn.onclick = () => submit_answer(index);
  
  // Check if already answered - show previous answer
  if (is_already_answered && user_answers[index] !== undefined) {
    const correct_option = options_container.children[question_data.correct];
    correct_option.classList.add('correct');
    if (user_answers[index] !== question_data.correct) {
      options_container.children[user_answers[index]].classList.add('incorrect');
    }
    submit_btn.style.display = 'none';
  }
}

function submit_answer(index) {
  if (selected_option === null) return;
  if (answered_questions > index) return; // Already answered
  
  const question_data = questions[index];
  const options_container = document.getElementById('options-container');
  const submit_btn = document.getElementById('submit-btn');
  
  // Disable further selection
  document.querySelectorAll('.option').forEach(opt => {
    opt.style.pointerEvents = 'none';
  });
  
  // Show correct/incorrect
  const correct_option = options_container.children[question_data.correct];
  correct_option.classList.add('correct');
  
  // Store user's answer
  user_answers[index] = selected_option;
  
  const is_correct = selected_option === question_data.correct;
  correct_answers[index] = is_correct;
  
  if (is_correct) {
    score++;
  } else {
    options_container.children[selected_option].classList.add('incorrect');
  }
  
  submit_btn.style.display = 'none';
  answered_questions++;
  
  // Update progress
  document.getElementById('current-question').textContent = answered_questions;
  update_station_states();
  
  // Move to next question after a delay
  setTimeout(() => {
    if (answered_questions < total_questions) {
      current_question_index = answered_questions;
      move_train_to_station(current_question_index);
      display_question(current_question_index);
      update_station_states();
    } else {
      show_results();
    }
  }, 500);
}

function show_results() {
  document.getElementById('question-container').style.display = 'none';
  const results_container = document.getElementById('results-container');
  const score_display = document.getElementById('score-display');
  
  results_container.style.display = 'block';
  score_display.textContent = `You got ${score} out of ${total_questions} questions correct!`;
  
  // Move train to final station
  move_train_to_station(total_questions - 1);
}

function restart_quiz() {
  current_question_index = 0;
  selected_option = null;
  score = 0;
  answered_questions = 0;
  user_answers = [];
  correct_answers = [];
  
  document.getElementById('current-question').textContent = '1';
  document.getElementById('stations').innerHTML = '';
  
  init_quiz();
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  // Show intro animation immediately
  const intro_animation = document.getElementById('intro-animation');
  const quiz_container = document.getElementById('quiz-container');
  const start_btn = document.getElementById('start-adventure-btn');
  const intro_train = document.getElementById('intro-train');
  
  start_btn.addEventListener('click', () => {
    // Make train leave to the right
    intro_train.classList.add('leaving');
    
    // Wait for animation to complete before hiding and showing quiz
    setTimeout(() => {
      intro_animation.classList.add('hidden');
      quiz_container.classList.add('visible');
      init_quiz();
    }, 2000); // Match animation duration
  });
  
  document.getElementById('restart-btn').addEventListener('click', restart_quiz);
});

