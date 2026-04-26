#include <iostream>
#include <vector>
#include <string>
#include <sstream>
#include "subject.h"
#include "graph.h"
#include "scheduler.h"
#include "dp.h"
#include "feedback.h"
#include "risk.h"

using namespace std;

// Helper function to print test results cleanly
void printTestResult(int testNum, const string& desc, bool passed, const string& details = "") {
    cout << "Test " << testNum << ": " << desc << " -> ";
    if (passed) {
        cout << "[PASS]";
    } else {
        cout << "[FAIL]";
    }
    if (!details.empty()) {
        cout << " | " << details;
    }
    cout << "\n";
}

void testCycleDetection() {
    vector<Subject> subjects = {
        {"A",  10, 3, 5, 0, {1}}, // A depends on B
        {"B",  10, 3, 5, 0, {0}}  // B depends on A
    };
    Graph g(2);
    g.buildGraph(subjects);
    
    // Catch standard error stream
    ostringstream cerrMock;
    streambuf* oldCerr = cerr.rdbuf(cerrMock.rdbuf());
    
    vector<int> topo = g.topologicalSort();
    
    cerr.rdbuf(oldCerr);
    
    bool passed = topo.empty() && cerrMock.str().find("Cycle detected") != string::npos;
    printTestResult(1, "Cycle Detection (Graph Error)", passed, "Expected empty topological array & logged cycle alert.");
}

void testTopologicalSort() {
    vector<Subject> subjects = {
        {"A", 10, 3, 5, 0, {}},    // idx 0
        {"B", 10, 3, 5, 0, {0}},   // idx 1 (A)
        {"C", 10, 3, 5, 0, {1}},   // idx 2 (B)
        {"D", 10, 3, 5, 0, {2}}    // idx 3 (C)
    };
    Graph g(4);
    g.buildGraph(subjects);
    vector<int> topo = g.topologicalSort();
    
    bool passed = (topo.size() == 4) && (topo[0] == 0) && (topo[1] == 1) && (topo[2] == 2) && (topo[3] == 3);
    string orderStr = "";
    for(int idx : topo) orderStr += to_string(idx) + " ";
    printTestResult(2, "Valid Topological Sort (Linear)", passed, passed ? "Matched exactly" : "Actual: " + orderStr);
}

void testGreedySort() {
    vector<Subject> subjects = {
        {"T1", 5, 2, 5, 0, {}}, // Deadline 5
        {"T2", 2, 4, 5, 0, {}}, // Deadline 2, Diff 4
        {"T3", 2, 5, 5, 0, {}}  // Deadline 2, Diff 5
    };
    vector<int> topo = {0, 1, 2}; // Independent subjects
    vector<int> greedy = greedySchedule(topo, subjects, true); // true = silent trace
    
    // T3 has earlier deadline than T1, and higher difficulty than T2.
    // Expected greedy order: 2 (T3), 1 (T2), 0 (T1)
    bool passed = (greedy.size() == 3) && (greedy[0] == 2) && (greedy[1] == 1) && (greedy[2] == 0);
    printTestResult(3, "Greedy Sort (Priority Multi-Key)", passed, passed ? "Prioritized successfully without deps." : "Prioritization failed.");
}

void testDPAllocation() {
    vector<Subject> subjects = {
        {"S1", 1, 5, 10, 0, {}}, 
        {"S2", 2, 4, 10, 0, {}},
        {"S3", 3, 3, 10, 0, {}},
        {"S4", 4, 2, 10, 0, {}},
        {"S5", 5, 1, 10, 0, {}}
    };
    vector<int> topo = {0, 1, 2, 3, 4};
    int limit = 8;
    
    DPOptimizer dp;
    vector<int> alloc = dp.allocateStudyHours(topo, subjects, limit, true);
    
    int sum = 0;
    bool passed = true;
    for (int h : alloc) {
        sum += h;
        if (h > limit) passed = false;
    }
    if (sum > limit) passed = false;
    
    printTestResult(4, "DP Allocation Limitations (8-hour cap)", passed, "Allocated mathematically within parameters: total " + to_string(sum) + " <= " + to_string(limit));
}

void testRiskDetection() {
    vector<Subject> subjects = {
        {"Doomed", 2, 5, 20, 0, {}} // Deadline 2. Limit 8. Max is 16. Needs 20. Impossible.
    };
    
    ostringstream coutMock;
    streambuf* oldCout = cout.rdbuf(coutMock.rdbuf());
    
    RiskDetector rd;
    rd.printRiskReport(subjects, 8);
    
    cout.rdbuf(oldCout);
    
    string out = coutMock.str();
    bool passed = out.find("HIGH RISK") != string::npos;
    printTestResult(5, "Risk Detection Matrices", passed, passed ? "Calculated impossible deficit safely." : "Failed to catch mathematical impossibility.");
}

void testAdaptiveFeedback() {
    vector<Subject> subjects = {
        {"FixMe", 5, 3, 10, 0, {}}  
    };
    // Feedback inputs
    istringstream cinMock("0\n"); 
    streambuf* oldCin = cin.rdbuf(cinMock.rdbuf());
    ostringstream coutMock;
    streambuf* oldCout = cout.rdbuf(coutMock.rdbuf());
    
    FeedbackSystem fb;
    fb.processFeedback(subjects, {0}, {3}, 8); // Planned 3. Actual 0.
    
    cin.rdbuf(oldCin);
    cout.rdbuf(oldCout);
    
    string out = coutMock.str();
    // Originally required = 10, days = 5. Load = 2.0.
    // Progress loop completed = 0, delayed deadline by 1 day -> 4 available.
    // New load expected = 10 / 4 = 2.50.
    
    bool conditionsMet = false;
    if (out.find("BEHIND SCHEDULE") != string::npos && 
        out.find("2.50 hrs/day") != string::npos && 
        subjects[0].examDeadline == 4) {
        conditionsMet = true;
    }
    
    printTestResult(6, "Adaptive Feedback Distributions", conditionsMet, conditionsMet ? "Tracked deficits and rolled deadlines mathematically." : "Failure in feedback looping equations.");
}

int main() {
    cout << "=========================================\n";
    cout << "  SmartPrep Automated Algorithm Tests    \n";
    cout << "=========================================\n";
    testCycleDetection();
    testTopologicalSort();
    testGreedySort();
    testDPAllocation();
    testRiskDetection();
    testAdaptiveFeedback();
    cout << "=========================================\n";
    cout << "All automated verifications ran.\n";
    return 0;
}
