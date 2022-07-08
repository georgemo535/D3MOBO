#! /home/george/anaconda3/bin/python

# This function manages the interface with the task or task model

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

# Read provided post data
postData = sys.stdin.read()
jsonData = json.loads(postData)

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

def initialize_model(train_x, train_obj):
    # define models for objective and constraint
    model = SingleTaskGP(train_x, train_obj, outcome_transform=Standardize(m=train_obj.shape[-1]))
    return model

expectedArgs = ['design_params', 'objectives', 'participant_id', 'formal_eval']
formValuesDefined = checkFormData(jsonData, expectedArgs)

if not formValuesDefined:
    success = False
    message = "Form values not defined."
else:
    # Retrieve data
    participantId = jsonData['participant_id']
    designParamsRaw = np.array(jsonData['design_params'])
    objectiveValsRaw = np.array(jsonData['objectives'])
    formalEval = jsonData['formal_eval']
    
    # Log into SQL
    from db_config import db_path
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    createFunctionTableQuery = '''CREATE TABLE IF NOT EXISTS results (id INTEGER PRIMARY KEY, pid INTEGER, params TEXT, objs TEXT, formal INTEGER, timestamp TEXT)'''
    c.execute(createFunctionTableQuery)
    conn.commit()

    timeStr = str(time.time())

    query = ''' INSERT INTO results (pid, params, objs, formal, timestamp) VALUES (?, ?, ?, ?, ?)'''
    c.execute(query, (participantId, arrayToCsv(designParamsRaw), arrayToCsv(objectiveValsRaw), formalEval, timeStr))

    conn.commit()
    conn.close()

    #message = json.dumps(result)
    message = "evaluation result successfully submitted"


# Debug msg
# debugMsg = "jsonData:" + str(jsonData['participant_id'])
# debugMsg = postData
# message = debugMsg

reply = {}
reply['success'] = True
reply['message'] = message

sys.stdout.write("Content-Type: application/json")

sys.stdout.write("\n")
sys.stdout.write("\n")

sys.stdout.write(json.dumps(reply,indent=1))
sys.stdout.write("\n")

sys.stdout.close()