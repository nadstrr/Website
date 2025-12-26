function checkNumber() {
    const input = document.getElementById('numberInput');
    const result = document.getElementById('result');
    const number = parseInt(input.value);
    
    if (number === 67) {
        result.textContent = "slay qween";
    } else {
        result.textContent = "wrong! choose again";
    }
}

// Add Enter key support
document.addEventListener('DOMContentLoaded', function() {
    const input = document.getElementById('numberInput');
    input.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            checkNumber();
        }
    });
});
