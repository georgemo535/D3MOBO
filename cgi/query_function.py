#! /home/george/anaconda3/bin/python

# This function manages the interface with the task or task model

import sys
import json
import cgi
import numpy as np
import sqlite3
import time
import random
from synthetic_function import *

# Initialize the basic reply message
message = "Necessary objects imported."
success = True

# Read provided formData
formData = cgi.FieldStorage()

# Config params
testWaitTime = 5 #s
pilotWaitTime = 1 #s

# Function configs
weights = np.array([[0.5, 0.6, 0.4, 0.7, 0.1], 
                    [1.0, 0.4, 0.8, 0.9, 1.2]])
centers = np.array([[-0.2, 0.6, 0.7, 0.3, 0.7],
                    [0.2, 0.4, 0.2, 1.2, 0.9]])
biases = np.array([0.8, 0.7])

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

def testPerformance(paramValues, testType):
    # Testing mode
    if testType == 1:
        values = pilot_test_function(paramValues, weights, centers, biases)
    # Evaluation Mode
    elif testType == 0:
        values = formal_evaluation_function(paramValues, weights, centers, biases)
    return values.tolist()[0]

# Check that form values have been defined
expectedArgs = ['param_vals', 'test_type']
formValuesDefined = checkFormData(formData,expectedArgs)

# Report error if
if not formValuesDefined:
    success = False
    message = "Form values not defined."
else:
    # Parse arguments
    paramValsStr = formData['param_vals'].value
    paramValsStrArray = json.loads(paramValsStr)    
    paramVals = np.array([[float(i) for i in paramValsStrArray]])
    testType = int(formData['test_type'].value)

    # Enforce dummy delay
    if testType == 0:
        time.sleep(testWaitTime)
    elif testType == 1:
        time.sleep(pilotWaitTime)

    # Get obj values for given param values
    objVals = testPerformance(paramVals, testType)
    
    result = { "obj_vals": objVals }
    message = json.dumps(result)

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