#ifndef SCHEDULER_H
#define SCHEDULER_H

#include <vector>
#include "subject.h"

// Generates a greedy-prioritized schedule based on a valid topological order.
// Respects prerequisites while locally prioritizing based on:
// 1. Earliest exam deadline (ascending)
// 2. Highest difficulty level (descending)
// 3. Most remaining hours (required - completed)
std::vector<int> greedySchedule(const std::vector<int>& topoOrder, const std::vector<Subject>& subjects, bool silent = false);

#endif
