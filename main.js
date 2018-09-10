// Enum for available types from Trivia JSON Data
const triviaEnum = Object.freeze({"question":"question", "answer":"answer", "choices":"choices", "imageUrl":"imageUrl", "description":"description"});
// Enum for available values from local storage
const localStorageEnum = Object.freeze({"previousIndex":"previousIndex", "score":"score", "userName":"userName", "displayModal":"displayModal", "modalIndex":"modalIndex"});

window.onload = () => {
    pageDidLoad();
}

// Reads JSON data from the local trivia data file
function loadTriviaData(callback) {   
    var request = new XMLHttpRequest();
    request.overrideMimeType("application/json");
    request.open('GET', './triviaData.json', true);
    request.onreadystatechange = function () {
          if (request.readyState == 4 && request.status == "200") {
            callback(request.responseText);
          }
    };

    request.send(null);  
 }

function pageDidLoad () {

    const PAGE = document.getElementById('root');

    var heroImage = document.createElement('img');
    heroImage.className = 'heroImage';
    heroImage.src = 'darkSpace.jpg';
    PAGE.appendChild(heroImage);

    const returningUser = localStorage.getItem(localStorageEnum.userName);
    const welcomeMessage = document.createElement('h1');
    welcomeMessage.className = 'centerTitle';

    // Case where this is a new user
    if (!returningUser) { 
        welcomeMessage.textContent = 'WELCOME TO SPACE TRIVIA';
        PAGE.appendChild(welcomeMessage);

        var nameBox = document.createElement('input');
        nameBox.className = 'nameBox';
        nameBox.placeholder = 'Enter your name here';
        // The MAX name length we will accept
        nameBox.maxLength = 52;
        PAGE.appendChild(nameBox);

        var submitButton = document.createElement('button');
        submitButton.className = 'submitButton';
        submitButton.textContent = 'Play';
        submitButton.addEventListener('click', () => {
            let input = nameBox.value.trim();
            if(!!input) {
                PAGE.removeChild(welcomeMessage);
                PAGE.removeChild(nameBox);
                PAGE.removeChild(submitButton);

                // Persist the new user
                localStorage.setItem(localStorageEnum.userName, input);

                loadTriviaData( (response) => {
                    var data = JSON.parse(response);
                    let game = new Game(input, data, 0, 0);
                });

            } else {
                nameBox.value = '';
                nameBox.placeholder = 'Name is required to play :)';
            }
        });
        PAGE.appendChild(submitButton);
    // Case where this is a returning user
    } else { 
        const previousIndex =  parseInt(localStorage.getItem(localStorageEnum.previousIndex));
        const previousScore = parseInt(localStorage.getItem(localStorageEnum.score));
        const displayModal = localStorage.getItem(localStorageEnum.displayModal);
        loadTriviaData( (response) => {
            const data = JSON.parse(response);
            const max = Object.keys(data).length - 1;
            if (previousIndex < max) {
                let game = new Game(returningUser, data, previousIndex, previousScore, displayModal);
            } else {
                PAGE.appendChild(new GameOver(previousScore, returningUser));
            }
        });
    }
}

class Game {
    constructor (name, data, currentQuestionIndex, currentScore, displayModal) {        
        this.name = name;
        this.data = data;
        this.currentQuestionIndex = currentQuestionIndex;
        this.currentScore = currentScore;
        const PAGE = document.getElementById('root');
        const GAME_WINDOW = document.createElement('div');
        GAME_WINDOW.className = 'gameWindow';
        
        this.currentQuestionData = this.data[this.currentQuestionIndex];

        // MARK: Question Label
        const questionLabel = document.createElement('h1');
        questionLabel.className = 'centerTitle';
        questionLabel.textContent = this.currentQuestionData[triviaEnum.question];
        this.questionLabel = questionLabel;
        GAME_WINDOW.appendChild(this.questionLabel);

        // MARK: Score Label
        const scoreLabel = document.createElement('h2');
        scoreLabel.className = 'scoreLabel';
        scoreLabel.textContent = `Score: ${this.currentScore}`;
        this.scoreLabel = scoreLabel;
        GAME_WINDOW.appendChild(this.scoreLabel);

        // MARK: User Name Label
        const userNameLabel = document.createElement('h2');
        userNameLabel.className = 'userNameLabel';
        userNameLabel.textContent = name;
        GAME_WINDOW.appendChild(userNameLabel);

        const answerContainer = this.makeList(this.currentQuestionData[triviaEnum.choices]);
        this.answerContainer = answerContainer;

        GAME_WINDOW.appendChild(this.answerContainer);
        this.GAME_WINDOW = GAME_WINDOW;
        PAGE.appendChild(GAME_WINDOW);
        this.PAGE = PAGE;

        // For case when refresh occured during modal pop up
        if(displayModal === 'true') {
            const index = localStorage.getItem(localStorageEnum.modalIndex);
            this.displayModal(this.data[index]);
        }
    }

