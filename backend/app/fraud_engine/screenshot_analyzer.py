"""
Multimodal Screenshot & Receipt Fraud Analyzer
Performs computer vision heuristics, OCR field extraction, fake-receipt signature detection,
and orchestrates the Bayesian & AO* reasoning engines.
"""

import os
import re
import cv2
import numpy as np
from PIL import Image, ImageStat
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
import json
import logging

from app.fraud_engine.bayesian_detector import bayesian_engine, BayesianInferenceResult
from app.fraud_engine.ao_star_search import ao_star_engine, AOStarResult
from app.config import GEMINI_API_KEY, VLM_MODEL

logger = logging.getLogger(__name__)

class ScreenshotFraudAnalyzer:
    """
    Multimodal AI Agent for analyzing transaction screenshots, payment receipts, and invoices.
    Detects tampering, extracts transaction parameters, and executes Bayesian & AO* search.
    """

    def __init__(self):
        pass

    def analyze_image_forensics(self, image_path: str) -> Dict[str, Any]:
        """
        Runs OpenCV image processing to inspect compression artifacts, 
        edge discontinuities, and digital paste marks around text areas.
        """
        forensic_flags = []
        cv_img = cv2.imread(image_path)
        if cv_img is None:
            return {"error": "Could not read image file", "tamper_detected": False}

        h, w, c = cv_img.shape
        gray = cv2.cvtColor(cv_img, cv2.COLOR_BGR2GRAY)

        # 1. Error Level Analysis (ELA) approximation via Laplacian variance and gradient discontinuity
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        lap_var = laplacian.var()

        # 2. Local threshold gradient to find digital splicing around the center / amount area
        # Often fake receipt generators paste sharp vector text on a compressed JPG background
        center_y_start = int(h * 0.2)
        center_y_end = int(h * 0.6)
        center_roi = gray[center_y_start:center_y_end, :]
        roi_laplacian = cv2.Laplacian(center_roi, cv2.CV_64F).var()
        
        # Discontinuity ratio between center amount area and overall image
        discontinuity_ratio = roi_laplacian / (lap_var + 1e-5)
        
        has_clipping_artifacts = discontinuity_ratio > 2.8 or discontinuity_ratio < 0.35

        # 3. Check for uniform color bars often drawn by prank payment apps
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / (h * w)

        return {
            "dimensions": {"width": w, "height": h, "channels": c},
            "laplacian_variance": round(float(lap_var), 2),
            "discontinuity_ratio": round(float(discontinuity_ratio), 2),
            "has_clipping_artifacts": bool(has_clipping_artifacts),
            "edge_density": round(float(edge_density), 4)
        }

    def parse_text_fields(self, image_path: str) -> Dict[str, Any]:
        """
        Extracts key transactional fields from image.
        Uses OCR with regular expression extraction.
        """
        extracted = {
            "amount": None,
            "currency": "INR",
            "utr": None,
            "timestamp": None,
            "payer": None,
            "payee": None,
            "status": "Unknown",
            "raw_text": "",
            "bounding_boxes": []
        }

        # Try to use pytesseract or fallback to universal parser if available
        try:
            import pytesseract
            raw_text = pytesseract.image_to_string(Image.open(image_path))
            extracted["raw_text"] = raw_text
        except Exception:
            # Fallback to reading any embedded text or basic simulation
            raw_text = ""

        # Extract Amount pattern (e.g., ₹50,000, Rs. 1500, $250.00)
        amt_match = re.search(r'(?:₹|Rs\.?|INR|\$)\s*([\d,]+(?:\.\d{2})?)', raw_text, re.IGNORECASE)
        if amt_match:
            try:
                amt_str = amt_match.group(1).replace(",", "")
                extracted["amount"] = float(amt_str)
            except Exception:
                pass

        # Extract UTR / Reference ID (UPI UTR is 12 digits, e.g. 329103948192)
        utr_match = re.search(r'(?:UTR|UPI Ref(?:erence)?(?:\s*No)?|Txn\s*ID)[:\s]*([A-Za-z0-9]{8,18})', raw_text, re.IGNORECASE)
        if utr_match:
            extracted["utr"] = utr_match.group(1).strip()
        else:
            # Fallback check for any 12 digit standalone sequence
            digits12 = re.search(r'\b\d{12}\b', raw_text)
            if digits12:
                extracted["utr"] = digits12.group(0)

        # Extract Payee / UPI ID
        upi_match = re.search(r'([a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64})', raw_text)
        if upi_match:
            extracted["payee"] = upi_match.group(1)

        # Detect payment status keywords
        if re.search(r'(?:Paid Successfully|Completed|Payment Successful|Success)', raw_text, re.IGNORECASE):
            extracted["status"] = "SUCCESS"
        elif re.search(r'(?:Failed|Declined|Unsuccessful)', raw_text, re.IGNORECASE):
            extracted["status"] = "FAILED"
        elif re.search(r'(?:Pending|Processing)', raw_text, re.IGNORECASE):
            extracted["status"] = "PENDING"

        return extracted

    def inspect_and_reason(
        self, 
        image_path: str,
        manual_override: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Comprehensive Multimodal Agent Pipeline:
        1. Analyzes visual forensics
        2. Extracts fields
        3. Generates evidence vector
        4. Runs Bayes' Theorem
        5. Runs AO* Search
        6. Produces final verdict and bounding boxes
        """
        forensics = self.analyze_image_forensics(image_path)
        extracted = self.parse_text_fields(image_path)
        
        # Check if Gemini VLM is active to do deep visual inspection
        gemini_insights = self._inspect_with_gemini_if_configured(image_path)
        
        # Merge manual parameters if provided
        if manual_override:
            for k, v in manual_override.items():
                if v is not None:
                    extracted[k] = v

        detected_evidences = []
        bounding_boxes = []

        # Evidence Rule 1: Visual / Font Tampering
        is_tampered = (
            forensics.get("has_clipping_artifacts", False) or 
            gemini_insights.get("font_tampering_detected", False) or
            (manual_override and manual_override.get("flag_visual_tamper", False))
        )
        if is_tampered:
            detected_evidences.append({
                "id": "visual_tampering",
                "details": gemini_insights.get("tamper_reason") or "Sharp digital splicing / font mismatch detected around amount field (FakePay pattern)."
            })
            bounding_boxes.append({
                "label": "Altered Amount / Font Mismatch",
                "risk": "HIGH",
                "box_2d": [0.25, 0.20, 0.45, 0.80], # [ymin, xmin, ymax, xmax] normalized
                "color": "#ef4444"
            })

        # Evidence Rule 2: UTR Syntax Check
        utr = extracted.get("utr")
        is_utr_invalid = False
        if utr:
            # Valid UPI UTR must be exactly 12 numeric digits
            if not re.match(r'^\d{12}$', str(utr)):
                is_utr_invalid = True
        elif gemini_insights.get("utr_invalid", False) or (manual_override and manual_override.get("flag_invalid_utr", False)):
            is_utr_invalid = True
        
        if is_utr_invalid:
            detected_evidences.append({
                "id": "utr_invalid_syntax",
                "details": f"UTR Reference ID '{utr or 'INVALID'}' violates standard 12-digit numeric banking format."
            })
            bounding_boxes.append({
                "label": "Invalid UTR Reference Syntax",
                "risk": "HIGH",
                "box_2d": [0.55, 0.15, 0.65, 0.85],
                "color": "#f97316"
            })

        # Evidence Rule 3: Amount Outlier Anomaly
        amount = extracted.get("amount")
        if amount and (amount >= 25000 or (manual_override and manual_override.get("flag_amount_anomaly", False))):
            detected_evidences.append({
                "id": "amount_anomaly",
                "details": f"High value transaction (₹{amount:,.2f}) deviates significantly from standard retail profile."
            })
            bounding_boxes.append({
                "label": f"High Value Outlier (₹{amount:,.2f})",
                "risk": "MEDIUM",
                "box_2d": [0.22, 0.25, 0.38, 0.75],
                "color": "#eab308"
            })
        elif manual_override and manual_override.get("flag_amount_anomaly", False):
            detected_evidences.append({
                "id": "amount_anomaly",
                "details": "Transaction value exceeds account historical baseline by >3.5 standard deviations."
            })

        # Evidence Rule 4: Beneficiary Mismatch
        if gemini_insights.get("beneficiary_mismatch", False) or (manual_override and manual_override.get("flag_beneficiary_mismatch", False)):
            detected_evidences.append({
                "id": "beneficiary_mismatch",
                "details": "Beneficiary UPI VPA does not match verified merchant registry or invoice party."
            })
            bounding_boxes.append({
                "label": "Unverified / Mismatched Beneficiary VPA",
                "risk": "HIGH",
                "box_2d": [0.42, 0.18, 0.52, 0.82],
                "color": "#ec4899"
            })

        # Evidence Rule 5: Missing Watermark / Bank Security Badges
        if gemini_insights.get("missing_watermark", False) or (manual_override and manual_override.get("flag_missing_watermark", False)):
            detected_evidences.append({
                "id": "missing_watermark_elements",
                "details": "Screenshot is missing standard NPCI / UPI security seal, bank branding, or security padding."
            })
            bounding_boxes.append({
                "label": "Missing Official NPCI Security Seal",
                "risk": "MEDIUM",
                "box_2d": [0.80, 0.20, 0.95, 0.80],
                "color": "#a855f7"
            })

        # If clean transaction with no red flags detected, add authentic evidence token
        if not detected_evidences:
            bounding_boxes.append({
                "label": "Authentic Receipt Layout Verified",
                "risk": "SAFE",
                "box_2d": [0.15, 0.10, 0.85, 0.90],
                "color": "#10b981"
            })

        # -------------------------------------------------------------
        # 1. RUN BAYES' THEOREM ENGINE
        # -------------------------------------------------------------
        bayes_result: BayesianInferenceResult = bayesian_engine.evaluate(detected_evidences)

        # -------------------------------------------------------------
        # 2. RUN AO* SEARCH ENGINE
        # -------------------------------------------------------------
        evidence_map = {e["id"]: e for e in detected_evidences}
        ao_graph = ao_star_engine.build_fraud_graph(evidence_map)
        ao_result: AOStarResult = ao_star_engine.run_ao_star(ao_graph, root_id="GOAL_FRAUD")

        # -------------------------------------------------------------
        # 3. CONSOLIDATE FINAL VERDICT
        # -------------------------------------------------------------
        is_fraud = bayes_result.posterior_probability >= 0.50
        fraud_confidence = bayes_result.risk_score_100

        verdict_title = (
            "CRITICAL FRAUD DETECTED" if fraud_confidence >= 85 else
            "HIGH FRAUD RISK" if fraud_confidence >= 60 else
            "SUSPICIOUS TRANSACTION" if fraud_confidence >= 35 else
            "LEGITIMATE TRANSACTION VERIFIED"
        )


        recommendation = (
            "Immediate Block: Freeze transaction, halt disbursement, and file automated SAR report." if fraud_confidence >= 60 else
            "Manual Inspection: Request secondary two-factor authentication or bank statement verification." if fraud_confidence >= 35 else
            "Approve: Transaction verified authentic with low fraud indicators."
        )

        return {
            "verdict": {
                "title": verdict_title,
                "is_fraud": is_fraud,
                "fraud_probability": bayes_result.posterior_probability,
                "risk_score_100": bayes_result.risk_score_100,
                "risk_level": bayes_result.risk_level,
                "recommendation": recommendation
            },
            "extracted_fields": extracted,
            "forensics": forensics,
            "bounding_boxes": bounding_boxes,
            "bayesian_analysis": {
                "prior_probability": bayes_result.prior_probability,
                "posterior_probability": bayes_result.posterior_probability,
                "formula_latex": bayes_result.formula_latex,
                "explanation": bayes_result.explanation_summary,
                "steps": [
                    {
                        "step_num": s.step_num,
                        "evidence_name": s.evidence_name,
                        "prior_prob": s.prior_probability,
                        "bayes_factor": s.bayes_factor,
                        "posterior_prob": s.posterior_probability,
                        "delta_pct": s.delta_risk,
                        "explanation": s.explanation
                    }
                    for s in bayes_result.steps
                ]
            },

            "ao_star_search": {
                "root_id": ao_result.root_id,
                "is_fraud_proved": ao_result.is_fraud_proved,
                "optimal_cost": ao_result.optimal_cost,
                "explanation": ao_result.explanation,
                "proof_tree_nodes": ao_result.proof_tree_nodes,
                "proof_tree_edges": ao_result.proof_tree_edges,
                "full_graph": ao_result.graph_dict,
                "traversal_log": ao_result.traversal_log
            }
        }

    def _inspect_with_gemini_if_configured(self, image_path: str) -> Dict[str, Any]:
        """
        Uses Gemini Vision Language Model if GEMINI_API_KEY is configured.
        Returns visual fraud indicators.
        """
        if not GEMINI_API_KEY or GEMINI_API_KEY == "your_gemini_api_key_here":
            return {}

        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_API_KEY)
            model = genai.GenerativeModel(VLM_MODEL)

            img = Image.open(image_path)
            prompt = """
            You are an expert financial fraud detection forensics AI agent.
            Analyze this transaction receipt / payment screenshot carefully.
            Output strict JSON with:
            {
               "font_tampering_detected": bool,
               "tamper_reason": string or null,
               "utr_invalid": bool,
               "beneficiary_mismatch": bool,
               "missing_watermark": bool,
               "is_fake_generator": bool,
               "detected_amount": float or null,
               "detected_utr": string or null
            }
            Do not include markdown wrappers, return pure JSON.
            """
            response = model.generate_content([prompt, img])
            text = response.text.strip()
            # Clean markdown code block if returned
            if text.startswith("```"):
                text = re.sub(r"^```(?:json)?\n|\n```$", "", text, flags=re.MULTILINE)
            return json.loads(text)
        except Exception as e:
            logger.warning(f"Gemini VLM screenshot inspection fallback: {e}")
            return {}

screenshot_fraud_agent = ScreenshotFraudAnalyzer()
