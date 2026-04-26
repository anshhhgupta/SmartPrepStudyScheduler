#include <iostream>
#include <vector>
#include <string>
#include <iomanip>
#include <limits>
#include "subject.h"
#include "graph.h"
#include "scheduler.h"
#include "dp.h"
#include "feedback.h"
#include "risk.h"

using namespace std;

// Function to read N subjects from the user
void inputSubjects(vector<Subject>& subjects) {
    int n;
    cout << "\nEnter the number of subjects to add: ";
    if (!(cin >> n)) {
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        cout << "[ERROR] Invalid input.\n";
        return;
    }

    for (int i = 0; i < n; ++i) {
        Subject s;
        cout << "\n--- Subject " << subjects.size() + 1 << " ---" << endl;
        
        cout << "Name: ";
        cin >> ws; // Clear leading whitespace
        getline(cin, s.name);
        
        cout << "Exam Deadline (days from now): ";
        cin >> s.examDeadline;
        
        cout << "Difficulty Level (1-5): ";
        cin >> s.difficultyLevel;
        
        cout << "Required Hours: ";
        cin >> s.requiredHours;
        
        // Auto default to 0 for a new subject since they literally just added it!
        s.completedHours = 0; 
        
        int numPrereqs;
        cout << "Number of prerequisites (completed + pending): ";
        cin >> numPrereqs;
        
        if (numPrereqs > 0) {
            cout << "Enter prerequisite subject indices (1-based index based on total current list, space separated): ";
            for (int j = 0; j < numPrereqs; ++j) {
                int pre;
                cin >> pre;
                s.prerequisites.push_back(pre - 1); 
            }
        }
        
        subjects.push_back(s);
    }
    cout << "\n[SUCCESS] " << n << " subjects added.\n";
}

// Function to print all subjects in a table format
void displaySubjects(const vector<Subject>& subjects) {
    if (subjects.empty()) {
        cout << "\n[INFO] No subjects found in the system.\n";
        return;
    }
    
    cout << "\n====================================================================================================\n";
    cout << left 
         << setw(5)  << "ID" 
         << setw(20) << "Name" 
         << setw(16) << "Deadline(days)" 
         << setw(12) << "Difficulty" 
         << setw(15) << "Req. Hours" 
         << setw(16) << "Comp. Hours" 
         << "Prerequisites (IDs)\n";
    cout << "----------------------------------------------------------------------------------------------------\n";
    
    for (size_t i = 0; i < subjects.size(); ++i) {
        const auto& s = subjects[i];
        cout << left 
             << setw(5)  << i + 1
             << setw(20) << (s.name.length() > 18 ? s.name.substr(0, 15) + "..." : s.name)
             << setw(16) << s.examDeadline
             << setw(12) << s.difficultyLevel
             << setw(15) << s.requiredHours
             << setw(16) << s.completedHours;
             
        string prereqs = "";
        if (s.prerequisites.empty()) {
            prereqs = "None";
        } else {
            for (size_t j = 0; j < s.prerequisites.size(); ++j) {
                prereqs += to_string(s.prerequisites[j] + 1);
                if (j < s.prerequisites.size() - 1) {
                    prereqs += ", ";
                }
            }
        }
        cout << prereqs << endl;
    }
    cout << "====================================================================================================\n";
}

void printMenu() {
    cout << "\n=========================================\n";
    cout << "          SmartPrep Optimizer CLI        \n";
    cout << "=========================================\n";
    cout << "1. Add Subjects (Input Module)\n";
    cout << "2. Validate Prerequisites & Order (Graph)\n";
    cout << "3. Generate Today's Schedule (DP)\n";
    cout << "4. Update Progress (Adaptive Feedback)\n";
    cout << "5. View Risk Report (Detection)\n";
    cout << "6. View Full Schedule Summary\n";
    cout << "7. Generate Multi-Day Plan\n";
    cout << "0. Exit\n";
    cout << "-----------------------------------------\n";
    cout << "Select an option: ";
}

