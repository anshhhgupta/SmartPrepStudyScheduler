#include "feedback.h"
#include <iostream>
#include <iomanip>

using namespace std;

void FeedbackSystem::processFeedback(vector<Subject>& subjects, const vector<int>& orderedIndices, const vector<int>& plannedAllocation, int dailyLimit) {
    cout << "\n======================================================\n";
    cout << "           Adaptive Feedback & Tracking               \n";
    cout << "======================================================\n";
    
    // 1. Collect user feedback comparing planned vs actual behavior
    for (size_t i = 0; i < subjects.size(); ++i) {
        if (subjects[i].completedHours < subjects[i].requiredHours) {
            
            // Map the subject index to its planned hours if it was actually scheduled
            int planned = 0;
            for (size_t j = 0; j < orderedIndices.size(); ++j) {
                if (orderedIndices[j] == i) {
                    planned = plannedAllocation[j];
                    break;
                }
            }
            
            cout << "Subject: " << subjects[i].name << " | Planned: " << planned << " hrs\n";
            cout << "Enter actual hours studied today: ";
            int actual;
            // Clean handling for non integers if any user error occurs
            if (!(cin >> actual)) {
                cin.clear();
                cin.ignore(10000, '\n');
                actual = 0;
            }
            
            subjects[i].completedHours += actual;
            
            // Highlight deviations from schedule
            if (actual < planned) {
                cout << "   -> [BEHIND SCHEDULE] Missed planned target by " << (planned - actual) << " hours.\n";
            } else if (actual > planned) {
                cout << "   -> [AHEAD OF SCHEDULE] Exceeded target by " << (actual - planned) << " hours!\n";
            } else {
                cout << "   -> [ON TRACK] Met planned target flawlessly.\n";
            }
            cout << "\n";
        }
    }
    
    // 2. Advance time forward by ending the day
    cout << "--- End of Day. Advancing deadlines by 1 day... ---\n";
    for (auto& s : subjects) {
        if (s.examDeadline > 0) {
            s.examDeadline--;
        }
    }
    
    // 3. Risk Assessment & Missed Hours Redistribution Pipeline
    cout << "\n======================================================\n";
    cout << "           Updated Status & Risk Assessment           \n";
    cout << "======================================================\n";
    
    for (size_t i = 0; i < subjects.size(); ++i) {
        int remHours = subjects[i].requiredHours - subjects[i].completedHours;
        
        if (remHours <= 0) {
            cout << "[COMPLETED] " << subjects[i].name << " is fully prepared.\n";
            continue;
        }
        
        if (subjects[i].examDeadline <= 0) {
            cout << "[CRITICAL FAILURE] " << subjects[i].name << ": Exam day reached but " << remHours << " hours still required!\n";
            continue;
        }
        
        // Recalculates needed hours seamlessly distributing back across remaining days
        double requiredPerDay = (double)remHours / subjects[i].examDeadline;
        
        cout << "[STATUS] " << left << setw(15) << subjects[i].name 
             << " | Left: " << setw(3) << remHours << " hrs "
             << " | Days: " << setw(3) << subjects[i].examDeadline 
             << " | New Load: " << fixed << setprecision(2) << requiredPerDay << " hrs/day";
             
        // Identify mathematical impossibility or extreme workloads based on standard limits
        if (remHours > dailyLimit * subjects[i].examDeadline) {
            cout << "\n         -> [RISK ALERT] Mathematically impossible to catch up under a " << dailyLimit << " hr/day limit!";
        } else if (requiredPerDay > dailyLimit * 0.75) {
            cout << "\n         -> [WARNING] Heavy load ahead. Consider re-prioritizing.";
        }
        cout << "\n";
    }
    cout << "======================================================\n\n";
}
