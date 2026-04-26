#include "scheduler.h"
#include <iostream>
#include <algorithm>

using namespace std;

// Helper to determine if subject 'a' has strictly higher greedy priority than subject 'b'
static bool hasHigherGreedyPriority(const Subject& a, const Subject& b) {
    if (a.examDeadline != b.examDeadline) {
        return a.examDeadline < b.examDeadline; // 1. Earliest deadline
    }
    if (a.difficultyLevel != b.difficultyLevel) {
        return a.difficultyLevel > b.difficultyLevel; // 2. Highest difficulty
    }
    int remA = a.requiredHours - a.completedHours;
    int remB = b.requiredHours - b.completedHours;
    return remA > remB; // 3. More remaining hours
}

vector<int> greedySchedule(const vector<int>& topoOrder, const vector<Subject>& subjects, bool silent) {
    vector<int> greedyOrder;
    
    // We use a Dependency-Aware Insertion Sort.
    // It guarantees we never violate prerequisites (since we start from a valid topo sort)
    // while bubbling higher-priority subjects as early as possible.
    for (int currIdx : topoOrder) {
        greedyOrder.push_back(currIdx);
        int pos = greedyOrder.size() - 1;
        
        // Find the boundary: the maximum index in greedyOrder of any prerequisite of current subject
        int min_idx = -1;
        const auto& prereqs = subjects[currIdx].prerequisites;
        
        for (int p_idx : prereqs) {
            // Find where this prerequisite is currently located in our working greedyOrder
            for (int i = 0; i < pos; ++i) {
                if (greedyOrder[i] == p_idx) {
                    if (i > min_idx) {
                        min_idx = i;
                    }
                    break;
                }
            }
        }
        
        // Bubble the current subject backwards as long as it has higher greedy priority
        // than the element before it, and we don't cross its prerequisite boundary.
        while (pos > min_idx + 1) {
            int prevIdx = greedyOrder[pos - 1];
            
            if (hasHigherGreedyPriority(subjects[currIdx], subjects[prevIdx])) {
                swap(greedyOrder[pos], greedyOrder[pos - 1]);
                pos--;
            } else {
                break;
            }
        }
    }
    
    if (!silent) {
        // Print the explanation for the resulting ranking
        cout << "\n======================================================================\n";
        cout << "           Greedy Prioritized Study Order Explanation                 \n";
        cout << "======================================================================\n";
        
        for (size_t i = 0; i < greedyOrder.size(); ++i) {
            int idx = greedyOrder[i];
            const Subject& curr = subjects[idx];
            
            cout << i + 1 << ". " << curr.name 
                 << " [Deadline: " << curr.examDeadline << " days, "
                 << "Difficulty: " << curr.difficultyLevel << ", "
                 << "Remaining Hrs: " << (curr.requiredHours - curr.completedHours) << "]\n";
                 
            if (i == 0) {
                cout << "   -> Reason: Scheduled first. Highest priority among available subjects.\n";
            } else {
                int prevIdx = greedyOrder[i - 1];
                const Subject& prev = subjects[prevIdx];
                
                bool currHigher = hasHigherGreedyPriority(curr, prev);
                
                cout << "   -> Reason: ";
                if (currHigher) {
                    cout << "Has higher greedy priority but must be scheduled after prerequisite constraints (" << prev.name << ").\n";
                } else {
                    if (prev.examDeadline < curr.examDeadline) {
                         cout << "Scheduled after " << prev.name << " (Later exam deadline).\n";
                    } else if (prev.difficultyLevel > curr.difficultyLevel) {
                         cout << "Scheduled after " << prev.name << " (Same deadline, but lower difficulty).\n";
                    } else if ((prev.requiredHours - prev.completedHours) > (curr.requiredHours - curr.completedHours)) {
                         cout << "Scheduled after " << prev.name << " (Fewer remaining hours needed).\n";
                    } else {
                         cout << "Equal priority to " << prev.name << "; topological order tie-breaker applied.\n";
                    }
                }
            }
            cout << endl; // space between items for readability
        }
        cout << "======================================================================\n";
    }
    
    return greedyOrder;
}
