"""A* and breadth-first search implementations used by the browser UI."""

from __future__ import annotations

import json
from math import hypot, inf
from time import perf_counter


def _round(value: float, digits: int = 2) -> float:
    return float(f"{value:.{digits}f}")


def _fixed(value: float, digits: int = 1) -> str:
    return f"{value:.{digits}f}"


def _result(algorithm, success, path, path_edges, cost, visited, expanded,
            max_frontier, elapsed, steps, message):
    return {
        "algorithm": algorithm,
        "success": success,
        "path": path,
        "pathEdges": path_edges,
        "totalCost": _round(cost),
        "hopCount": len(path_edges),
        "visitedNodeCount": visited,
        "expandedNodeCount": expanded,
        "maxFrontierSize": max_frontier,
        "executionTimeMs": _round(elapsed),
        "steps": steps,
        "message": message,
    }


def _empty_result(algorithm, message):
    return _result(algorithm, False, [], [], 0, 0, 0, 0, 0, [], message)


def _step(number, current, opened, closed, nodes, f_score, g_score,
          h_score, parents, message, action, active_edge=None, bfs=False):
    return {
        "stepNumber": number,
        "currentNodeId": current,
        "openSetIds": list(opened),
        "closedSetIds": list(closed),
        "fScore": {} if bfs else dict(f_score),
        "gScore": dict(g_score),
        "hScore": {} if bfs else dict(h_score),
        "cameFrom": dict(parents),
        "activeEdgeId": active_edge,
        "message": message,
        "actionType": action,
    }


def _adjacency(nodes, edges):
    node_ids = {node["id"] for node in nodes}
    result = {node["id"]: [] for node in nodes}
    for edge in edges:
        if edge.get("isBlocked"):
            continue
        start, end = edge.get("startNode"), edge.get("endNode")
        if start in node_ids and end in node_ids:
            neighbor = {"id": end, "edgeId": edge["id"], "weight": edge["weight"]}
            result[start].append(neighbor)
            result[end].append({"id": start, "edgeId": edge["id"], "weight": edge["weight"]})
    return result


def _heuristic(node, goal, kind, multiplier):
    if kind == "dijkstra":
        return 0
    dx, dy = abs(node["x"] - goal["x"]), abs(node["y"] - goal["y"])
    if kind == "manhattan":
        distance = dx + dy
    elif kind == "chebyshev":
        distance = max(dx, dy)
    else:
        distance = hypot(dx, dy)
    return _round(distance * multiplier)


