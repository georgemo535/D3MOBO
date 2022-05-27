#! /home/george/anaconda3/bin/python

# This function manages the interface with the task or task model

import sys
import json
import cgi
import numpy as np
import sqlite3
import time
import random

from acquire_mobo import *
from botorch.utils.multi_objective.pareto import is_non_dominated
from botorch.utils.multi_objective.box_decompositions.dominated import DominatedPartitioning

# Parameters
num_params = 5
num_objs = 2
max_hypv = 2 ** num_objs
alpha = 1e-2
bounds = np.array([[0, 1] for i in range(num_params)])
ref_point = torch.tensor([-1.0 for _ in range(num_objs)])

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

def initialize_model(train_x, train_obj):
    # define models for objective and constraint
    model = SingleTaskGP(train_x, train_obj, outcome_transform=Standardize(m=train_obj.shape[-1]))
    return model

expectedArgs = ['design_params', 'objectives', 'forbidden_regions']
formValuesDefined = checkFormData(formData, expectedArgs)

if not formValuesDefined:
    success = False
    message = "Form values not defined."
else:
    # Parse arguments
    designParams = torch.tensor(np.float_(json.loads(formData['design_params'].value)), dtype=torch.float64)
    objectiveVals = torch.tensor(np.float_(json.loads(formData['objectives'].value)), dtype=torch.float64)
    forbiddenRegions = np.float_(json.loads(formData['forbidden_regions'].value))

    if len(designParams) == 0:
        result = { "proposed_location": list(np.random.uniform(size=num_params))}
    else:
        gpr = initialize_model(designParams, objectiveVals)
        mll = ExactMarginalLogLikelihood(gpr.likelihood, gpr)
        fit_gpytorch_model(mll)

        if len(forbiddenRegions.shape) == 1:
            lower_bound_points = []
            upper_bound_points = []
            confidences = []
        else:
            lower_bound_points = forbiddenRegions[:, :num_params]
            upper_bound_points = forbiddenRegions[:, num_params: 2*num_params]
            confidences = forbiddenRegions[:, -1]

        proposed_location = propose_location_general(designParams, objectiveVals, lower_bound_points, upper_bound_points,
                                                    confidences, gpr, bounds, alpha, max_hypv, ref_point, n_restarts=10)
        
        result = { "proposed_location": list(np.around((proposed_location), 2))}
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
