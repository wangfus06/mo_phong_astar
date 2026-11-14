#include <emscripten/bind.h>
#include <algorithm>
#include <chrono>
#include <cmath>
#include <limits>
#include <sstream>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

using emscripten::function;
using emscripten::val;

namespace {
struct Node { std::string id, name; double x = 0, y = 0; };
struct Edge { std::string id, from, to; double weight = 0; bool blocked = false; };
struct Neighbor { std::string id, edgeId; double weight = 0; };
using Clock = std::chrono::steady_clock;
constexpr double INF = std::numeric_limits<double>::infinity();

double rounded(double value, int digits = 2) {
  const double factor = std::pow(10.0, digits);
  return std::round(value * factor) / factor;
}
std::string fixed(double value, int digits = 1) {
  std::ostringstream stream;
  stream.setf(std::ios::fixed); stream.precision(digits); stream << value;
  return stream.str();
}
std::string text(const val& value, const char* field, const std::string& fallback = "") {
  val item = value[field];
  return item.isUndefined() || item.isNull() ? fallback : item.as<std::string>();
}
std::vector<Node> readNodes(const val& graph) {
  std::vector<Node> nodes; val source = graph["nodes"];
  const unsigned count = source["length"].as<unsigned>();
  nodes.reserve(count);
  for (unsigned i = 0; i < count; ++i) {
    val item = source[i];
    nodes.push_back({text(item, "id"), text(item, "name"), item["x"].as<double>(), item["y"].as<double>()});
  }
  return nodes;
}
std::vector<Edge> readEdges(const val& graph) {
  std::vector<Edge> edges; val source = graph["edges"];
  const unsigned count = source["length"].as<unsigned>(); edges.reserve(count);
  for (unsigned i = 0; i < count; ++i) {
    val item = source[i];
    edges.push_back({text(item, "id"), text(item, "startNode"), text(item, "endNode"), item["weight"].as<double>(), item["isBlocked"].as<bool>()});
  }
  return edges;
}
val strings(const std::vector<std::string>& values) {
  val result = val::array(); for (const auto& item : values) result.call<void>("push", val(item)); return result;
}
val scoreObject(const std::vector<Node>& nodes, const std::unordered_map<std::string, double>& values, bool empty = false) {
  val result = val::object(); if (empty) return result;
  for (const auto& node : nodes) {
    auto found = values.find(node.id); result.set(node.id, found == values.end() ? val(INF) : val(found->second));
  }
  return result;
}
val parentObject(const std::vector<Node>& nodes, const std::unordered_map<std::string, std::string>& values) {
  val result = val::object();
  for (const auto& node : nodes) {
    auto found = values.find(node.id);
    if (found == values.end() || found->second.empty()) result.set(node.id, val::null());
    else result.set(node.id, val(found->second));
  }
  return result;
}
val makeStep(int number, const std::string& current, const std::vector<std::string>& open,
             const std::vector<std::string>& closed, const std::vector<Node>& nodes,
             const std::unordered_map<std::string, double>& f,
             const std::unordered_map<std::string, double>& g,
             const std::unordered_map<std::string, double>& h,
             const std::unordered_map<std::string, std::string>& parents,
             const std::string& message, const std::string& action,
             const std::string& activeEdge = "", bool bfs = false) {
  val step = val::object(); step.set("stepNumber", number);
  step.set("currentNodeId", current.empty() ? val::null() : val(current));
  step.set("openSetIds", strings(open)); step.set("closedSetIds", strings(closed));
  step.set("fScore", scoreObject(nodes, f, bfs)); step.set("gScore", scoreObject(nodes, g));
  step.set("hScore", scoreObject(nodes, h, bfs)); step.set("cameFrom", parentObject(nodes, parents));
  step.set("activeEdgeId", activeEdge.empty() ? val::null() : val(activeEdge));
  step.set("message", message); step.set("actionType", action); return step;
}
val emptyResult(const std::string& algorithm, const std::string& message) {
  val result = val::object(); result.set("algorithm", algorithm); result.set("success", false);
  result.set("path", val::array()); result.set("pathEdges", val::array()); result.set("totalCost", 0);
  result.set("hopCount", 0); result.set("visitedNodeCount", 0); result.set("expandedNodeCount", 0);
  result.set("maxFrontierSize", 0); result.set("executionTimeMs", 0); result.set("steps", val::array());
  result.set("message", message); return result;
}
val finishResult(const std::string& algorithm, bool success, const std::vector<std::string>& path,
                 const std::vector<std::string>& pathEdges, double cost, std::size_t visited,
                 int expanded, std::size_t maxFrontier, double elapsed, const val& steps,
                 const std::string& message) {
  val result = val::object(); result.set("algorithm", algorithm); result.set("success", success);
  result.set("path", strings(path)); result.set("pathEdges", strings(pathEdges));
  result.set("totalCost", rounded(cost)); result.set("hopCount", static_cast<int>(pathEdges.size()));
  result.set("visitedNodeCount", static_cast<int>(visited)); result.set("expandedNodeCount", expanded);
  result.set("maxFrontierSize", static_cast<int>(maxFrontier)); result.set("executionTimeMs", rounded(elapsed));
  result.set("steps", steps); result.set("message", message); return result;
}
std::unordered_map<std::string, Node> indexNodes(const std::vector<Node>& nodes) {
  std::unordered_map<std::string, Node> result; for (const auto& node : nodes) result[node.id] = node; return result;
}
std::vector<std::vector<Neighbor>> adjacencyFor(const std::vector<Node>& nodes, const std::vector<Edge>& edges,
                                                 std::unordered_map<std::string, std::size_t>& indices) {
  for (std::size_t i = 0; i < nodes.size(); ++i) indices[nodes[i].id] = i;
  std::vector<std::vector<Neighbor>> adjacency(nodes.size());
  for (const auto& edge : edges) if (!edge.blocked && indices.count(edge.from) && indices.count(edge.to)) {
    adjacency[indices[edge.from]].push_back({edge.to, edge.id, edge.weight});
    adjacency[indices[edge.to]].push_back({edge.from, edge.id, edge.weight});
  }
  return adjacency;
}
double heuristic(const Node& node, const Node& goal, const std::string& type, double multiplier) {
  if (type == "dijkstra") return 0;
  const double dx = std::abs(node.x - goal.x), dy = std::abs(node.y - goal.y);
  double value = std::sqrt(dx * dx + dy * dy);
  if (type == "manhattan") value = dx + dy;
  if (type == "chebyshev") value = std::max(dx, dy);
  return rounded(value * multiplier);
}
std::vector<std::string> orderedSetWithout(const std::vector<std::string>& source, const std::string& removed) {
  std::vector<std::string> result;
  for (const auto& item : source) if (item != removed) result.push_back(item);
  return result;
}
}

