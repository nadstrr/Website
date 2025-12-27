// Helper function to shuffle array (Fisher-Yates algorithm with enhanced randomness)
function shuffleArray(array) {
  const shuffled = [...array];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    // Use Math.random() which should be different each time
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
    question: "What is the name of the single-player sliding block puzzle game designed by Italian web developer Gabriele Cirulli in which a smartphone user tries to create a certain value by sliding and combining tiles around a grid?",
    options: ["2048", "Tetris", "Candy Crush", "Sudoku"],
    correct: 0
  },
  {
    question: "What is the smallest planet in our solar system?",
    options: ["Mercury", "Venus", "Mars", "Pluto"],
    correct: 0
  },
  {
    question: "What is the hardest natural substance on Earth?",
    options: ["Diamond", "Gold", "Iron", "Quartz"],
    correct: 0
  },
  {
    question: "What is the capital of Japan?",
    options: ["Tokyo", "Osaka", "Kyoto", "Seoul"],
    correct: 0
  },
  {
    question: "Which element has the chemical symbol 'O'?",
    options: ["Oxygen", "Osmium", "Oganesson", "Ozone"],
    correct: 0
  },
  {
    question: "How many continents are there on Earth?",
    options: ["Seven", "Five", "Six", "Eight"],
    correct: 0
  },
  {
    question: "Who wrote the play 'Romeo and Juliet'?",
    options: ["William Shakespeare", "Charles Dickens", "Jane Austen", "Mark Twain"],
    correct: 0
  },
  {
    question: "What is the largest mammal in the world?",
    options: ["Blue whale", "Elephant", "Giraffe", "Hippopotamus"],
    correct: 0
  },
  {
    question: "What is the official language of Brazil?",
    options: ["Portuguese", "Spanish", "French", "English"],
    correct: 0
  },
  {
    question: "Which planet is known as the Red Planet?",
    options: ["Mars", "Venus", "Jupiter", "Saturn"],
    correct: 0
  },
  {
    question: "What gas do plants absorb from the atmosphere?",
    options: ["Carbon dioxide", "Oxygen", "Nitrogen", "Hydrogen"],
    correct: 0
  },
  {
    question: "How many bones are in the human body?",
    options: ["206", "200", "210", "220"],
    correct: 0
  },
  {
    question: "What is the chemical symbol for water?",
    options: ["H₂O", "CO₂", "NaCl", "O₂"],
    correct: 0
  },
  {
    question: "What is the powerhouse of the cell?",
    options: ["Mitochondria", "Nucleus", "Ribosome", "Chloroplast"],
    correct: 0
  },
  {
    question: "What is the speed of light?",
    options: ["Approximately 300,000 kilometers per second", "Approximately 150,000 kilometers per second", "Approximately 450,000 kilometers per second", "Approximately 200,000 kilometers per second"],
    correct: 0
  },
  {
    question: "Which planet has the most moons?",
    options: ["Saturn", "Jupiter", "Neptune", "Uranus"],
    correct: 0
  },
  {
    question: "What is the process by which plants make their food?",
    options: ["Photosynthesis", "Respiration", "Digestion", "Fermentation"],
    correct: 0
  },
  {
    question: "What force keeps us grounded on Earth?",
    options: ["Gravity", "Magnetism", "Friction", "Inertia"],
    correct: 0
  },
  {
    question: "What is the most abundant gas in Earth's atmosphere?",
    options: ["Nitrogen", "Oxygen", "Carbon dioxide", "Argon"],
    correct: 0
  },
  {
    question: "What is the chemical symbol for gold?",
    options: ["Au", "Go", "Gd", "Ag"],
    correct: 0
  },
  {
    question: "How many elements are there in the periodic table?",
    options: ["118", "100", "120", "115"],
    correct: 0
  },
  {
    question: "What is the center of an atom called?",
    options: ["Nucleus", "Proton", "Electron", "Neutron"],
    correct: 0
  },
  {
    question: "Which scientist proposed the theory of relativity?",
    options: ["Albert Einstein", "Isaac Newton", "Stephen Hawking", "Galileo Galilei"],
    correct: 0
  },
  {
    question: "Who was the first President of the United States?",
    options: ["George Washington", "Thomas Jefferson", "John Adams", "Benjamin Franklin"],
    correct: 0
  },
  {
    question: "What year did World War II end?",
    options: ["1945", "1944", "1946", "1943"],
    correct: 0
  },
  {
    question: "Which ancient civilization built the pyramids?",
    options: ["Egyptians", "Greeks", "Romans", "Mayans"],
    correct: 0
  },
  {
    question: "Who was known as the 'Iron Lady'?",
    options: ["Margaret Thatcher", "Queen Elizabeth II", "Indira Gandhi", "Angela Merkel"],
    correct: 0
  },
  {
    question: "What was the name of the ship on which the Pilgrims traveled to America in 1620?",
    options: ["Mayflower", "Titanic", "Santa Maria", "Endeavour"],
    correct: 0
  },
  {
    question: "Who was the first man to walk on the moon?",
    options: ["Neil Armstrong", "Buzz Aldrin", "Yuri Gagarin", "John Glenn"],
    correct: 0
  },
  {
    question: "What wall divided East and West Berlin during the Cold War?",
    options: ["The Berlin Wall", "The Iron Curtain", "The Great Wall", "The Maginot Line"],
    correct: 0
  },
  {
    question: "Which war was fought between the North and South regions in the United States?",
    options: ["The Civil War", "World War I", "The Revolutionary War", "The War of 1812"],
    correct: 0
  },
  {
    question: "Who discovered America?",
    options: ["Christopher Columbus", "Amerigo Vespucci", "Ferdinand Magellan", "Vasco da Gama"],
    correct: 0
  },
  {
    question: "In what year did the Soviet Union collapse?",
    options: ["1991", "1989", "1990", "1992"],
    correct: 0
  },
  {
    question: "Who was the leader of the Soviet Union during World War II?",
    options: ["Joseph Stalin", "Vladimir Lenin", "Nikita Khrushchev", "Mikhail Gorbachev"],
    correct: 0
  },
  {
    question: "Which empire was ruled by Genghis Khan?",
    options: ["The Mongol Empire", "The Roman Empire", "The Ottoman Empire", "The British Empire"],
    correct: 0
  },
  {
    question: "What was the first successful English colony in America?",
    options: ["Jamestown", "Plymouth", "Roanoke", "Boston"],
    correct: 0
  },
  {
    question: "Who was the British Prime Minister during most of World War II?",
    options: ["Winston Churchill", "Neville Chamberlain", "Clement Attlee", "David Lloyd George"],
    correct: 0
  },
  {
    question: "What year did the Berlin Wall fall?",
    options: ["1989", "1988", "1990", "1991"],
    correct: 0
  },
  {
    question: "What is the longest river in the world?",
    options: ["The Nile River", "The Amazon River", "The Mississippi River", "The Yangtze River"],
    correct: 0
  },
  {
    question: "Which country has the largest population?",
    options: ["China", "India", "United States", "Indonesia"],
    correct: 0
  },
  {
    question: "What is the capital city of Australia?",
    options: ["Canberra", "Sydney", "Melbourne", "Brisbane"],
    correct: 0
  },
  {
    question: "Which desert is the largest in the world?",
    options: ["Sahara Desert", "Gobi Desert", "Arabian Desert", "Kalahari Desert"],
    correct: 0
  },
  {
    question: "Which country is the Eiffel Tower located in?",
    options: ["France", "Italy", "Spain", "Germany"],
    correct: 0
  },
  {
    question: "What is the smallest country in the world?",
    options: ["Vatican City", "Monaco", "San Marino", "Liechtenstein"],
    correct: 0
  },
  {
    question: "What is the name of the only mammal capable of true flight (not gliding)?",
    options: ["The bat", "The flying squirrel", "The sugar glider", "The colugo"],
    correct: 0
  },
  {
    question: "What is the name of the smallest species of penguin?",
    options: ["The little blue penguin", "The emperor penguin", "The king penguin", "The adelie penguin"],
    correct: 0
  },
  {
    question: "What is the name of the insect that holds the record for the fastest flying insect in the world?",
    options: ["The dragonfly", "The bee", "The butterfly", "The moth"],
    correct: 0
  },
  {
    question: "What is the name of the small, elusive mammal native to Australia that is capable of laying eggs?",
    options: ["The platypus", "The echidna", "The kangaroo", "The koala"],
    correct: 0
  },
  {
    question: "What is the name of the bird species known for its ability to mimic chainsaws and other mechanical sounds?",
    options: ["The lyrebird", "The parrot", "The mockingbird", "The raven"],
    correct: 0
  },
  {
    question: "What is the only species of bear found in the Southern Hemisphere?",
    options: ["The spectacled bear", "The polar bear", "The grizzly bear", "The black bear"],
    correct: 0
  },
  {
    question: "What is the name of the animal with the most complex eyesight in the animal kingdom?",
    options: ["The mantis shrimp", "The eagle", "The octopus", "The chameleon"],
    correct: 0
  },
  {
    question: "What is the name of the animal with the largest brain relative to its body size?",
    options: ["The sperm whale", "The elephant", "The dolphin", "The human"],
    correct: 0
  }
];

