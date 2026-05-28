var expression = "";
var lastResult = null;
var isCalculated = false;
var memoryValue = 0;
var hasMemory = false;

var exprText = document.getElementById("expr-text");
var resultEl = document.getElementById("result");
var cursorEl = document.getElementById("cursor");
var memoryIndicator = document.getElementById("memory-indicator");
var historyToggle = document.getElementById("history-toggle");
var historyContent = document.getElementById("history-content");
var historyList = document.getElementById("history-list");
var clearHistoryBtn = document.getElementById("clear-history-btn");

function updateDisplay() {
    exprText.textContent = expression;
    cursorEl.style.display = isCalculated ? "none" : "inline-block";
    updateMemoryIndicator();
}

function updateMemoryIndicator() {
    if (hasMemory) {
        memoryIndicator.textContent = "M = " + formatNum(memoryValue);
        memoryIndicator.classList.add("active");
    } else {
        memoryIndicator.textContent = "";
        memoryIndicator.classList.remove("active");
    }
}

function formatNum(num) {
    if (typeof num === "number") {
        if (num === Math.floor(num) && Math.abs(num) < 1e15) {
            return num.toString();
        }
        return parseFloat(num.toPrecision(10)).toString();
    }
    return num;
}

function appendValue(value) {
    if (isCalculated) {
        if ("0123456789.abcdef(".indexOf(value) >= 0) {
            expression = "";
            isCalculated = false;
        } else {
            expression = lastResult.toString();
            isCalculated = false;
        }
    }
    expression += value;
    updateDisplay();
    preview();
}

function insertFunction(funcName) {
    if (isCalculated) {
        expression = "";
        isCalculated = false;
    }
    expression += funcName;
    updateDisplay();
    preview();
}

function doBackspace() {
    if (isCalculated) {
        expression = "";
        isCalculated = false;
        resultEl.textContent = "0";
        resultEl.classList.remove("error");
        updateDisplay();
        return;
    }
    expression = expression.slice(0, -1);
    updateDisplay();
    preview();
}

function doClear() {
    expression = "";
    lastResult = null;
    isCalculated = false;
    resultEl.textContent = "0";
    resultEl.classList.remove("error");
    updateDisplay();
}

function doClearEntry() {
    if (isCalculated) {
        doClear();
        return;
    }
    var match = expression.match(/(.*?)(sin|cos|tan|asin|acos|atan|log|ln|sqrt|abs)\($/);
    if (match) {
        expression = match[1];
    } else {
        expression = expression.replace(/[\d.]+$/, "");
    }
    updateDisplay();
    preview();
}

function doToggleSign() {
    if (expression) {
        if (expression.charAt(0) === "-") {
            expression = expression.substring(1);
        } else {
            expression = "-" + expression;
        }
        updateDisplay();
        preview();
    }
}

function doFactorial() {
    if (isCalculated && lastResult !== null) {
        expression = "fact(" + lastResult + ")";
    } else {
        expression += "fact(";
    }
    updateDisplay();
    preview();
}

async function doCalculate() {
    if (!expression) return;
    try {
        var body = JSON.stringify({ expression: expression });
        var req = new XMLHttpRequest();
        req.open("POST", "/api/calculate", true);
        req.setRequestHeader("Content-Type", "application/json");
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    var data = JSON.parse(req.responseText);
                    resultEl.textContent = data.result;
                    if (data.error) {
                        resultEl.classList.add("error");
                    } else {
                        resultEl.classList.remove("error");
                        lastResult = data.result;
                    }
                    isCalculated = true;
                    updateDisplay();
                    loadHistory();
                } else {
                    resultEl.textContent = "错误: 服务器异常";
                    resultEl.classList.add("error");
                }
            }
        };
        req.send(body);
    } catch (e) {
        resultEl.textContent = "错误: " + e.message;
        resultEl.classList.add("error");
    }
}

async function preview() {
    if (!expression.trim()) {
        resultEl.textContent = "0";
        resultEl.classList.remove("error");
        return;
    }
    try {
        var body = JSON.stringify({ expression: expression });
        var req = new XMLHttpRequest();
        req.open("POST", "/api/calculate", true);
        req.setRequestHeader("Content-Type", "application/json");
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    var data = JSON.parse(req.responseText);
                    if (!data.error) {
                        resultEl.textContent = data.result;
                        resultEl.classList.remove("error");
                    }
                }
            }
        };
        req.send(body);
    } catch (e) {
        // ignore preview errors
    }
}

