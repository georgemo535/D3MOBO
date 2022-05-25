from import_all import *
from scipy.optimize import minimize
import time

### Main function to call ###

def propose_location_general(X_sample, Y_sample, lower_bound_points, upper_bound_points, betas, gpr, bounds, alpha, max_hypv, ref_point, n_restarts=25):
    assert(len(lower_bound_points) == len(upper_bound_points))
    flag_regions = False

    if len(lower_bound_points) > 0:
        flag_regions = True
    
    if not flag_regions:
        return propose_location(X_sample, Y_sample, gpr, bounds, ref_point, n_restarts=n_restarts)
    else:
        return propose_location_regions(X_sample, Y_sample, lower_bound_points, upper_bound_points, betas, gpr, bounds, alpha, max_hypv, ref_point, n_restarts=n_restarts)

### Propose location for regular MOBO without penalties ###

def propose_location(X_sample, Y_sample, gpr, bounds, ref_point, n_restarts=25):
    dim = X_sample.shape[1]
    qNEHVI = qNoisyExpectedHypervolumeImprovement(gpr, ref_point, X_sample)

    def min_obj_qnehvi(x):
        qnehvi = float(qNEHVI.forward(torch.tensor(x.reshape((1, dim)))))
        return -qnehvi

    min_val_hypv = np.inf
    min_x_hypv = None
    for x0 in np.random.uniform(bounds[:, 0], bounds[:, 1], size=(n_restarts,dim)):
        res = minimize(min_obj_qnehvi, x0=x0, bounds=bounds, method='L-BFGS-B')
        if res.fun < min_val_hypv:
            min_val_hypv = res.fun
            min_x_hypv = res.x

    return min_x_hypv.reshape(-1, )

### Propose Locations with Penalty Regions ###

def propose_location_regions(X_sample, Y_sample, lower_bound_points, upper_bound_points, betas, gpr, bounds, alpha, max_hypv, ref_point, n_restarts=25, return_normalizing=False):
    dim = X_sample.shape[1]
    min_val = np.inf
    min_x = None

    qNEHVI = qNoisyExpectedHypervolumeImprovement(gpr, ref_point, X_sample)

    problem_bounds = torch.zeros(2, dim, **tkwargs)
    problem_bounds[0] = torch.tensor(bounds[:, 0])
    problem_bounds[1] = torch.tensor(bounds[:, 1])

    _, norm_factor = optimize_acqf(
        acq_function=qNEHVI,
        bounds=problem_bounds,
        q=BATCH_SIZE,
        num_restarts=NUM_RESTARTS,
        raw_samples=RAW_SAMPLES,  # used for intialization heuristic
        options={"batch_limit": 5, "maxiter": 200, "nonnegative": True},
        sequential=True,
    )

    def min_obj(x):
        qnehvi = float(qNEHVI(torch.tensor(x.reshape((1, dim)))))
        penalty_by_regions = penalty_regions(x, lower_bound_points, upper_bound_points, betas, alpha, max_hypv, norm_factor)
        return -qnehvi + penalty_by_regions
    
    for x0 in np.random.uniform(bounds[:, 0], bounds[:, 1], size=(n_restarts, dim)):
        res = minimize(min_obj, x0=x0, bounds=bounds, method='L-BFGS-B')
        if res.fun < min_val:
            min_val = res.fun
            min_x = res.x

    if not return_normalizing:
        return min_x.reshape(-1, )
    else:
        return norm_factor, min_x.reshape(-1, 1)

### Penalty Regions ###

def penalty_regions(query_point, lower_bound_points, upper_bound_points, betas, alpha, max_hypv, normalizing_factor=1e-3):
    center = 0.5 * (lower_bound_points + upper_bound_points)
    widths = upper_bound_points - lower_bound_points
    distance_uncut = np.abs(np.tile(query_point, (lower_bound_points.shape[0], 1)) - center) - widths
    distance_cut = np.maximum(distance_uncut, 0)
    distance_squared = np.linalg.norm(distance_cut, axis=1) ** 2
    maximum_cutoff = np.maximum(distance_squared / alpha, 1 / max_hypv)
    return normalizing_factor * np.dot(betas, 1 / maximum_cutoff)