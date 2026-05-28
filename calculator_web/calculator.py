#!/usr/bin/env python3
"""交互式计算器程序"""
import math
import sys


class Calculator:
    def __init__(self):
        self.memory = 0
        self.history = []

    def calculate(self, expression):
        def fact(n):
            n = int(float(n))
            if n < 0:
                return "错误: 负数无阶乘"
            result = 1
            for j in range(2, n + 1):
                result *= j
            return result

        allowed_chars = set("0123456789+-*/().%eE ,^abcdefghijklmnopqrstuvwxyz")
        for char in expression:
            if char not in allowed_chars:
                raise ValueError(f"非法字符: {char}")

        expression = expression.strip()
        if not expression:
            raise ValueError("表达式为空")

        expression = expression.replace("\u00d7", "*").replace("\u00f7", "/").replace("^", "**")
        expression = expression.replace("\u221a(", "math.sqrt(")
        expression = expression.replace("sqrt(", "math.sqrt(")
        expression = expression.replace("log(", "math.log10(")
        expression = expression.replace("ln(", "math.log(")

        try:
            result = eval(
                expression,
                {
                    "__builtins__": {},
                    "math": math,
                    "sin": math.sin,
                    "cos": math.cos,
                    "tan": math.tan,
                    "asin": math.asin,
                    "acos": math.acos,
                    "atan": math.atan,
                    "pi": math.pi,
                    "e": math.e,
                    "abs": abs,
                    "round": round,
                    "min": min,
                    "max": max,
                    "fact": fact,
                },
                {},
            )
            if isinstance(result, complex):
                return result
            if isinstance(result, float) and math.isnan(result):
                return "错误: 未定义"
            if isinstance(result, float) and math.isinf(result):
                return "错误: 无穷大"
            return result
        except ZeroDivisionError:
            return "错误: 除以零"
        except Exception as e:
            return f"错误: {e}"

    def format_result(self, result):
        if isinstance(result, complex):
            return f"{result.real} + {result.imag}j"
        if isinstance(result, float):
            if result == int(result) and abs(result) < 1e15:
                return str(int(result))
            return f"{result:.10g}"
        return str(result)

    def show_menu(self):
        print()
        print("=" * 40)
        print("       交互式计算器")
        print("=" * 40)
        print("基本运算: +  -  *  /")
        print("高级运算: ^ (幂)  \u221a(x) (开方)")
        print("其他功能: log(x) (常用对数)  ln(x) (自然对数)")
        print("记忆功能: M+  M-  MR  MC  MS")
        print("历史记录: history")
        print("帮助: help")
        print("退出: exit / quit")
        print("=" * 40)

    def run(self):
        self.show_menu()
        print()
        print("输入表达式进行计算（直接按Enter查看历史记录）")
        last_result = None

        while True:
            try:
                expr = input()
                expr = expr.strip()
            except (EOFError, KeyboardInterrupt):
                print()
                print("再见！")
                break

            if not expr:
                if self.history:
                    print()
                    print("--- 历史记录 ---")
                    for i, entry in enumerate(self.history[-10:], 1):
                        print(f"  {i}. {entry}")
                    print("---------------")
                continue

            lower = expr.lower()
            if lower in ("exit", "quit", "q"):
                print("再见！")
                break
            elif lower == "help":
                self.show_help()
                continue
            elif lower == "history":
                self.show_history()
                continue
            elif lower == "clear":
                self.history.clear()
                print("历史记录已清除")
                continue
            elif lower == "mc":
                self.memory = 0
                print("记忆已清除")
                continue
            elif lower == "mr":
                print(f"记忆值: {self.format_result(self.memory)}")
                continue
            elif lower.startswith("m+"):
                try:
                    val = expr[2:].strip()
                    if val == "ans" and last_result is not None:
                        result = last_result
                    else:
                        result = self.calculate(val)
                    if isinstance(result, (int, float)):
                        self.memory += result
                        print(f"记忆已累加: {self.format_result(self.memory)}")
                except Exception:
                    print("错误: 无效表达式")
                continue
            elif lower.startswith("m-"):
                try:
                    val = expr[2:].strip()
                    if val == "ans" and last_result is not None:
                        result = last_result
                    else:
                        result = self.calculate(val)
                    if isinstance(result, (int, float)):
                        self.memory -= result
                        print(f"记忆已减去: {self.format_result(self.memory)}")
                except Exception:
                    print("错误: 无效表达式")
                continue
            elif lower.startswith("ms"):
                try:
                    val = expr[2:].strip()
                    if val == "ans" and last_result is not None:
                        result = last_result
                    else:
                        result = self.calculate(val)
                    if isinstance(result, (int, float)):
                        self.memory = result
                        print(f"记忆已设置: {self.format_result(self.memory)}")
                except Exception:
                    print("错误: 无效表达式")
                continue

            if expr == "ans" and last_result is not None:
                print(f"= {self.format_result(last_result)}")
                continue

            result = self.calculate(expr)
            formatted = self.format_result(result)
            print(f"= {formatted}")

            if isinstance(result, (int, float)) and not isinstance(result, bool):
                last_result = result

            if not isinstance(result, str) and not isinstance(result, complex):
                self.history.append(f"{expr} = {formatted}")
            else:
                self.history.append(f"{expr} = {formatted}")

            if isinstance(result, (int, float)) and not isinstance(result, bool):
                print("(按Enter继续，输入 ans 使用上次结果)")

    def show_help(self):
        lines = [
            "",
            "帮助信息:",
            "--------",
            "数学常量: pi, e",
            "函数: sin(x), cos(x), tan(x), asin(x), acos(x), atan(x)",
            "其他: abs(x), round(x, n), min(x,y), max(x,y), fact(n)",
            "示例:",
            "  2 + 3 * 4",
            "  (10 - 2) / 4",
            "  2 ^ 10",
            "  \u221a144",
            "  sin(pi / 2)",
            "  log(100)",
            "  ln(e^3)",
            "  fact(5)",
            "",
        ]
        for line in lines:
            print(line)

    def show_history(self):
        if not self.history:
            print("历史记录为空")
        else:
            print()
            print("--- 历史记录 ---")
            for i, entry in enumerate(self.history[-20:], 1):
                print(f"  {i}. {entry}")
            print(f"（共 {len(self.history)} 条）")
            print("---------------")


if __name__ == "__main__":
    calc = Calculator()
    calc.run()