def solve_astar(payload):
    started = perf_counter()
    graph = payload["graph"]
    nodes, edges = graph.get("nodes", []), graph.get("edges", [])
    start_id, goal_id = payload["startNodeId"], payload["goalNodeId"]
    node_map = {node["id"]: node for node in nodes}
    start, goal = node_map.get(start_id), node_map.get(goal_id)
    if start is None or goal is None:
        return _empty_result("astar", "Điểm bắt đầu hoặc điểm đích không hợp lệ.")

    steps = []
    if start_id == goal_id:
        zero = {start_id: 0}
        steps.append(_step(
            1, start_id, [start_id], [], nodes, zero, zero, zero, {start_id: None},
            f'Điểm bắt đầu "{start["name"]}" trùng với điểm đích. Chi phí di chuyển bằng 0.',
            "already_at_goal",
        ))
        elapsed = (perf_counter() - started) * 1000
        return _result("astar", True, [start_id], [], 0, 1, 1, 1, elapsed, steps,
                       "Điểm bắt đầu trùng điểm đích (Chi phí = 0).")

    adjacency = _adjacency(nodes, edges)
    heuristic_type = payload.get("heuristic", "euclidean")
    multiplier = payload.get("multiplier", 1.0)
    g_score = {node["id"]: inf for node in nodes}
    h_score = {node["id"]: _heuristic(node, goal, heuristic_type, multiplier) for node in nodes}
    f_score = {node["id"]: inf for node in nodes}
    parents = {node["id"]: None for node in nodes}
    parent_edges = {}
    g_score[start_id] = 0
    f_score[start_id] = h_score[start_id]
    opened, closed = [start_id], []
    closed_set = set()
    max_frontier, expanded, step_number = 1, 0, 1
    steps.append(_step(
        step_number, None, opened, closed, nodes, f_score, g_score, h_score, parents,
        f"Khởi tạo thuật toán A*. Đưa nút xuất phát [{start['name']}] vào OpenSet với "
        f"g=0, h={_fixed(h_score[start_id])}, f={_fixed(f_score[start_id])}.", "start",
    ))
    step_number += 1
    reached = False

    while opened:
        max_frontier = max(max_frontier, len(opened))
        current = min(opened, key=lambda item: (f_score[item], h_score[item]))
        expanded += 1
        if current == goal_id:
            opened.remove(current)
            closed.append(current)
            closed_set.add(current)
            steps.append(_step(
                step_number, current, opened, closed, nodes, f_score, g_score, h_score, parents,
                f"Đã tìm thấy điểm đích [{goal['name']}]! Tổng chi phí g(n) = "
                f"{_fixed(g_score[goal_id])}. Tiến hành truy vết đường đi.", "found_goal",
            ))
            step_number += 1
            reached = True
            break

        opened.remove(current)
        closed.append(current)
        closed_set.add(current)
        steps.append(_step(
            step_number, current, opened, closed, nodes, f_score, g_score, h_score, parents,
            f"Mở rộng nút [{node_map[current]['name']}] (f={_fixed(f_score[current])}, "
            f"g={_fixed(g_score[current])}, h={_fixed(h_score[current])}). Duyệt các nút lân cận.",
            "expand",
        ))
        step_number += 1

        for neighbor in adjacency[current]:
            neighbor_id = neighbor["id"]
            if neighbor_id in closed_set:
                continue
            tentative = g_score[current] + neighbor["weight"]
            if tentative < g_score[neighbor_id]:
                parents[neighbor_id] = current
                parent_edges[neighbor_id] = neighbor["edgeId"]
                g_score[neighbor_id] = _round(tentative)
                f_score[neighbor_id] = _round(tentative + h_score[neighbor_id])
                is_new = neighbor_id not in opened
                if is_new:
                    opened.append(neighbor_id)
                verb = "Thêm" if is_new else "Cập nhật"
                steps.append(_step(
                    step_number, current, opened, closed, nodes, f_score, g_score, h_score, parents,
                    f"{verb} nút lân cận [{node_map[neighbor_id]['name']}] qua cạnh trọng số "
                    f"{_fixed(neighbor['weight'])}: g={_fixed(g_score[neighbor_id])}, "
                    f"f={_fixed(f_score[neighbor_id])}.", "evaluate_neighbor", neighbor["edgeId"],
                ))
                step_number += 1

    elapsed = (perf_counter() - started) * 1000
    if not reached:
        steps.append(_step(
            step_number, None, [], closed, nodes, f_score, g_score, h_score, parents,
            f"OpenSet trống. Không tìm thấy đường đi từ [{start['name']}] tới [{goal['name']}] "
            "(Các tuyến khả dụng đều bị chặn hoặc không có kết nối).", "no_path",
        ))
        return _result("astar", False, [], [], 0, len(closed), expanded, max_frontier,
                       elapsed, steps, f'Không tìm thấy đường đi từ "{start["name"]}" đến "{goal["name"]}".')

    path, path_edges, current = [], [], goal_id
    while current is not None:
        path.insert(0, current)
        if current in parent_edges:
            path_edges.insert(0, parent_edges[current])
        current = parents[current]
    return _result(
        "astar", True, path, path_edges, g_score[goal_id], len(closed), expanded, max_frontier,
        elapsed, steps, f"Tìm thấy đường đi tối ưu với chi phí {_fixed(g_score[goal_id])} qua {len(path)} nút giao.",
    )