// Function to get unique questions
function getUniqueQuestions() {
  const unique_questions = [];
  const seen_questions = new Set();

  for (const q of all_questions) {
    if (!seen_questions.has(q.question)) {
      seen_questions.add(q.question);
      unique_questions.push(q);
    }
  }
  return unique_questions;
}

// Function to randomly select and prepare questions
function selectRandomQuestions() {
  const unique_questions = getUniqueQuestions();
  
  // Deep copy questions for selection
  const questions_copy = unique_questions.map(q => ({
    question: q.question,
    options: [...q.options],
    correct: q.correct
  }));
  
  // Shuffle to get random order
  let shuffled_questions = shuffleArray(questions_copy);
  
  // Randomly select a subset of questions (between 10-13 questions)
  // This ensures different questions each game
  const min_questions = 10;
  const max_questions = Math.min(13, unique_questions.length);
  const num_to_select = Math.floor(Math.random() * (max_questions - min_questions + 1)) + min_questions;
  
  // Take a random subset
  const selected_subset = shuffled_questions.slice(0, num_to_select);
  
  // Shuffle the subset again for extra randomness
  const final_shuffled = shuffleArray(selected_subset);

  // Shuffle options for each question and return final questions array
  // This ensures both question order AND answer positions are randomized
  return final_shuffled.map(q => shuffleQuestionOptions(q));
}

// Initialize questions array (will be regenerated on each quiz start)
let questions = selectRandomQuestions();

let current_question_index = 0;
let selected_option = null;
let score = 0;
let total_questions = 0; // Will be set based on available questions
let answered_questions = 0;
let user_answers = [];
let correct_answers = [];

function init_quiz() {
  // Set total_questions to the number of available questions (all unique, no repeats)
  total_questions = questions.length;
  
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
  // Select new random questions for the restart - ensure different questions
  questions = selectRandomQuestions();
  
  // Reset all quiz state
  current_question_index = 0;
  selected_option = null;
  score = 0;
  answered_questions = 0;
  user_answers = [];
  correct_answers = [];
  
  // Hide results and show question container
  document.getElementById('results-container').style.display = 'none';
  document.getElementById('question-container').style.display = 'block';
  
  document.getElementById('current-question').textContent = '1';
  document.getElementById('stations').innerHTML = '';
  
  // Reinitialize the quiz with new questions
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
    // Select new random questions each time the quiz starts
    questions = selectRandomQuestions();
    
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

