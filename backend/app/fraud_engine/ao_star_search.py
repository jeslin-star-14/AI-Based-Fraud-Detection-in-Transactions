"""
AO* (AND-OR Graph Search) Algorithm for Fraud Investigation Decomposition
Decomposes complex fraud hypotheses into AND-branches (all sub-conditions required) 
and OR-branches (alternative fraud channels), computing minimum-cost proof trees.
"""

from typing import Dict, List, Any, Optional, Set
from dataclasses import dataclass, field
import json

@dataclass
class AONode:
    id: str
    label: str
    node_type: str                  # "OR" or "AND" or "LEAF"
    cost: float = 0.0               # Current heuristic / evaluation cost
    heuristic_h: float = 0.0        # Initial heuristic estimation
    edge_cost: float = 1.0          # Cost of expanding/verifying this branch
    is_solved: bool = False         # True if terminal state proved
    is_active: bool = False         # True if part of the current optimal proof tree
    is_fraud_flagged: bool = False  # True if evidence indicates fraud
    children: List[List[str]] = field(default_factory=list) # List of hyperedges; each hyperedge is a list of child node IDs
    best_hyperedge: Optional[List[str]] = None
    evidence_payload: Optional[Dict[str, Any]] = None
    status_message: str = ""

@dataclass
class AOStarResult:
    root_id: str
    is_fraud_proved: bool
    optimal_cost: float
    proof_tree_nodes: List[Dict[str, Any]]
    proof_tree_edges: List[Dict[str, Any]]
    graph_dict: Dict[str, Any]
    traversal_log: List[str]
    explanation: str

