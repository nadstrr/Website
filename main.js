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
