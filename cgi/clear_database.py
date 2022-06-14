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

c.execute("DELETE FROM function")
c.execute("DELETE FROM mobo")
c.execute("DELETE FROM time")

conn.commit()
conn.close()