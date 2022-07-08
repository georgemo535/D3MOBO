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

expectedArgs = ['participant_id', 'num_params', 'num_objs']
formValuesDefined = checkFormData(formData, expectedArgs)

if not formValuesDefined:
    success = False
    message = "Form values not defined."
else:
    from db_config import db_path
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    participantID = int(formData['participant_id'].value)

    selectQuery = "SELECT * FROM results WHERE pid = ?"
    c.execute(selectQuery, (participantID,))
    rows = c.fetchall()

    databaseLength = len(rows)

    selectFormalDesigns = "SELECT params FROM results WHERE pid = ? AND formal = 1"
    c.execute(selectFormalDesigns, (participantID,))
    formalDesigns = c.fetchall()
    formalDesigns = np.array(formalDesigns).flatten()
    formalDesigns = np.float_([l.split(",") for l in formalDesigns])
    formalDesigns = formalDesigns.tolist()


    selectFormalObjs = "SELECT objs FROM results WHERE pid = ? AND formal = 1"
    c.execute(selectFormalObjs, (participantID,))
    formalObjs = c.fetchall()
    formalObjs = np.array(formalObjs).flatten()
    formalObjs = np.float_([l.split(",") for l in formalObjs])
    formalObjs = formalObjs.tolist()

    selectHeuristicDesigns = "SELECT params FROM results WHERE pid = ? AND formal = 0"
    c.execute(selectHeuristicDesigns, (participantID,))
    heuristicDesigns = c.fetchall()
    heuristicDesigns = np.array(heuristicDesigns).flatten()
    heuristicDesigns = np.float_([l.split(",") for l in heuristicDesigns])
    heuristicDesigns = heuristicDesigns.tolist()

    selectHeuristicObjs = "SELECT objs FROM results WHERE pid = ? AND formal = 0"
    c.execute(selectHeuristicObjs, (participantID,))
    heuristicObjs = c.fetchall()
    heuristicObjs = np.array(heuristicObjs).flatten()
    heuristicObjs = np.float_([l.split(",") for l in heuristicObjs])
    heuristicObjs = heuristicObjs.tolist()

    conn.commit()
    conn.close()

    result = { "data_length": str(databaseLength), "formal_designs": formalDesigns, "formal_objs": formalObjs,
                "heuristic_designs": heuristicDesigns, "heuristic_objs": heuristicObjs}

    message = json.dumps(result)

reply = {}
reply['success'] = True
reply['message'] = message

sys.stdout.write("Content-Type: application/json")

sys.stdout.write("\n")
sys.stdout.write("\n")

sys.stdout.write(json.dumps(reply,indent=1))
sys.stdout.write("\n")

sys.stdout.close()
