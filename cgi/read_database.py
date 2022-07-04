import sys
import json
import cgi
import numpy as np
import sqlite3
import time
import random
import sqlite3

db_path = 'data/database.db'

conn = sqlite3.connect(db_path)
c = conn.cursor()

c.execute("SELECT * FROM time")

rows = c.fetchall()

for row in rows:
    print(row)
    
conn.commit()
conn.close()