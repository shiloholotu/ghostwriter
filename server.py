from flask import Flask, render_template, request, jsonify
from waitress import serve
from claud import *
from wolfram import *
app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    app.run(debug=True)