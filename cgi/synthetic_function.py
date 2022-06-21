from import_all import *

def single_convex(x, weights, center, bias):
    value = -np.dot(weights, (x - center) ** 2) + bias
    return value

def objective_function(X, weights, centers, biases, noise):
    final = []
    for x in X:
        first = np.maximum(-1, single_convex(x, weights[0], centers[0], biases[0]) + noise * np.random.uniform(low=-1.0, high=1.0))
        
        second = np.maximum(-1, single_convex(x, weights[1], centers[1], biases[1]) + noise * np.random.uniform(low=-1.0, high=1.0))
        final.append([first, second])
    return torch.tensor(final, dtype=torch.float64)

def pilot_test_function(X, weights, centers, biases, noise=0.25):
    return objective_function(X, weights, centers, biases, noise=noise)

def formal_evaluation_function(X, weights, centers, biases, noise=0.05):
    return objective_function(X, weights, centers, biases, noise=noise)