#include "dp.h"
#include "scheduler.h"
#include <iostream>
#include <iomanip>
#include <algorithm>

using namespace std;

vector<int> DPOptimizer::allocateStudyHours(const vector<int>& orderedIndices, const vector<Subject>& subjects, int dailyLimit, bool silent) {
    int n = orderedIndices.size();
    if (n == 0) return {};

    // dp table: dp[i][w] = max value using the first i subjects and w hours
    // i ranges from 0 to n (1-based to distinguish 0 subjects)
    vector<vector<double>> dp(n + 1, vector<double>(dailyLimit + 1, 0.0));
    
    // choice table to track how many hours were actually allocated to subject i at state w
    vector<vector<int>> choice(n + 1, vector<int>(dailyLimit + 1, 0));

    for (int i = 1; i <= n; ++i) {
        int idx = orderedIndices[i - 1];
        const Subject& s = subjects[idx];
        
        // Allowed hours bounded by what is still required for the subject
        int remHours = max(0, s.requiredHours - s.completedHours);
        
        // Value heuristic computation: difficulty * (1.0 / daysToDeadline)
        double daysToDeadline = max(1.0, (double)s.examDeadline); // Clamp to 1 avoid div-by-zero
        double valuePerHour = s.difficultyLevel * (1.0 / daysToDeadline);

        for (int w = 0; w <= dailyLimit; ++w) {
            // Base case without allocating to current subject
            dp[i][w] = dp[i - 1][w];
            choice[i][w] = 0;

            // Try allocating h hours, up to min(remaining required hours, available daily w)
            for (int h = 1; h <= min(remHours, w); ++h) {
                double val = dp[i - 1][w - h] + h * valuePerHour;
                
                // If this choice yields greater value, take it. Note: Because orderedIndices is 
                // priorly sorted via our Greedy technique, keeping strict '>' ensures that in 
                // a tie, the higher-ranked greedy subjects are favored naturally.
                if (val > dp[i][w]) {
                    dp[i][w] = val;
                    choice[i][w] = h;
                }
            }
        }
    }

    if (!silent) {
        // --- Output 1: Debugging DP Table ---
        cout << "\n=========================================================================================\n";
        cout << "                           2D Knapsack DP Table (Values)                                 \n";
        cout << "=========================================================================================\n";
        cout << left << setw(12) << "Subj \\ Hrs";
        for (int w = 0; w <= dailyLimit; ++w) {
            cout << right << setw(8) << w;
        }
        cout << "\n-----------------------------------------------------------------------------------------\n";

        for (int i = 0; i <= n; ++i) {
            if (i == 0) {
                cout << left << setw(12) << "Initial[0]";
            } else {
                string name = subjects[orderedIndices[i - 1]].name;
                if (name.length() > 10) name = name.substr(0, 7) + "...";
                cout << left << setw(12) << name;
            }

            for (int w = 0; w <= dailyLimit; ++w) {
                cout << fixed << setprecision(2) << right << setw(8) << dp[i][w];
            }
            cout << "\n";
        }
        cout << "=========================================================================================\n\n";
    }

    // --- Traceback Choices ---
    vector<int> allocation(n, 0);
    int current_w = dailyLimit;
    for (int i = n; i > 0; --i) {
        int h = choice[i][current_w];
        allocation[i - 1] = h;
        current_w -= h; // reduce remaining capacity by what we took
    }

    if (!silent) {
        // --- Output 2: Extracted Allocation ---
        cout << "--- Today's Study Allocation (Daily Limit: " << dailyLimit << " hrs) ---\n";
        double totalVal = 0.0;
        int totalHrs = 0;
        for (int i = 0; i < n; ++i) {
            int idx = orderedIndices[i];
            int h = allocation[i];
            if (h > 0) {
                double daysToDeadline = max(1.0, (double)subjects[idx].examDeadline);
                double v = subjects[idx].difficultyLevel * (1.0 / daysToDeadline) * h;
                cout << " -> " << subjects[idx].name << " : " << h << " hours "
                     << "(Value gained: " << fixed << setprecision(2) << v << ")\n";
                     
                totalVal += v;
                totalHrs += h;
            }
        }
        cout << "-----------------------------------------------------------------------------------------\n";
        cout << "Total Hours Allocated: " << totalHrs << " / " << dailyLimit << "\n";
        cout << "Total Value Maximized: " << fixed << setprecision(2) << totalVal << "\n";
    }

    return allocation;
}

void DPOptimizer::generateMultiDayPlan(const vector<int>& topoOrder, vector<Subject> subjects, int dailyLimit) {
    int maxDays = 0;
    for (const auto& s : subjects) {
        if (s.examDeadline > maxDays) maxDays = s.examDeadline;
    }
    
    if (maxDays <= 0) {
        cout << "\n[INFO] No upcoming exams found to build a multi-day plan.\n";
        return;
    }

    cout << "\n=========================================================================================\n";
    cout << "                             Multi-Day Study Schedule                                        \n";
    cout << "=========================================================================================\n";
    cout << left << setw(8) << "Day" 
         << setw(25) << "Subject" 
         << setw(16) << "Allocated Hrs" 
         << "Cumulative Progress %\n";
    cout << "-----------------------------------------------------------------------------------------\n";

    for (int day = 1; day <= maxDays; ++day) {
        vector<int> currentGreedy = greedySchedule(topoOrder, subjects, true);
        vector<int> alloc = allocateStudyHours(currentGreedy, subjects, dailyLimit, true);
        
        bool dayHadWork = false;
        for (size_t i = 0; i < alloc.size(); ++i) {
            int h = alloc[i];
            if (h > 0) {
                int idx = currentGreedy[i];
                subjects[idx].completedHours += h;
                
                double pct = 100.0;
                if (subjects[idx].requiredHours > 0) {
                    pct = (double)subjects[idx].completedHours / subjects[idx].requiredHours * 100.0;
                    if (pct > 100.0) pct = 100.0;
                }
                
                string nameTrunc = subjects[idx].name.length() > 22 ? subjects[idx].name.substr(0, 19) + "..." : subjects[idx].name;
                
                cout << left << setw(8) << (dayHadWork ? "" : "Day " + to_string(day))
                     << setw(25) << nameTrunc
                     << setw(16) << h 
                     << fixed << setprecision(1) << pct << "%\n";
                     
                dayHadWork = true;
            }
        }
        
        if (dayHadWork) {
            cout << "-----------------------------------------------------------------------------------------\n";
        }
        
        // Progress calendar
        for (auto& s : subjects) {
            if (s.examDeadline > 0) s.examDeadline--;
        }
    }
}
