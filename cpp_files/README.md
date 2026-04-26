# SmartPrep Scheduler

SmartPrep Scheduler is an intelligent, CLI-based study planning application designed to dynamically calculate and allocate study hours across complex workloads. By seamlessly integrating prerequisite relationships and hard daily time boundaries, it prioritizes urgent, difficult subjects and generates optimal, multi-day study models to ensure students mathematically stay on track without missing critical exam deadlines.

## Modules & Algorithms Used

SmartPrep leverages specialized operations research algorithms natively built in C++:
* **Topological Sort (Kahn’s Algorithm - BFS)**: Safeguards against circular prerequisites and ensures study topics are digested in a linear, strictly valid sequence.
* **Greedy Priority Sorting**: A Dependency-Aware Insertion Sort algorithm ranks targets iteratively by weighting *Earliest Deadlines*, *Highest Difficulty*, and *Most Remaining Hours*—without ever violating prerequisite rules.
* **2D Knapsack Dynamic Programming (DP)**: Allocates fractions of remaining daily capacity towards maximizing value efficiency metrics (`difficulty * (1 / days_remaining)`), mathematically proving the best configuration hour-by-hour limits.
* **Adaptive Feedback Tracking**: Redistributes missed workloads dynamically over the remaining life of the calendar proactively adjusting expectations based on reality vs theory.
* **Risk Detection**: Projects future limits evaluating strict boundaries flagging `HIGH RISK` or `MEDIUM RISK` capacities.

## File Structure

* `main.cpp`: Central interactive terminal UI capturing user inputs and invoking module states via an infinite menu loop.
* `subject.h`: Core data structures mapping out Subject requirements, metrics, and relationships explicitly.
* `graph.h` / `graph.cpp`: Implements the directed adjacency lists detecting cycles bridging Topological Sorting vectors.
* `scheduler.h` / `scheduler.cpp`: Responsible for Greedy ordering sorting bounds respecting topological parents.
* `dp.h` / `dp.cpp`: Constructs 2D matrix evaluating and extracting optimum hourly allocations via multiple-knapsack logic.
* `feedback.h` / `feedback.cpp`: Ingests realtime logs updating parameters against actual time sunk parsing load ratios.
* `risk.h` / `risk.cpp`: Validates mathematical boundaries flagging scenarios shifting into strict mathematical impossibility alerts.
* `test.cpp`: Automated mocked suite testing bounds logic natively.

## How to Compile

The entire algorithm relies exclusively on native dependencies. You can compile via any standard `g++` console seamlessly:
```bash
g++ main.cpp graph.cpp scheduler.cpp dp.cpp feedback.cpp risk.cpp -o SmartPrep.exe
```

(Optional) Compile Automated Test CI Suite:
```bash
g++ test.cpp graph.cpp scheduler.cpp dp.cpp feedback.cpp risk.cpp -o test_suite.exe
```

## How to Run

After compilation, launch your unified menu CLI:
```bash
./SmartPrep.exe
```

### Sample Workflow
1. **Initialize Environment**: Select global rules mapping max daily workload constraints (e.g. `8` hours limit per day).
2. **Add Subjects**:
   * *Subject Name*: `Calculus`
   * *Exam Deadline*: `5`
   * *Difficulty Level*: `4`
   * *Required Hours*: `20`
   * *(Optional)* Map numerical topological prerequisite chains pointing to independent core modules.
3. **Generate Today's Optimal Schedule**: The app computes pending workloads running Kahn's validation algorithm followed by multi-fractional 2D DP optimization, emitting clear daily limits and justifications.
4. **Update Adaptive Process (End of Day)**: The application requests reality verification tracking exactly what actually occurred vs what the algorithm predicted, shifting and redistributing future target load minimum thresholds.
5. **View Global Status Reports**: Render table summaries debugging multi-day completion graphs alongside native minimum threshold Risk Alerts tracking potential deadline violations proactively.

## Team Members

| Name | ID / Role | GitHub |
| :--- | :--- | :--- |
| Ansh Gupta | Core Developer / Lead Designer | [@anshhhgupta](https://github.com/anshhhgupta) |
| Abhinav Gaur | Algorithm designer | [@anshhhgupta](https://github.com/anshhhgupta) |
| Vinayak Rawat | Algorithm Analyzer / Integrator | [@anshhhgupta](https://github.com/anshhhgupta) |
| Ananya Nautiyal | Algorithm Analyzer / Integrator | [@anshhhgupta](https://github.com/anshhhgupta) |

## Known Limitations and Future Improvements

**Current Limitations:**
- Memory constraints when testing highly expansive arrays allocating extremely wide limits stretching over massive daily caps.
- Strict linearity constraints strictly limiting schedule flexibility mapping off weekend vs weekday variability differences.
- CLI console limitations restricting graphical rendering structures formatting large scale multi-day generation loops cleanly.

**Future Improvements:**
- Back natively mapped sessions spanning cross reboot sessions using lightweight SQLite databases.
- Transform UI mappings off terminal structures securely towards graphical React web stacks processing outputs.
- Automate Feedback parameter weighting evaluating historical difficulty friction adjusting weights intelligently rather than locking variables.
