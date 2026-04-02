from flask import Flask, render_template, jsonify, request
import sqlite3
import os

app = Flask(__name__)

# create db table if not exists
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

# save player score to db
@app.route('/save_score', methods=['POST'])
def save_score():
    data = request.json
    name = data.get('name', 'Anonymous')
    time_left = data.get('time_left', 0)
    lives = data.get('lives', 0)
    date = data.get('date', '')

    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('INSERT INTO scores (player_name, time_left, lives, date) VALUES (?,?,?,?)',
              (name, time_left, lives, date))
    conn.commit()
    conn.close()
    return jsonify({'status': 'success'})

# get top 10 scores
@app.route('/get_scores')
def get_scores():
    conn = sqlite3.connect('database.db')
    c = conn.cursor()
    c.execute('SELECT player_name, time_left, lives, date FROM scores ORDER BY time_left DESC LIMIT 10')
    rows = c.fetchall()
    conn.close()
    result = []
    for r in rows:
        result.append({'name': r[0], 'time_left': r[1], 'lives': r[2], 'date': r[3]})
    return jsonify(result)

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5000))
    print("Running at http://localhost:" + str(port))
    app.run(host='0.0.0.0', port=port, debug=False)
