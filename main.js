function checkNumber() {
    const input = document.getElementById('numberInput');
    const result = document.getElementById('result');
    const number = parseInt(input.value);

    if (number === 67) {
        result.textContent = "slay qween";
    } else if (number === 666) {
        result.textContent = "satan detected";
    } else if (number === 42) {
        result.textContent = "meaning of life found";
    } else if (number === 420) {
        result.textContent = "420 blaze it";
    } else if (number === 69) {
        result.textContent = "boring";
    } else {
        result.textContent = "wrong! choose again";
    }
    else if (number === 789) {
        result.textContent = "maybe 7 isnt so lucky if its doing that";
    }
}

// Add Enter key support
document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('numberInput');
    input.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            checkNumber();
        }
    });
});
