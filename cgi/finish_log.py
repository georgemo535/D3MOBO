#! /home/george/anaconda3/bin/python

import sys
import json
import cgi
import numpy as np
import sqlite3
import time
import random

# Initialize the basic reply message
message = "Necessary objects imported."
success = True

# Read provided formData
formData = cgi.FieldStorage()

# Define function for checking that required parameters have been submitted
def checkFormData(data, expectedArgs):
    argsDefined = True
    for i in range(0,len(expectedArgs)):
        if expectedArgs[i] not in data:
            argsDefined = False
            break
    return argsDefined

# Define function for converting param points to csv string
def arrayToCsv(values):
    csv_string = ""
    n = values.shape[0]
    for i in range(0,n):
        if (i > 0):
            csv_string += ","
        csv_string += str(values[i])
    return csv_string

expectedArgs = ['participant_id', 'condition_id', 'application_id']
formValuesDefined = checkFormData(formData, expectedArgs)

if not formValuesDefined:
    success = False
    message = "Form values not defined."
else:
    from db_config import db_path
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    createFunctionTableQuery = '''CREATE TABLE IF NOT EXISTS time (pid TEXT, aid TEXT, cid TEXT, type TEXT, time TEXT)'''
    c.execute(createFunctionTableQuery)
    conn.commit()

    participantIDStr = str(formData['participant_id'].value)
    applicationIDStr = str(formData['application_id'].value)
    conditionIDStr = str(formData['condition_id'].value)
    typeStr = "end"
    timeStr = str(time.time())

    query = ''' INSERT INTO time VALUES (?, ?, ?, ?, ?)'''
    c.execute(query, (participantIDStr, applicationIDStr, conditionIDStr, typeStr, timeStr))

    conn.commit()
    conn.close()

    message = json.dumps("success")

reply = {}
reply['success'] = True
reply['message'] = message

sys.stdout.write("Content-Type: application/json")

sys.stdout.write("\n")
sys.stdout.write("\n")

sys.stdout.write(json.dumps(reply,indent=1))
sys.stdout.write("\n")

sys.stdout.close()