async function loadHistory() {
    try {
        var req = new XMLHttpRequest();
        req.open("GET", "/api/history", true);
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    var data = JSON.parse(req.responseText);
                    historyList.innerHTML = "";
                    if (data.history.length === 0) {
                        historyList.innerHTML = '<div class="history-item" style="color:#505070">暂无历史记录</div>';
                        return;
                    }
                    for (var i = 0; i < data.history.length; i++) {
                        var entry = data.history[i];
                        var div = document.createElement("div");
                        div.className = "history-item";
                        div.textContent = entry;
                        div.addEventListener("click", function() {
                            var parts = this.textContent.split(" = ");
                            if (parts.length === 2) {
                                expression = parts[0];
                                lastResult = parts[1];
                                isCalculated = true;
                                updateDisplay();
                                resultEl.textContent = parts[1];
                            }
                        });
                        historyList.appendChild(div);
                    }
                }
            }
        };
        req.send();
    } catch (e) {
        // ignore
    }
}

async function doMemory(action) {
    try {
        var body = JSON.stringify({ action: action, expression: isCalculated ? lastResult : expression });
        var req = new XMLHttpRequest();
        req.open("POST", "/api/memory", true);
        req.setRequestHeader("Content-Type", "application/json");
        req.onreadystatechange = function() {
            if (req.readyState === 4) {
                if (req.status === 200) {
                    var data = JSON.parse(req.responseText);
                    if (data.memory !== undefined) {
                        memoryValue = data.memory;
                        hasMemory = true;
                    }
                    updateDisplay();
                }
            }
        };
        req.send(body);
    } catch (e) {
        // ignore
    }
}

async function doClearHistory() {
    try {
        var req = new XMLHttpRequest();
        req.open("POST", "/api/clear_history", true);
        req.setRequestHeader("Content-Type", "application/json");
        req.onreadystatechange = function() {
            if (req.readyState === 4 && req.status === 200) {
                loadHistory();
            }
        };
        req.send();
    } catch (e) {
        // ignore
    }
}

// Button click handlers
var buttons = document.querySelectorAll(".btn-num, .btn-op, .btn-sci, .btn-fn, .btn-mem");
for (var i = 0; i < buttons.length; i++) {
    (function(btn) {
        btn.addEventListener("click", function() {
            var value = this.getAttribute("data-value");
            var action = this.getAttribute("data-action");

            if (action === "clear") { doClear(); return; }
            if (action === "clear-entry") { doClearEntry(); return; }
            if (action === "backspace") { doBackspace(); return; }
            if (action === "toggle-sign") { doToggleSign(); return; }
            if (action === "equals") { doCalculate(); return; }

            if (action && action.indexOf("m") === 0) {
                doMemory(action);
                return;
            }

            if (value) {
                var funcNames = ["sin(", "cos(", "tan(", "asin(", "acos(", "atan(", "log(", "ln(", "sqrt(", "abs(", "fact("];
                var isFunc = false;
                for (var j = 0; j < funcNames.length; j++) {
                    if (value === funcNames[j]) {
                        insertFunction(value);
                        isFunc = true;
                        break;
                    }
                }
                if (!isFunc) {
                    if (value === "pi") { appendValue("pi"); }
                    else if (value === "e") { appendValue("e"); }
                    else if (value === "^2") { appendValue("^2"); }
                    else if (value === "1/") { appendValue("1/"); }
                    else { appendValue(value); }
                }
            }
        });
    })(buttons[i]);
}

// Keyboard support
document.addEventListener("keydown", function(e) {
    var key = e.key;
    if (key >= "0" && key <= "9") { appendValue(key); e.preventDefault(); }
    else if (key === ".") { appendValue("."); e.preventDefault(); }
    else if (key === "+") { appendValue("+"); e.preventDefault(); }
    else if (key === "-") { appendValue("-"); e.preventDefault(); }
    else if (key === "*") { appendValue("*"); e.preventDefault(); }
    else if (key === "/") { appendValue("/"); e.preventDefault(); }
    else if (key === "(") { appendValue("("); e.preventDefault(); }
    else if (key === ")") { appendValue(")"); e.preventDefault(); }
    else if (key === "^") { appendValue("^"); e.preventDefault(); }
    else if (key === "Enter" || key === "=") {
        if (expression) { doCalculate(); }
        e.preventDefault();
    }
    else if (key === "Backspace") { doBackspace(); e.preventDefault(); }
    else if (key === "Escape") { doClear(); e.preventDefault(); }
    else if (key === "Delete") { doClearEntry(); e.preventDefault(); }
});

// History toggle
historyToggle.addEventListener("click", function() {
    historyContent.classList.toggle("open");
    if (historyContent.classList.contains("open")) {
        loadHistory();
    }
});

// Clear history
clearHistoryBtn.addEventListener("click", doClearHistory);

// Expression editing
var expressionEl = document.getElementById("expression");
expressionEl.addEventListener("input", function() {
    expression = exprText.textContent;
    if (isCalculated) {
        isCalculated = false;
        cursorEl.style.display = "inline-block";
    }
    preview();
});

expressionEl.addEventListener("keydown", function(e) {
    if (e.key === "Enter") {
        e.preventDefault();
        if (expression) { doCalculate(); }
    }
});

// Init
updateDisplay();
loadHistory();