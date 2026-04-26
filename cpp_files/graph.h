#ifndef GRAPH_H
#define GRAPH_H

#include <vector>
#include "subject.h"

class Graph {
private:
    int numVertices;
    std::vector<std::vector<int>> adjList;

    // Helper for DFS-based cycle detection
    bool dfsCycleCheck(int v, std::vector<bool>& visited, std::vector<bool>& recStack);

public:
    // Constructor
    Graph(int n);
    
    // 1. Builds the directed adjacency list from subject prerequisites
    void buildGraph(const std::vector<Subject>& subjects);
    
    // 2. Checks for circular prerequisites (cycles) using DFS
    bool hasCycle();
    
    // 3. Performs Topological Sort (Kahn's Algorithm) to find a valid study order
    std::vector<int> topologicalSort();
};

#endif
