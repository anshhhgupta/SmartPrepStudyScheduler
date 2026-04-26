#include "graph.h"
#include <iostream>
#include <queue>
#include <cstdlib>

using namespace std;

Graph::Graph(int n) {
    numVertices = n;
    adjList.resize(n);
}

// 1. Build a directed adjacency list
void Graph::buildGraph(const vector<Subject>& subjects) {
    // A prerequisite relation means: prerequisite must be done BEFORE the subject.
    // So edge goes from: prerequisite -> subject
    for (int i = 0; i < subjects.size(); ++i) {
        for (int prereq : subjects[i].prerequisites) {
            adjList[prereq].push_back(i);
        }
    }
}

// Helper function for DFS-based cycle detection
bool Graph::dfsCycleCheck(int v, vector<bool>& visited, vector<bool>& recStack) {
    if (!visited[v]) {
        visited[v] = true;
        recStack[v] = true;

        for (int neighbor : adjList[v]) {
            if (!visited[neighbor] && dfsCycleCheck(neighbor, visited, recStack)) {
                return true;
            } else if (recStack[neighbor]) { // If neighbor is in the current recursion stack, there's a cycle
                return true;
            }
        }
    }
    recStack[v] = false; // Remove the vertex from recursion stack
    return false;
}

// 2. DFS-based cycle detection
bool Graph::hasCycle() {
    vector<bool> visited(numVertices, false);
    vector<bool> recStack(numVertices, false);

    for (int i = 0; i < numVertices; ++i) {
        if (!visited[i]) {
            if (dfsCycleCheck(i, visited, recStack)) {
                return true;
            }
        }
    }
    return false;
}

// 3. Kahn's Algorithm (BFS-based) for Topological Sort
vector<int> Graph::topologicalSort() {
    // If a cycle is detected, print an error and exit gracefully returning empty list
    if (hasCycle()) {
        cerr << "\n[ERROR] Cycle detected in prerequisites. Circular prerequisites are invalid.\n" << endl;
        return vector<int>(); 
    }

    vector<int> inDegree(numVertices, 0);

    // Compute in-degrees for all vertices
    for (int i = 0; i < numVertices; ++i) {
        for (int neighbor : adjList[i]) {
            inDegree[neighbor]++;
        }
    }

    queue<int> q;

    // Enqueue all vertices with 0 in-degree
    for (int i = 0; i < numVertices; ++i) {
        if (inDegree[i] == 0) {
            q.push(i);
        }
    }

    vector<int> order;

    // Process the queue
    while (!q.empty()) {
        int u = q.front();
        q.pop();
        order.push_back(u);

        // Decrease in-degree for all neighbors and push them if their in-degree becomes 0
        for (int neighbor : adjList[u]) {
            inDegree[neighbor]--;
            if (inDegree[neighbor] == 0) {
                q.push(neighbor);
            }
        }
    }

    return order;
}
