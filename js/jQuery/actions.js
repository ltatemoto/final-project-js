const $lettersElem   = $(".letters");
const $usedCharsElem = $(".used-letters");
const $hangmanElem   = $(".hangman-img");
const $pointsElem    = $(".points");
const $statusElem    = $(".status")
const $newWordBtn    = $("#new-word");
const $verifyWordBtn = $("#verify-word");
const $tipBtn        = $("#tip");

const words         = [];
let usedCharSet     = new Set();
let currWord        = "";
let $selectedLetter = null;
let commonIndex     = null;
let hangState       = 0;
let changedAny      = false;
let numCharGuessed  = 0;
let totalPoints     = 0;
let countTips       = 0;


// ---------------------------------------------------
// FUNCTIONS
// ---------------------------------------------------


// LOAD WORDS FROM EXTERNAL TXT FILE -----------------
fetch('sample_external/data.txt')
    .then( function(response) {
        if(!response.ok) {
            throw new Error('Network response not ok');
        }
        return response.text();
    })
    .then( data => {
        
        populateWords(data);

        selectNewCurrWord();
        setNewBlankLettersView();
    })
    .catch( function(error) {
        console.error('Error: ', error);
    });

// // this is used if no server available.
// const data = `
// drift
// apple
// candy
// jeoppardize
// sushi
// banana
// technology
// last
// animation
// meditation
// fun
// fudge
// dog
// cat
// friend
// laundry
// machine
// refrigerator
// baseball
// football
// guitar
// music
// wheel
// bicycle
// `;

function populateWords(data) {
    words.push(... data.split('\r\n'));
    console.log(words);
}



// SET NEW GAME ROUND --------------------------------

function selectNewCurrWord() {
    if (words.length > 0) {
        const randomIndex = Math.floor(Math.random() * words.length);
        currWord = words.splice(randomIndex, 1)[0];

        console.log("currWord: ", currWord);
        console.log("words length: ", words.length);
        console.log("random index: ", randomIndex);
    } else {
        console.error("NO MORE WORDS");

        $newWordBtn.prop("disabled", true);
    }
}

function setNewBlankLettersView() {
    $lettersElem.children().remove();
    for (let i = 0; i < currWord.length; i++) {
        $lettersElem.append(`<li class="letter"></li>`);
    }
}



// LETTERS INTERACTIONS ------------------------------

function changeSelectedLetterTo($newLetter) {
    if ($selectedLetter) {
        $selectedLetter.removeClass("selected");
    }
    $selectedLetter = $newLetter;
    commonIndex = getLetters().index($selectedLetter);
    $selectedLetter.addClass("selected");
}

function releaseSelection() {
    if ($selectedLetter) {
        $selectedLetter.removeClass("selected");
    }

    $selectedLetter = null;
    commonIndex = null;
}

function traverseByKeyboard(key) {
    const firstLetterIndex = 0;
    const lastLetterIndex = getLetters().length - 1;

    switch (key) {
        case "ArrowLeft":
            if ($selectedLetter === null) {
                changeSelectedLetterTo(getLetters().last());
                break;
            }
            if (commonIndex == firstLetterIndex) {
                releaseSelection();
                break;
            } 

            moveSelection(-1);
            break;

        case "ArrowRight":
            if ($selectedLetter === null) {
                changeSelectedLetterTo(getLetters().first());
                break;
            }
            if (commonIndex == lastLetterIndex) {
                releaseSelection();
                break;
            } 

            moveSelection(1);
            break;
    }
}

function getLetters() {
    return $lettersElem.children();
}

function typeCharacter(char) {
    if ($selectedLetter === null || changedAny) {
        return;
    }

    if (usedCharSet.has(char)) {
        console.error("AAAA")
        $selectedLetter.html("");
        $statusElem.html(`letter <strong>${char.toUpperCase()}</strong> is already used.`)
    } else {
        $selectedLetter.html(char.toUpperCase());
        changedAny = true;
    }
    
}

function moveSelection(n) {
    changeSelectedLetterTo(getLetters().eq(commonIndex + n));
}



// VALIDATION ----------------------------------------
    
