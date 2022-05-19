#! C:/Python310/python.exe

# This function manages the interface with the task or task model

import sys
import json
import cgi
import numpy as np
import sqlite3
import time
import random

# Initialize the basic reply message
message = "Necessary objets imported."
success = True

# Read provided formData
formData = cgi.FieldStorage()

# Config params
testWaitTime = 5 #s
pilotWaitTime = 1 #s

# Define function for checking that required parameters have been submitted
def checkFormData(data,expectedArgs):
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

def testPerformance(paramValues):
    objValues = [];
    # TODO some model query
    objValues.append(random.uniform(0, 1))
    objValues.append(random.uniform(0, 1))
    return objValues

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
    paramVals = [float(i) for i in paramValsStrArray]
    testType = int(formData['test_type'].value)

    # Enforce dummy delay
    if testType == 0:
        time.sleep(testWaitTime)
    elif testType == 1:
        time.sleep(pilotWaitTime)

    # Get obj values for given param values
    objVals = testPerformance(paramVals)
    
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