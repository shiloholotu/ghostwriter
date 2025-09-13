from flask import Flask, render_template, request, jsonify
from waitress import serve
from claude import *
from wolfram import *
app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")


if __name__ == "__main__":
    print(request_wolf("5+5"))
    ##app.run(debug=True)