val solveAStar(const val& graph, const std::string& startId, const std::string& goalId,
               const std::string& heuristicType, double multiplier) {
  const auto started = Clock::now(); const auto nodes = readNodes(graph); const auto edges = readEdges(graph);
  const auto nodeMap = indexNodes(nodes); const auto start = nodeMap.find(startId), goal = nodeMap.find(goalId);
  val steps = val::array();
  if (start == nodeMap.end() || goal == nodeMap.end()) return emptyResult("astar", "Điểm bắt đầu hoặc điểm đích không hợp lệ.");
  if (startId == goalId) {
    std::unordered_map<std::string, double> zero{{startId, 0}};
    std::unordered_map<std::string, std::string> parents;
    steps.call<void>("push", makeStep(1, startId, {startId}, {}, nodes, zero, zero, zero, parents,
      "Điểm bắt đầu \"" + start->second.name + "\" trùng với điểm đích. Chi phí di chuyển bằng 0.", "already_at_goal"));
    return finishResult("astar", true, {startId}, {}, 0, 1, 1, 1,
      std::chrono::duration<double, std::milli>(Clock::now() - started).count(), steps,
      "Điểm bắt đầu trùng điểm đích (Chi phí = 0).");
  }
  std::unordered_map<std::string, std::size_t> indices; const auto adjacency = adjacencyFor(nodes, edges, indices);
  std::unordered_map<std::string, double> g, f, h;
  std::unordered_map<std::string, std::string> parents, parentEdges;
  for (const auto& node : nodes) { g[node.id] = INF; h[node.id] = heuristic(node, goal->second, heuristicType, multiplier); f[node.id] = INF; }
  g[startId] = 0; f[startId] = h[startId];
  std::vector<std::string> open{startId}, closed; std::unordered_set<std::string> closedSet;
  std::size_t maxFrontier = 1; int expanded = 0, stepNumber = 1; bool reached = false;
  steps.call<void>("push", makeStep(stepNumber++, "", open, closed, nodes, f, g, h, parents,
    "Khởi tạo thuật toán A*. Đưa nút xuất phát [" + start->second.name + "] vào OpenSet với g=0, h=" + fixed(h[startId]) + ", f=" + fixed(f[startId]) + ".", "start"));
  while (!open.empty()) {
    maxFrontier = std::max(maxFrontier, open.size());
    std::size_t best = 0;
    for (std::size_t i = 1; i < open.size(); ++i)
      if (f[open[i]] < f[open[best]] || (f[open[i]] == f[open[best]] && h[open[i]] < h[open[best]])) best = i;
    const std::string current = open[best]; ++expanded;
    if (current == goalId) {
      reached = true; open.erase(open.begin() + best); closed.push_back(current); closedSet.insert(current);
      steps.call<void>("push", makeStep(stepNumber++, current, open, closed, nodes, f, g, h, parents,
        "Đã tìm thấy điểm đích [" + goal->second.name + "]! Tổng chi phí g(n) = " + fixed(g[goalId]) + ". Tiến hành truy vết đường đi.", "found_goal"));
      break;
    }
    open.erase(open.begin() + best); closed.push_back(current); closedSet.insert(current);
    steps.call<void>("push", makeStep(stepNumber++, current, open, closed, nodes, f, g, h, parents,
      "Mở rộng nút [" + nodeMap.at(current).name + "] (f=" + fixed(f[current]) + ", g=" + fixed(g[current]) + ", h=" + fixed(h[current]) + "). Duyệt các nút lân cận.", "expand"));
    for (const auto& neighbor : adjacency[indices[current]]) {
      if (closedSet.count(neighbor.id)) continue;
      const double tentative = g[current] + neighbor.weight;
      if (tentative < g[neighbor.id]) {
        parents[neighbor.id] = current; parentEdges[neighbor.id] = neighbor.edgeId;
        g[neighbor.id] = rounded(tentative); f[neighbor.id] = rounded(tentative + h[neighbor.id]);
        const bool isNew = std::find(open.begin(), open.end(), neighbor.id) == open.end();
        if (isNew) open.push_back(neighbor.id);
        steps.call<void>("push", makeStep(stepNumber++, current, open, closed, nodes, f, g, h, parents,
          std::string(isNew ? "Thêm" : "Cập nhật") + " nút lân cận [" + nodeMap.at(neighbor.id).name + "] qua cạnh trọng số " + fixed(neighbor.weight) + ": g=" + fixed(g[neighbor.id]) + ", f=" + fixed(f[neighbor.id]) + ".", "evaluate_neighbor", neighbor.edgeId));
      }
    }
  }
  const double elapsed = std::chrono::duration<double, std::milli>(Clock::now() - started).count();
  if (!reached) {
    steps.call<void>("push", makeStep(stepNumber++, "", {}, closed, nodes, f, g, h, parents,
      "OpenSet trống. Không tìm thấy đường đi từ [" + start->second.name + "] tới [" + goal->second.name + "] (Các tuyến khả dụng đều bị chặn hoặc không có kết nối).", "no_path"));
    return finishResult("astar", false, {}, {}, 0, closed.size(), expanded, maxFrontier, elapsed, steps,
      "Không tìm thấy đường đi từ \"" + start->second.name + "\" đến \"" + goal->second.name + "\".");
  }
  std::vector<std::string> path, pathEdges; std::string current = goalId;
  while (!current.empty()) {
    path.insert(path.begin(), current); auto edge = parentEdges.find(current);
    if (edge != parentEdges.end()) pathEdges.insert(pathEdges.begin(), edge->second);
    auto parent = parents.find(current); current = parent == parents.end() ? "" : parent->second;
  }
  return finishResult("astar", true, path, pathEdges, g[goalId], closed.size(), expanded, maxFrontier, elapsed, steps,
    "Tìm thấy đường đi tối ưu với chi phí " + fixed(g[goalId]) + " qua " + std::to_string(path.size()) + " nút giao.");
}

