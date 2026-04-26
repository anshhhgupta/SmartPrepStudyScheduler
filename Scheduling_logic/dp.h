#ifndef DP_H
#define DP_H

#include <vector>
#include "subject.h"

// 2D Knapsack-based DP module to optimize daily study schedule
class DPOptimizer {
public:
    // Takes the greedy-sorted subjects and a daily limit.
    // Returns a vector of allocated hours for each subject in the order of `orderedIndices`.
    // It builds a DP table `dp[subject][available_hours]` to maximize total value.
    std::vector<int> allocateStudyHours(const std::vector<int>& orderedIndices, const std::vector<Subject>& subjects, int dailyLimit, bool silent = false);

    // Generates a multi-day study plan simulating sequential days and schedule adjustments.
    void generateMultiDayPlan(const std::vector<int>& topoOrder, std::vector<Subject> subjects, int dailyLimit);
};

#endif