    // Returns a an html list containing the data passed
    makeList(answerChoices) {
        const answerContainer = document.createElement('ol');
        answerContainer.type = 'A';
        answerContainer.className = 'answerContainer';
        answerContainer.addEventListener('click', (event) => {
            const index = event.target.id;
            if (!!index) {
                const currentChoices = this.currentQuestionData[triviaEnum.choices];
                // If the the answer was correct
                if(currentChoices[index] === this.currentQuestionData[triviaEnum.answer]) {
                    this.currentScore += 10;
                    this.scoreLabel.textContent = `Score: ${this.currentScore}`;
                }
                this.displayModal(this.currentQuestionData);
                // Saves for case when refresh occurs during modal pop up
                localStorage.setItem(localStorageEnum.modalIndex, this.currentQuestionIndex);

                // Regardless of the result we move on to the next question
                this.nextQuestion();

                // Persisting data
                localStorage.setItem(localStorageEnum.previousIndex, this.currentQuestionIndex);
                localStorage.setItem(localStorageEnum.score, this.currentScore);

            }
        });
        const length = answerChoices.length;

        // Iterate over the data set and create nodes for each possible answer
        for(var i = 0; i < length; i++) {
            var item = document.createElement('li');
            item.className = 'answerChoice';
            item.textContent = answerChoices[i];
            // Ususally this id would be some complex guid but a simple index suffices in this use case
            item.id = i;
            answerContainer.appendChild(item);
        }
        return answerContainer;
    }

    // Advances to the next question and updates the UI
    nextQuestion() {
        // Right now there are only 11 possible questions
        const max = Object.keys(this.data).length - 1;
        if(this.currentQuestionIndex < max) {
            this.currentQuestionIndex += 1;
            // Update question data
            this.currentQuestionData = this.data[this.currentQuestionIndex];
            this.questionLabel.textContent = this.currentQuestionData[triviaEnum.question];
            const answerContainer = this.makeList(this.currentQuestionData[triviaEnum.choices]);
            //Replace old choices with new choices
            this.GAME_WINDOW.replaceChild(answerContainer, this.answerContainer);
            this.answerContainer = answerContainer;
        } else {
            //Handle game over
            this.PAGE.replaceChild(new GameOver(this.currentScore, this.name), this.GAME_WINDOW);
        }
    }

    // Displays more information about the current question
    displayModal(currentQuestionData) {
        localStorage.setItem(localStorageEnum.displayModal, true);

        const modalBox = document.createElement('div');
        modalBox.className = 'shadowBox';

        const modal = document.createElement('div');
        modal.className = 'modalContent';

        const closeButton = document.createElement('span');
        closeButton.className = 'modalClose';
        closeButton.innerHTML = '&times';
        closeButton.addEventListener('click', () => {
            this.PAGE.removeChild(modalBox);
            localStorage.setItem(localStorageEnum.displayModal, false);
        });

        const answer = document.createElement('h2');
        answer.className = 'modalAnswer';
        answer.textContent = currentQuestionData[triviaEnum.answer];

        const description = document.createElement('p');
        description.textContent = currentQuestionData[triviaEnum.description];
        description.className = 'modalSubtext';

        const image = document.createElement('img');
        image.src = currentQuestionData[triviaEnum.imageUrl];
        image.className = 'modalImage';

        modal.appendChild(closeButton);
        modal.appendChild(answer);
        modal.appendChild(image);
        modal.appendChild(description);
        
        modalBox.appendChild(modal);
        this.PAGE.appendChild(modalBox);

        window.onclick = (event) => {
            if (event.target == modalBox) {
                this.PAGE.removeChild(modalBox);
                localStorage.setItem(localStorageEnum.displayModal, false);
            }
        }
    }
}

function GameOver(finalScore, name) {
    const container = document.createElement('div');
    container.className = 'gameOver';

    const gameOverLabel = document.createElement('h1');
    gameOverLabel.className = 'centerTitle';
    gameOverLabel.textContent = 'Thanks for playing!';

    const results = document.createElement('h2');
    results.className = 'results';
    results.textContent = `${name} you scored ${finalScore} points!`;

    container.appendChild(gameOverLabel);
    container.appendChild(results);

    return container;
}
