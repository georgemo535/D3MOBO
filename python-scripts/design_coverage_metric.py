import numpy as np

def which_hypercube(design_parameters, num_subdivisions=2):
    i = np.min([np.floor(num_subdivisions * design_parameters[0]), num_subdivisions-1]) 
    j = np.min([np.floor(num_subdivisions * design_parameters[1]), num_subdivisions-1]) 
    k = np.min([np.floor(num_subdivisions * design_parameters[2]), num_subdivisions-1]) 
    l = np.min([np.floor(num_subdivisions * design_parameters[3]), num_subdivisions-1]) 
    return (int(i), int(j), int(k), int(l))

def calculate_coverage(design_parameters, num_subdivisions, design_dim=4):
    hypercubes_covered = set()
    for design_parameter in design_parameters:
        hypercubes_covered.add(which_hypercube(design_parameter, num_subdivisions))
    return len(hypercubes_covered) / (num_subdivisions ** design_dim)

# design_parameters = [[1, 0.5, 0.2, 0.3], [0.2, 0.2, 0.2, 0.2]]

# # Number of subdivisions is the number of divisions for each axis
# print(calculate_coverage(design_parameters, 2))