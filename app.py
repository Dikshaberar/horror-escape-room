from flask import Flask, render_template, jsonify, request
import sqlite3

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        player_name TEXT,
        time_left INTEGER,
        lives INTEGER,
        date TEXT
    )''')
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/story')
def story():
    return render_template('story.html')

@app.route('/levelselect')
def levelselect():
    return render_template('levelselect.html')

@app.route('/game')
def game():
    return render_template('game.html')

@app.route('/leaderboard')
def leaderboard():
    return render_template('leaderboard.html')

@app.route('/howtoplay')
def howtoplay():
    return render_template('howtoplay.html')

@app.route('/save_score', methods=['POST'])
def save_score():
    data = request.json
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('INSERT INTO scores (player_name, time_left, lives, date) VALUES (?,?,?,?)',
              (data.get('name','Anonymous'), data.get('time_left',0),
               data.get('lives',0), data.get('date','')))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

@app.route('/get_scores')
def get_scores():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT player_name, time_left, lives, date FROM scores ORDER BY time_left DESC LIMIT 10')
    rows = c.fetchall()
    conn.close()
    return jsonify([{'name':r[0],'time_left':r[1],'lives':r[2],'date':r[3]} for r in rows])

if __name__ == '__main__':
    init_db()
    print("Running at http://localhost:5000")
    app.run(debug=True, port=5000)
