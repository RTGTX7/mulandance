import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from flask import Flask, render_template, request, jsonify
from calculator import Calculator

app = Flask(__name__)
calc = Calculator()

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/calculate", methods=["POST"])
def calculate():
    data = request.get_json()
    expression = data.get("expression", "").strip()
    if not expression:
        return jsonify({"error": "表达式为空"})
    result = calc.calculate(expression)
    formatted = calc.format_result(result)
    is_error = isinstance(result, str)
    is_number = isinstance(result, (int, float)) and not isinstance(result, bool)
    entry = f"{expression} = {formatted}"
    if not is_error and is_number:
        calc.history.append(entry)
    elif not is_error:
        calc.history.append(entry)
    else:
        calc.history.append(entry)
    return jsonify({
        "expression": expression,
        "result": formatted,
        "error": is_error,
        "is_number": is_number
    })

@app.route("/api/history", methods=["GET"])
def get_history():
    return jsonify({"history": calc.history[-20:]})

@app.route("/api/clear_history", methods=["POST"])
def clear_history():
    calc.history.clear()
    return jsonify({"status": "ok"})

@app.route("/api/memory", methods=["POST"])
def memory():
    data = request.get_json()
    action = data.get("action", "").lower()
    expression = data.get("expression", "").strip()
    if action == "mc":
        calc.memory = 0
        return jsonify({"memory": 0, "status": "记忆已清除"})
    elif action == "mr":
        return jsonify({"memory": calc.memory, "status": f"记忆值: {calc.format_result(calc.memory)}"})
    elif action == "m+":
        if expression:
            result = calc.calculate(expression)
            if isinstance(result, (int, float)):
                calc.memory += result
                return jsonify({"memory": calc.memory, "status": f"记忆已累加: {calc.format_result(calc.memory)}"})
        return jsonify({"error": "无效表达式"})
    elif action == "m-":
        if expression:
            result = calc.calculate(expression)
            if isinstance(result, (int, float)):
                calc.memory -= result
                return jsonify({"memory": calc.memory, "status": f"记忆已减去: {calc.format_result(calc.memory)}"})
        return jsonify({"error": "无效表达式"})
    elif action == "ms":
        if expression:
            result = calc.calculate(expression)
            if isinstance(result, (int, float)):
                calc.memory = result
                return jsonify({"memory": calc.memory, "status": f"记忆已设置: {calc.format_result(calc.memory)}"})
        return jsonify({"error": "无效表达式"})
    return jsonify({"error": "无效操作"})

@app.route("/api/clear_memory", methods=["POST"])
def clear_memory():
    calc.memory = 0
    return jsonify({"memory": 0, "status": "记忆已清除"})

if __name__ == "__main__":
    print("计算器网站已启动: http://localhost:8080")
    app.run(debug=True, host="0.0.0.0", port=8080)