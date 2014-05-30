from flask import Flask

app = Flask(__name__, static_url_path='')

@app.route('/')
def root():
    

if __name__ == "__main__":
    app.run()