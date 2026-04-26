#ifndef RISK_H
#define RISK_H

#include <vector>
#include "subject.h"

// Dedicated module to assess global study risk levels per subject.
class RiskDetector {
public:
    // Computes and prints a comprehensive risk table summarizing remaining 
    // work, safety buffers against hard limits, and categorization.
    void printRiskReport(const std::vector<Subject>& subjects, int dailyStudyLimit);
};

#endif