val solveBFS(const val& graph, const std::string& startId, const std::string& goalId) {
  const auto started = Clock::now(); const auto nodes = readNodes(graph); const auto edges = readEdges(graph);
  const auto nodeMap = indexNodes(nodes); const auto start = nodeMap.find(startId), goal = nodeMap.find(goalId);
  val steps = val::array();
  if (start == nodeMap.end() || goal == nodeMap.end()) return emptyResult("bfs", "Điểm bắt đầu hoặc điểm đích không hợp lệ.");
  if (startId == goalId) {
    std::unordered_map<std::string, double> zero{{startId, 0}}; std::unordered_map<std::string, std::string> parents;
    steps.call<void>("push", makeStep(1, startId, {startId}, {}, nodes, {}, zero, {}, parents,
      "Điểm bắt đầu \"" + start->second.name + "\" trùng với điểm đích. Chi phí bằng 0.", "already_at_goal", "", true));
    return finishResult("bfs", true, {startId}, {}, 0, 1, 1, 1,
      std::chrono::duration<double, std::milli>(Clock::now() - started).count(), steps,
      "Điểm bắt đầu trùng điểm đích (Chi phí = 0).");
  }
  std::unordered_map<std::string, std::size_t> indices; const auto adjacency = adjacencyFor(nodes, edges, indices);
  std::vector<std::string> queue{startId}, visited{startId}; std::unordered_set<std::string> seen{startId};
  std::unordered_map<std::string, std::string> parents, parentEdges; std::unordered_map<std::string, double> g;
  for (const auto& node : nodes) g[node.id] = INF; g[startId] = 0;
  std::size_t maxFrontier = 1; int expanded = 0, stepNumber = 1; bool reached = false;
  steps.call<void>("push", makeStep(stepNumber++, "", queue, {}, nodes, {}, g, {}, parents,
    "Khởi tạo thuật toán BFS. Đưa nút xuất phát [" + start->second.name + "] vào hàng đợi (FIFO).", "start", "", true));
  std::size_t head = 0;
  while (head < queue.size()) {
    maxFrontier = std::max(maxFrontier, queue.size() - head);
    const std::string current = queue[head++]; ++expanded;
    std::vector<std::string> pending(queue.begin() + head, queue.end());
    if (current == goalId) {
      reached = true;
      steps.call<void>("push", makeStep(stepNumber++, current, pending, visited, nodes, {}, g, {}, parents,
        "BFS đã chạm tới điểm đích [" + goal->second.name + "]! Tiến hành truy vết đường đi ít cạnh nhất.", "found_goal", "", true));
      break;
    }
    steps.call<void>("push", makeStep(stepNumber++, current, pending, visited, nodes, {}, g, {}, parents,
      "BFS lấy nút [" + nodeMap.at(current).name + "] ra khỏi hàng đợi. Khám phá các nút lân cận theo mức.", "expand", "", true));
    for (const auto& neighbor : adjacency[indices[current]]) {
      if (seen.count(neighbor.id)) continue;
      seen.insert(neighbor.id); visited.push_back(neighbor.id); parents[neighbor.id] = current;
      parentEdges[neighbor.id] = neighbor.edgeId; g[neighbor.id] = g[current] + neighbor.weight; queue.push_back(neighbor.id);
      pending.assign(queue.begin() + head, queue.end());
      steps.call<void>("push", makeStep(stepNumber++, current, pending, visited, nodes, {}, g, {}, parents,
        "BFS duyệt thấy [" + nodeMap.at(neighbor.id).name + "] (mức mới), đưa vào cuối hàng đợi.", "evaluate_neighbor", neighbor.edgeId, true));
      if (neighbor.id == goalId) {
        reached = true;
        steps.call<void>("push", makeStep(stepNumber++, goalId, pending, visited, nodes, {}, g, {}, parents,
          "BFS đã tìm thấy đích [" + goal->second.name + "] ở mức duyệt hiện tại.", "found_goal", "", true));
        break;
      }
    }
    if (reached) break;
  }
  const double elapsed = std::chrono::duration<double, std::milli>(Clock::now() - started).count();
  if (!reached) {
    steps.call<void>("push", makeStep(stepNumber++, "", {}, visited, nodes, {}, g, {}, parents,
      "Hàng đợi BFS trống. Không tìm thấy đường đi từ [" + start->second.name + "] đến [" + goal->second.name + "].", "no_path", "", true));
    return finishResult("bfs", false, {}, {}, 0, visited.size(), expanded, maxFrontier, elapsed, steps,
      "BFS không tìm thấy đường đi từ \"" + start->second.name + "\" đến \"" + goal->second.name + "\".");
  }
  std::vector<std::string> path, pathEdges; std::string current = goalId; double cost = 0;
  while (!current.empty()) {
    path.insert(path.begin(), current); auto edge = parentEdges.find(current);
    if (edge != parentEdges.end()) {
      pathEdges.insert(pathEdges.begin(), edge->second);
      auto found = std::find_if(edges.begin(), edges.end(), [&](const Edge& item) { return item.id == edge->second; });
      if (found != edges.end()) cost += found->weight;
    }
    auto parent = parents.find(current); current = parent == parents.end() ? "" : parent->second;
  }
  return finishResult("bfs", true, path, pathEdges, cost, visited.size(), expanded, maxFrontier, elapsed, steps,
    "BFS tìm thấy đường đi với " + std::to_string(pathEdges.size()) + " bước (Tổng trọng số: " + fixed(cost) + ").");
}

EMSCRIPTEN_BINDINGS(pathfinding_module) {
  function("solveAStar", &solveAStar);
  function("solveBFS", &solveBFS);
}