class AOStarSearcher:
    """
    Classic AO* Search Engine for Fraud Hypothesis Verification.
    Traverses the AND-OR graph of fraud scenarios, updates heuristic costs bottom-up,
    and identifies the minimal-cost proof tree verifying the fraud verdict.
    """

    def __init__(self):
        pass

    def build_fraud_graph(self, detected_evidence_map: Dict[str, Any]) -> Dict[str, AONode]:
        """
        Builds the canonical AND-OR graph for transaction fraud detection.
        - Root: OR node ('Fraud_Detected')
          - Option 1 (OR branch): 'Visual_Forgery' (AND node)
            - Leaf: 'Font_Pixel_Tampering'
            - Leaf: 'Missing_Bank_Watermark'
          - Option 2 (OR branch): 'Reference_Spoofing' (AND node)
            - Leaf: 'UTR_Invalid_Syntax'
            - Leaf: 'Unregistered_Beneficiary_VPA'
          - Option 3 (OR branch): 'Behavioral_Outlier' (AND node)
            - Leaf: 'Amount_Outlier_Anomaly'
            - Leaf: 'Velocity_Timestamp_Anomaly'
        """
        has_tamper = "visual_tampering" in detected_evidence_map
        has_watermark_missing = "missing_watermark_elements" in detected_evidence_map
        has_utr_invalid = "utr_invalid_syntax" in detected_evidence_map
        has_beneficiary_bad = "beneficiary_mismatch" in detected_evidence_map
        has_amount_bad = "amount_anomaly" in detected_evidence_map
        has_time_bad = "time_velocity_anomaly" in detected_evidence_map
        has_dup_hash = "duplicate_receipt_hash" in detected_evidence_map

        nodes: Dict[str, AONode] = {
            # Root Goal (OR Node): Transaction is Fraudulent
            "GOAL_FRAUD": AONode(
                id="GOAL_FRAUD",
                label="Goal: Confirm Fraud in Transaction",
                node_type="OR",
                heuristic_h=5.0,
                children=[
                    ["BRANCH_VISUAL_TAMPER"],
                    ["BRANCH_REFERENCE_SPOOF"],
                    ["BRANCH_BEHAVIORAL_ANOMALY"],
                    ["LEAF_FONT_TAMPER"],
                    ["LEAF_UTR_INVALID"],
                    ["LEAF_DUPLICATE_HASH"]
                ]
            ),


            # Branch 1 (AND Node): Digital / Screenshot Tampering
            # Requires BOTH font/pixel anomaly AND missing official security badges
            "BRANCH_VISUAL_TAMPER": AONode(
                id="BRANCH_VISUAL_TAMPER",
                label="Branch: Visual Receipt Forgery (AND)",
                node_type="AND",
                heuristic_h=3.0,
                children=[
                    ["LEAF_FONT_TAMPER", "LEAF_WATERMARK_MISSING"]
                ]
            ),

            # Branch 2 (AND Node): Reference & Identity Spoofing
            # Requires BOTH UTR syntax error AND unverified beneficiary
            "BRANCH_REFERENCE_SPOOF": AONode(
                id="BRANCH_REFERENCE_SPOOF",
                label="Branch: Reference & ID Spoof (AND)",
                node_type="AND",
                heuristic_h=4.0,
                children=[
                    ["LEAF_UTR_INVALID", "LEAF_BENEFICIARY_MISMATCH"]
                ]
            ),

            # Branch 3 (AND Node): Behavioral & Financial Outlier
            # Requires BOTH Amount deviation AND abnormal execution timing
            "BRANCH_BEHAVIORAL_ANOMALY": AONode(
                id="BRANCH_BEHAVIORAL_ANOMALY",
                label="Branch: Financial Behavioral Outlier (AND)",
                node_type="AND",
                heuristic_h=4.5,
                children=[
                    ["LEAF_AMOUNT_OUTLIER", "LEAF_TIME_ANOMALY"]
                ]
            ),

            # Leaf 1: Font & Pixel Tampering
            "LEAF_FONT_TAMPER": AONode(
                id="LEAF_FONT_TAMPER",
                label="Check: Font & Pixel Artifacts",
                node_type="LEAF",
                heuristic_h=0.0,
                cost=0.5 if has_tamper else 10.0,
                is_solved=has_tamper,
                is_fraud_flagged=has_tamper,
                evidence_payload=detected_evidence_map.get("visual_tampering"),
                status_message=(
                    detected_evidence_map.get("visual_tampering", {}).get("details") 
                    or "Altered font/pixels detected (FakePay signature)"
                ) if has_tamper else "Font spacing and Laplacian variance authentic"
            ),

            # Leaf 2: Missing Watermark Elements
            "LEAF_WATERMARK_MISSING": AONode(
                id="LEAF_WATERMARK_MISSING",
                label="Check: Bank Security & Watermark",
                node_type="LEAF",
                heuristic_h=0.0,
                cost=0.5 if has_watermark_missing else 10.0,
                is_solved=has_watermark_missing,
                is_fraud_flagged=has_watermark_missing,
                evidence_payload=detected_evidence_map.get("missing_watermark_elements"),
                status_message=(
                    detected_evidence_map.get("missing_watermark_elements", {}).get("details")
                    or "Security badges missing or altered"
                ) if has_watermark_missing else "Official NPCI & bank security seal present"
            ),

            # Leaf 3: Invalid UTR
            "LEAF_UTR_INVALID": AONode(
                id="LEAF_UTR_INVALID",
                label="Check: UTR Reference Syntax",
                node_type="LEAF",
                heuristic_h=0.0,
                cost=0.4 if has_utr_invalid else 10.0,
                is_solved=has_utr_invalid,
                is_fraud_flagged=has_utr_invalid,
                evidence_payload=detected_evidence_map.get("utr_invalid_syntax"),
                status_message=(
                    detected_evidence_map.get("utr_invalid_syntax", {}).get("details")
                    or "Invalid 12-digit UTR checksum"
                ) if has_utr_invalid else "12-digit UTR numeric checksum verified"
            ),

            # Leaf 4: Beneficiary Mismatch
            "LEAF_BENEFICIARY_MISMATCH": AONode(
                id="LEAF_BENEFICIARY_MISMATCH",
                label="Check: Beneficiary VPA Verification",
                node_type="LEAF",
                heuristic_h=0.0,
                cost=0.6 if has_beneficiary_bad else 10.0,
                is_solved=has_beneficiary_bad,
                is_fraud_flagged=has_beneficiary_bad,
                evidence_payload=detected_evidence_map.get("beneficiary_mismatch"),
                status_message=(
                    detected_evidence_map.get("beneficiary_mismatch", {}).get("details")
                    or "VPA unverified or mismatched"
                ) if has_beneficiary_bad else "Beneficiary VPA verified in merchant registry"
            ),

            # Leaf 5: Amount Outlier
            "LEAF_AMOUNT_OUTLIER": AONode(
                id="LEAF_AMOUNT_OUTLIER",
                label="Check: Transaction Amount Baseline",
                node_type="LEAF",
                heuristic_h=0.0,
                cost=0.5 if has_amount_bad else 10.0,
                is_solved=has_amount_bad,
                is_fraud_flagged=has_amount_bad,
                evidence_payload=detected_evidence_map.get("amount_anomaly"),
                status_message=(
                    detected_evidence_map.get("amount_anomaly", {}).get("details")
                    or "Amount deviates from standard retail baseline"
                ) if has_amount_bad else "Amount conforms to baseline retail spending profile"
            ),

            # Leaf 6: Timestamp Velocity
            "LEAF_TIME_ANOMALY": AONode(
                id="LEAF_TIME_ANOMALY",
                label="Check: Velocity & Timestamp Window",
                node_type="LEAF",
                heuristic_h=0.0,
                cost=0.5 if has_time_bad else 10.0,
                is_solved=has_time_bad,
                is_fraud_flagged=has_time_bad,
                evidence_payload=detected_evidence_map.get("time_velocity_anomaly"),
                status_message=(
                    detected_evidence_map.get("time_velocity_anomaly", {}).get("details")
                    or "Suspicious high-velocity nocturnal burst"
                ) if has_time_bad else "Normal transaction velocity and time window"
            ),

            # Direct Leaf: Duplicate Receipt Hash
            "LEAF_DUPLICATE_HASH": AONode(
                id="LEAF_DUPLICATE_HASH",
                label="Check: Known Fraud Template Fingerprint",
                node_type="LEAF",
                heuristic_h=0.0,
                cost=0.2 if has_dup_hash else 10.0,
                is_solved=has_dup_hash,
                is_fraud_flagged=has_dup_hash,
                evidence_payload=detected_evidence_map.get("duplicate_receipt_hash"),
                status_message=(
                    detected_evidence_map.get("duplicate_receipt_hash", {}).get("details")
                    or "Matches known fake receipt template fingerprint"
                ) if has_dup_hash else "Unique receipt perceptual hash confirmed"
            )
        }

        return nodes

    def run_ao_star(self, graph: Dict[str, AONode], root_id: str = "GOAL_FRAUD") -> AOStarResult:
        """
        Executes bottom-up cost revision and marking step in AO* algorithm.
        """
        traversal_log: List[str] = []
        traversal_log.append(f"Starting AO* Search at root goal node: {root_id}")

        def evaluate_node(nid: str, visited: Set[str]) -> float:
            if nid in visited:
                return graph[nid].cost
            visited.add(nid)
            
            node = graph[nid]
            if node.node_type == "LEAF":
                traversal_log.append(f"Evaluated Leaf '{node.id}': Solved={node.is_solved}, Cost={node.cost:.2f}")
                return node.cost

            # If OR node: cost = min over all hyperedge branches
            if node.node_type == "OR":
                # First check if any branch is fully solved
                candidates = []
                for edge in node.children:
                    edge_cost = 0.0
                    edge_solved = True
                    for c_id in edge:
                        c_cost = evaluate_node(c_id, visited)
                        edge_cost += c_cost + graph[c_id].edge_cost
                        if not graph[c_id].is_solved:
                            edge_solved = False
                    candidates.append((edge, edge_cost, edge_solved))

                # Prioritize solved branches if available, else pick lowest heuristic cost
                solved_candidates = [c for c in candidates if c[2]]
                if solved_candidates:
                    best_edge, best_cost, _ = min(solved_candidates, key=lambda x: x[1])
                    node.is_solved = True
                else:
                    best_edge, best_cost, _ = min(candidates, key=lambda x: x[1])
                    node.is_solved = False

                node.cost = best_cost
                node.best_hyperedge = best_edge
                traversal_log.append(f"OR Node '{node.id}' updated: Cost={node.cost:.2f}, Solved={node.is_solved}, BestBranch={best_edge}")
                return node.cost

            # If AND node: cost = sum over all children in the hyperedge
            if node.node_type == "AND":
                best_cost = float('inf')
                best_edge = None
                is_and_solved = False

                for edge in node.children:
                    and_sum = 0.0
                    all_children_solved = True
                    for c_id in edge:
                        c_cost = evaluate_node(c_id, visited)
                        and_sum += c_cost + graph[c_id].edge_cost
                        if not graph[c_id].is_solved:
                            all_children_solved = False

                    if and_sum < best_cost:
                        best_cost = and_sum
                        best_edge = edge
                        is_and_solved = all_children_solved

                node.cost = best_cost if best_cost != float('inf') else 10.0
                node.best_hyperedge = best_edge
                node.is_solved = is_and_solved
                traversal_log.append(f"AND Node '{node.id}' updated: Cost={node.cost:.2f}, Solved={node.is_solved}, Children={best_edge}")
                return node.cost

            return node.cost

        # Run bottom-up evaluation
        visited_nodes: Set[str] = set()
        root_cost = evaluate_node(root_id, visited_nodes)

        # Trace active proof tree (minimal cost subtree)
        proof_nodes: List[Dict[str, Any]] = []
        proof_edges: List[Dict[str, Any]] = []

        active_set: Set[str] = set()
        queue = [root_id]
        
        while queue:
            curr = queue.pop(0)
            if curr in active_set or curr not in graph:
                continue
            active_set.add(curr)
            node = graph[curr]
            node.is_active = True

            proof_nodes.append({
                "id": node.id,
                "label": node.label,
                "node_type": node.node_type,
                "cost": round(node.cost, 2),
                "is_solved": node.is_solved,
                "is_fraud_flagged": node.is_fraud_flagged,
                "status_message": node.status_message
            })

            if node.best_hyperedge:
                for child_id in node.best_hyperedge:
                    proof_edges.append({
                        "from": node.id,
                        "to": child_id,
                        "type": "AND_CONNECTOR" if node.node_type == "AND" else "OR_BRANCH"
                    })
                    queue.append(child_id)

        root = graph[root_id]
        is_fraud_proved = root.is_solved and root.cost < 5.0

        explanation = (
            f"AO* Search completed with optimal tree cost f={root_cost:.2f}. "
            f"Fraud Status: {'CONFIRMED (Minimum-cost proof established)' if is_fraud_proved else 'UNPROVEN (Threshold not reached)'}. "
            f"Active proof path decomposed across {len(proof_nodes)} decision nodes."
        )

        # Graph dictionary for frontend visual render
        graph_dict = {
            nid: {
                "id": n.id,
                "label": n.label,
                "type": n.node_type,
                "cost": round(n.cost, 2),
                "is_solved": n.is_solved,
                "is_active": n.is_active,
                "is_fraud_flagged": n.is_fraud_flagged,
                "best_hyperedge": n.best_hyperedge,
                "children": n.children,
                "status_message": n.status_message
            }
            for nid, n in graph.items()
        }

        return AOStarResult(
            root_id=root_id,
            is_fraud_proved=is_fraud_proved,
            optimal_cost=round(root_cost, 2),
            proof_tree_nodes=proof_nodes,
            proof_tree_edges=proof_edges,
            graph_dict=graph_dict,
            traversal_log=traversal_log,
            explanation=explanation
        )

ao_star_engine = AOStarSearcher()