function verifyWord() {
    let lastNumCharGuessed = numCharGuessed;

    if (!changedAny) {
        return;
    }

    let $currLetter = null;
    numCharGuessed = 0;
    for (let i = 0; i < currWord.length; i++) {
        $currLetter = getLetters().eq(i);

        if ($currLetter.html() == "") {
            continue;
        }

        if (!usedCharSet.has($currLetter.html())) {
            $usedCharsElem.append(`<li>${$currLetter.html()}</li>`);
            usedCharSet.add($currLetter.html());
        }
        

        // verify correctness
        if (currWord[i].toUpperCase() === $currLetter.html()) {
            $currLetter.addClass("correct");
            numCharGuessed++;
        } else {
            $currLetter.removeClass("correct");
        }

    }

    if (changedAny && lastNumCharGuessed == numCharGuessed) {
        updateHangmanImage(1);
    }

    if (numCharGuessed == currWord.length) {
        winGame();
    }
    changedAny = false;
}

function winGame() {
    totalPoints++;
    $pointsElem.html(`points: ${totalPoints}`);
    $(".pop-up").css("display", "block");

}



// DISPLAY -------------------------------------------

function updateHangmanImage(n) {
    if (n == "reset") {
        hangState = 0;
    } else {
        hangState += n;
    }
    if (hangState == 6) {
        animationGameOver = requestAnimationFrame(gameOver);
    }
    $hangmanElem.attr("src", `img/hangman-${hangState}.jpg`);
}

let animationGameOver;
let count = 0;
let frameDelay = 0;
function gameOver() {
    if (frameDelay % 12 === 0) {
        $hangmanElem.attr("src", `img/hangman-6${count}.jpg`);
        count ++;
        if (count > 8) {
            count = 0;
        }
    }
    frameDelay++;
    animationGameOver = requestAnimationFrame(gameOver);
}


// UTILITY --------------------------------------------

function charStorm(char) {
    char = char.toUpperCase();
    let $currLetter = null;
    for (let i = 0; i < currWord.length; i++) {
        $currLetter = getLetters().eq(i);
        if (currWord[i].toUpperCase() === char) {
            $currLetter.html(char)
            $currLetter.addClass("correct");
            numCharGuessed++;
        } else {
            $currLetter.removeClass("correct");
        }
    }
        
    changedAny = true;
    verifyWord();
}

function randomIndex(arg) {
    return Math.floor(Math.random() * arg.length);
}

function getUnusedValidCharArr() {
    const unusedValidCharSet = new Set();

    for (const char of currWord.toUpperCase()) {
        if (!usedCharSet.has(char)) {
            unusedValidCharSet.add(char);
        }
    }

    return new Array(...unusedValidCharSet);
}



// ---------------------------------------------------
// EVENT LISTENERS
// ---------------------------------------------------

$newWordBtn.on("click", function(e) {

    usedCharSet.clear();
    currWord        = "";
    $selectedLetter = null;
    commonIndex     = null;
    hangState       = 0;
    changedAny      = false;
    numCharGuessed  = 0;
    countTips = 0;
    $statusElem.html("");
    $usedCharsElem.children().remove();

    selectNewCurrWord();
    setNewBlankLettersView();
    updateHangmanImage("reset");
    cancelAnimationFrame(animationGameOver);

});

$lettersElem.on("click", "li", function(e) {
    changeSelectedLetterTo($(this));
});

$(document).on("click", ":not(.letter)", function(e) {
    if (!$(e.target).closest(".letter").length) {
        releaseSelection();
    }
})

$(document).on("keydown", function(e) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        traverseByKeyboard(e.key);
    } else if (e.key === "Backspace") {
        $selectedLetter.html("");
        moveSelection(-1);
    } else if (e.key === "Delete") {
        $selectedLetter.html("");
    } else if (e.key === "Enter") {
        verifyWord();
        moveSelection(1);
    } else if (e.key.match("^[a-zA-Z]$")) {
        typeCharacter(e.key.toUpperCase());
    } 
});

$verifyWordBtn.on("click", function(e) {
    verifyWord();
});

$tipBtn.on("click", function(e) {
    
    if (countTips > (currWord.length / 3)) {
        $statusElem.html("No more tips!")
        return;
    }
    const unusedValidCharArr = getUnusedValidCharArr();
    const randomChar = unusedValidCharArr[randomIndex(unusedValidCharArr)];
    charStorm(randomChar);
    countTips ++;
});



$(".close-pop-up").click(function() {
    $(".pop-up").css("display", "none");
});


// $("#test-btn").on("click", ()=> console.log(usedCharSet, getUnusedValidCharArr()))