int main() {
    vector<Subject> subjects;
    int dailyLimit = 8;
    
    vector<int> currentTopoOrder;
    vector<int> currentGreedyOrder;
    vector<int> currentDPAllocation;

    cout << "Welcome to SmartPrep Schedular!\n";
    cout << "Please configure your maximum daily study limit (hours): ";
    if (!(cin >> dailyLimit) || dailyLimit <= 0) {
        cout << "Invalid input. Defaulting to 8 hours/day.\n";
        cin.clear();
        cin.ignore(numeric_limits<streamsize>::max(), '\n');
        dailyLimit = 8;
    }

    int choice = -1;
    while (choice != 0) {
        printMenu();
        if (!(cin >> choice)) {
            cin.clear();
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "\n[ERROR] Invalid choice. Please enter a number.\n";
            continue;
        }

        switch (choice) {
            case 1: {
                inputSubjects(subjects);
                break;
            }
            case 2: {
                if (subjects.empty()) {
                    cout << "\n[INFO] Please add subjects first.\n";
                    break;
                }
                Graph g(subjects.size());
                g.buildGraph(subjects);
                currentTopoOrder = g.topologicalSort();
                
                if (!currentTopoOrder.empty()) {
                    cout << "\n[SUCCESS] Prerequisites Validated (No Cycles).\n";
                    cout << "Topological Study Order:\n";
                    for (size_t i = 0; i < currentTopoOrder.size(); ++i) {
                        cout << i + 1 << ". " << subjects[currentTopoOrder[i]].name << "\n";
                    }
                }
                break;
            }
            case 3: {
                if (subjects.empty()) {
                    cout << "\n[INFO] Please add subjects first.\n";
                    break;
                }
                Graph g(subjects.size());
                g.buildGraph(subjects);
                currentTopoOrder = g.topologicalSort();
                
                if (currentTopoOrder.empty()) {
                    cout << "\n[ERROR] Cannot generate schedule due to cyclical prerequisites.\n";
                    break;
                }
                
                cout << "\n---> Applying Greedy Strategy...\n";
                currentGreedyOrder = greedySchedule(currentTopoOrder, subjects);
                
                cout << "\n---> Optimizing Allocation constraints over " << dailyLimit << "hrs limits (DP)...\n";
                DPOptimizer dp;
                currentDPAllocation = dp.allocateStudyHours(currentGreedyOrder, subjects, dailyLimit);
                break;
            }
            case 4: {
                if (currentGreedyOrder.empty() || currentDPAllocation.empty()) {
                    cout << "\n[INFO] Generates today's schedule first (Option 3) before providing feedback.\n";
                    break;
                }
                FeedbackSystem fb;
                fb.processFeedback(subjects, currentGreedyOrder, currentDPAllocation, dailyLimit);
                
                // Clear the old allocations to force a re-generation next day
                currentGreedyOrder.clear(); 
                currentDPAllocation.clear();
                break;
            }
            case 5: {
                if (subjects.empty()) {
                    cout << "\n[INFO] Please add subjects first.\n";
                    break;
                }
                RiskDetector rd;
                rd.printRiskReport(subjects, dailyLimit);
                break;
            }
            case 6: {
                displaySubjects(subjects);
                break;
            }
            case 7: {
                if (subjects.empty()) {
                    cout << "\n[INFO] Please add subjects first.\n";
                    break;
                }
                Graph g(subjects.size());
                g.buildGraph(subjects);
                currentTopoOrder = g.topologicalSort();
                
                if (currentTopoOrder.empty()) {
                    cout << "\n[ERROR] Cannot generate multi-day schedule due to cyclical prerequisites.\n";
                    break;
                }
                
                DPOptimizer dp;
                dp.generateMultiDayPlan(currentTopoOrder, subjects, dailyLimit);
                break;
            }
            case 0: {
                cout << "\nExiting SmartPrep Scheduler. Keep learning!\n\n";
                break;
            }
            default: {
                cout << "\n[ERROR] Invalid menu option.\n";
                break;
            }
        }
    }
    
    return 0;
}
