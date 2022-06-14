#! /home/george/anaconda3/bin/python

# This function manages the interface with the task or task model

import sys
import json
import cgi
import numpy as np
import sqlite3
import time
import random
import sqlite3
from synthetic_function import *

# Initialize the basic reply message
message = "Necessary objects imported."
success = True

# Read provided formData
formData = cgi.FieldStorage()

# Config params
testWaitTime = 40 #s
pilotWaitTime = 5 #s

# Function configs
# weights = np.array([[0.5, 0.6, 0.4, 0.7, 0.1], 
#                     [1.0, 0.4, 0.8, 0.9, 1.2]])
# centers = np.array([[-0.2, 0.6, 0.7, 0.3, 0.7],
#                     [0.2, 0.4, 0.2, 1.2, 0.9]])
# biases = np.array([0.8, 0.7])
weightsDict = {"twitter": np.array([[0.9, 0.4, 1.3, 0.7, 0.4], [1.0, 0.6, 1.2, 0.5, 0.4]]),
            "stack-overflow": np.array([[1.2, 0.5, 0.4, 1.0, 0.6], [1.3, 0.7, 0.4, 0.9, 0.4]]),
            "google-maps": np.array([[1.2, 0.5, 0.6, 1.0, 0.4], [1.3, 0.7, 0.4, 0.9, 0.4]])}
centersDict = {"twitter": np.array([[0.9, 0.3, 0.8, 0.25, 0.25], [0.3, 0.35, 1.1, 0.75, 0.3]]),
                "stack-overflow": np.array([[-0.1, 0.25, 0.7, 0.7, 0.8], [0.2, 0.75, 0.65, 0.1, 0.7]]),
                "google-maps": np.array([[1.1, 0.75, 0.2, 0.3, 0.3], [0.8, 0.25, 0.3, 0.9, 0.35]])}
biasesDict = {"twitter": np.array([0.7, 0.8]),
                "stack-overflow": np.array([0.7, 0.8]),
                "google-maps": np.array([0.8, 0.7])}

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

def testPerformance(paramValues, testType, applicationID):
    if applicationID == 0:
        application = "twitter"
    elif applicationID == 1:
        application = "stack-overflow"
    elif applicationID == 2:
        application = "google-maps"

    # Testing mode
    if testType == 1:
        values = pilot_test_function(paramValues, weightsDict[application], centersDict[application], biasesDict[application])
    # Evaluation Mode
    elif testType == 0:
        values = formal_evaluation_function(paramValues, weightsDict[application], centersDict[application], biasesDict[application])
    return values.tolist()[0]

# Check that form values have been defined
expectedArgs = ['param_vals', 'test_type', 'participant_id', 'application_id', 'condition_id']
formValuesDefined = checkFormData(formData,expectedArgs)

# Report error if
if not formValuesDefined:
    success = False
    message = "Form values not defined."
else:
    # Parse arguments
    paramValsStr = formData['param_vals'].value
    paramValsRaw = json.loads(paramValsStr)    
    paramVals = np.array([[float(i) for i in paramValsRaw]])
    paramValsStrArray = str(paramVals)

    testTypeStr = formData['test_type'].value
    testType = int(testTypeStr)

    participantIDStr = formData['participant_id'].value
    applicationIDStr = formData['application_id'].value
    conditionIDStr = formData['condition_id'].value
    timeStr = str(time.time())

    # Enforce dummy delay
    if testType == 0:
        time.sleep(testWaitTime)
    elif testType == 1:
        time.sleep(pilotWaitTime)

    # Get obj values for given param values
    objVals = testPerformance(paramVals, testType, int(applicationIDStr))
    objValsStr = str(list(objVals))
    
    result = { "obj_vals": objVals }
    message = json.dumps(result)

    from db_config import db_path
    conn = sqlite3.connect(db_path)
    c = conn.cursor()

    createFunctionTableQuery = '''CREATE TABLE IF NOT EXISTS function (pid TEXT, aid TEXT, cid TEXT, params TEXT, objs TEXT, testtype TEXT, time TEXT)'''
    c.execute(createFunctionTableQuery)
    conn.commit()

    query = ''' INSERT INTO function VALUES (?, ?, ?, ?, ?, ?, ?)'''
    c.execute(query, (participantIDStr, applicationIDStr, conditionIDStr, paramValsStrArray, objValsStr, testTypeStr, timeStr))
    
    conn.commit()
    conn.close()

    # # Debug msg
    # debugMsg = "parameters: " + str(testType) + "\t [ " 
    # for i in paramVals:
    #     debugMsg += str(i) + " "
    # debugMsg += "], objectives: ["
    # for i in objVals:
    #     debugMsg += str(i) + " "
    # debugMsg += "] "
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