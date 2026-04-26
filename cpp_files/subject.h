#ifndef SUBJECT_H
#define SUBJECT_H

#include <string>
#include <vector>

// Structure for a Subject
struct Subject {
    std::string name;
    int examDeadline;      // days from now
    int difficultyLevel;   // 1 to 5
    int requiredHours;
    int completedHours;
    std::vector<int> prerequisites; // list of subject indices
};

// Structure for a DailyPlan
struct DailyPlan {
    std::string date;
    std::vector<std::pair<std::string, int>> schedule; // list of (subject name, allocatedHours) pairs
};

#endif