def solve_bfs(payload):
    started = perf_counter()
    graph = payload["graph"]
    nodes, edges = graph.get("nodes", []), graph.get("edges", [])
    start_id, goal_id = payload["startNodeId"], payload["goalNodeId"]
    node_map = {node["id"]: node for node in nodes}
    start, goal = node_map.get(start_id), node_map.get(goal_id)
    if start is None or goal is None:
        return _empty_result("bfs", "Điểm bắt đầu hoặc điểm đích không hợp lệ.")

    steps = []
    if start_id == goal_id:
        steps.append(_step(
            1, start_id, [start_id], [], nodes, {}, {start_id: 0}, {}, {start_id: None},
            f'Điểm bắt đầu "{start["name"]}" trùng với điểm đích. Chi phí bằng 0.',
            "already_at_goal", bfs=True,
        ))
        elapsed = (perf_counter() - started) * 1000
        return _result("bfs", True, [start_id], [], 0, 1, 1, 1, elapsed, steps,
                       "Điểm bắt đầu trùng điểm đích (Chi phí = 0).")

    adjacency = _adjacency(nodes, edges)
    queue, visited, seen = [start_id], [start_id], {start_id}
    parents = {node["id"]: None for node in nodes}
    parent_edges = {}
    g_score = {node["id"]: inf for node in nodes}
    g_score[start_id] = 0
    max_frontier, expanded, step_number = 1, 0, 1
    steps.append(_step(
        step_number, None, queue, [], nodes, {}, g_score, {}, parents,
        f"Khởi tạo thuật toán BFS. Đưa nút xuất phát [{start['name']}] vào hàng đợi (FIFO).",
        "start", bfs=True,
    ))
    step_number += 1
    head, reached = 0, False

    while head < len(queue):
        max_frontier = max(max_frontier, len(queue) - head)
        current = queue[head]
        head += 1
        expanded += 1
        pending = queue[head:]
        if current == goal_id:
            steps.append(_step(
                step_number, current, pending, visited, nodes, {}, g_score, {}, parents,
                f"BFS đã chạm tới điểm đích [{goal['name']}]! Tiến hành truy vết đường đi ít cạnh nhất.",
                "found_goal", bfs=True,
            ))
            step_number += 1
            reached = True
            break

        steps.append(_step(
            step_number, current, pending, visited, nodes, {}, g_score, {}, parents,
            f"BFS lấy nút [{node_map[current]['name']}] ra khỏi hàng đợi. Khám phá các nút lân cận theo mức.",
            "expand", bfs=True,
        ))
        step_number += 1
        for neighbor in adjacency[current]:
            neighbor_id = neighbor["id"]
            if neighbor_id in seen:
                continue
            seen.add(neighbor_id)
            visited.append(neighbor_id)
            parents[neighbor_id] = current
            parent_edges[neighbor_id] = neighbor["edgeId"]
            g_score[neighbor_id] = g_score[current] + neighbor["weight"]
            queue.append(neighbor_id)
            pending = queue[head:]
            steps.append(_step(
                step_number, current, pending, visited, nodes, {}, g_score, {}, parents,
                f"BFS duyệt thấy [{node_map[neighbor_id]['name']}] (mức mới), đưa vào cuối hàng đợi.",
                "evaluate_neighbor", neighbor["edgeId"], bfs=True,
            ))
            step_number += 1
            if neighbor_id == goal_id:
                steps.append(_step(
                    step_number, goal_id, pending, visited, nodes, {}, g_score, {}, parents,
                    f"BFS đã tìm thấy đích [{goal['name']}] ở mức duyệt hiện tại.", "found_goal", bfs=True,
                ))
                step_number += 1
                reached = True
                break
        if reached:
            break

    elapsed = (perf_counter() - started) * 1000
    if not reached:
        steps.append(_step(
            step_number, None, [], visited, nodes, {}, g_score, {}, parents,
            f"Hàng đợi BFS trống. Không tìm thấy đường đi từ [{start['name']}] đến [{goal['name']}].",
            "no_path", bfs=True,
        ))
        return _result("bfs", False, [], [], 0, len(visited), expanded, max_frontier, elapsed,
                       steps, f'BFS không tìm thấy đường đi từ "{start["name"]}" đến "{goal["name"]}".')

    path, path_edges, current, cost = [], [], goal_id, 0
    edge_map = {edge["id"]: edge for edge in edges}
    while current is not None:
        path.insert(0, current)
        if current in parent_edges:
            edge_id = parent_edges[current]
            path_edges.insert(0, edge_id)
            cost += edge_map[edge_id]["weight"]
        current = parents[current]
    return _result(
        "bfs", True, path, path_edges, cost, len(visited), expanded, max_frontier, elapsed,
        steps, f"BFS tìm thấy đường đi với {len(path_edges)} bước (Tổng trọng số: {_fixed(cost)}).",
    )


def solve_astar_json(payload_json):
    return solve_astar(json.loads(payload_json))


def solve_bfs_json(payload_json):
    return solve_bfs(json.loads(payload_json))
