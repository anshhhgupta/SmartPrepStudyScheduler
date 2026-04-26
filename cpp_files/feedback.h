#ifndef FEEDBACK_H
#define FEEDBACK_H

#include <vector>
#include "subject.h"

// The Adaptive Feedback System to continuously adjust schedules based on actual performance.
class FeedbackSystem {
public:
    // Processes user feedback on actual hours studied, evaluates planned vs actual,
    // updates the completed hours, deducts a day from deadlines, assesses risks,
    // and displays the updated loads and warnings.
    void processFeedback(std::vector<Subject>& subjects, const std::vector<int>& orderedIndices, const std::vector<int>& plannedAllocation, int dailyLimit);
};

#endif
