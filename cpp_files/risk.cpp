#include "risk.h"
#include <iostream>
#include <iomanip>
#include <string>

using namespace std;

void RiskDetector::printRiskReport(const vector<Subject>& subjects, int dailyStudyLimit) {
    cout << "\n=========================================================================================\n";
    cout << "                             Subject Risk Analysis Report                                    \n";
    cout << "=========================================================================================\n";
    cout << left << setw(20) << "Subject" 
         << setw(15) << "Rem. Hours" 
         << setw(15) << "Avail. Days" 
         << setw(18) << "Min Daily Hrs"
         << "Risk Level\n";
    cout << "-----------------------------------------------------------------------------------------\n";

    for (const auto& s : subjects) {
        int remHours = s.requiredHours - s.completedHours;
        
        string nameTrunc = s.name.length() > 18 ? s.name.substr(0, 15) + "..." : s.name;

        // Fully prepared subject
        if (remHours <= 0) {
            cout << left << setw(20) << nameTrunc 
                 << setw(15) << 0 
                 << setw(15) << s.examDeadline 
                 << setw(18) << "0.00"
                 << "COMPLETED\n";
            continue;
        }

        int availableDays = s.examDeadline;

        // Deadline has passed but subject still needs work
        if (availableDays <= 0) {
            cout << left << setw(20) << nameTrunc 
                 << setw(15) << remHours 
                 << setw(15) << availableDays 
                 << setw(18) << "N/A"
                 << "FAILED (Missed Deadline)\n";
            continue;
        }

        // Standard Assessment
        int maxPossibleHours = availableDays * dailyStudyLimit;
        double minDailyHrs = (double)remHours / availableDays;
        
        string riskLevel;
        if (remHours > maxPossibleHours) {
            riskLevel = "HIGH RISK";
        } else if (remHours > 0.75 * maxPossibleHours) {
            riskLevel = "MEDIUM RISK";
        } else {
            riskLevel = "ON TRACK";
        }

        cout << left << setw(20) << nameTrunc
             << setw(15) << remHours 
             << setw(15) << availableDays 
             << fixed << setprecision(2) << setw(18) << minDailyHrs 
             << riskLevel << "\n";
    }
    cout << "=========================================================================================\n";
}
