"""
Bayesian Fraud Detection Module
Applies Bayes' Theorem to iteratively update fraud probability given multimodal & transactional evidence.
"""

from typing import Dict, List, Any, Optional
from dataclasses import dataclass, field
import math

@dataclass
class EvidenceSignal:
    id: str
    name: str
    description: str
    p_evidence_given_fraud: float      # P(E | Fraud)
    p_evidence_given_legit: float      # P(E | ~Fraud)
    weight: float = 1.0
    detected: bool = False
    details: Optional[str] = None

    @property
    def likelihood_ratio(self) -> float:
        """Bayes Factor / Likelihood Ratio = P(E|Fraud) / P(E|Legit)"""
        denom = max(self.p_evidence_given_legit, 1e-6)
        return self.p_evidence_given_fraud / denom

@dataclass
class BayesianStep:
    step_num: int
    evidence_id: str
    evidence_name: str
    prior_probability: float
    likelihood_fraud: float
    likelihood_legit: float
    bayes_factor: float
    posterior_probability: float
    delta_risk: float
    explanation: str

@dataclass
class BayesianInferenceResult:
    prior_probability: float
    posterior_probability: float
    risk_level: str
    risk_score_100: float
    detected_evidences: List[Dict[str, Any]]
    steps: List[BayesianStep]
    formula_latex: str
    explanation_summary: str

class BayesianFraudDetector:
    """
    Implements Bayesian Inference engine for transactional and screenshot fraud detection.
    Computes P(Fraud | Evidence_1, Evidence_2, ..., Evidence_n) using:
      P(Fraud | E) = [ P(E | Fraud) * P(Fraud) ] / [ P(E) ]
    """

    # Standard transactional & multimodal evidence priors calibrated from banking benchmarks
    DEFAULT_SIGNALS = {
        "visual_tampering": EvidenceSignal(
            id="visual_tampering",
            name="Visual & Font Tampering",
            description="Font mismatch, pixel alteration, or artifacts typical of fake receipt generators (e.g. FakePay)",
            p_evidence_given_fraud=0.88,
            p_evidence_given_legit=0.015,
            weight=1.5
        ),
        "utr_invalid_syntax": EvidenceSignal(
            id="utr_invalid_syntax",
            name="Invalid UTR / Reference ID Syntax",
            description="Transaction reference ID fails banking checksum or standard 12-digit length/character rules",
            p_evidence_given_fraud=0.92,
            p_evidence_given_legit=0.01,
            weight=1.6
        ),
        "amount_anomaly": EvidenceSignal(
            id="amount_anomaly",
            name="Statistical Amount Outlier",
            description="Transaction amount exceeds 3 standard deviations from user / counterparty baseline",
            p_evidence_given_fraud=0.74,
            p_evidence_given_legit=0.04,
            weight=1.2
        ),
        "time_velocity_anomaly": EvidenceSignal(
            id="time_velocity_anomaly",
            name="Velocity / Abnormal Timestamp Spike",
            description="Transaction occurred at unusual hours (2 AM - 5 AM) or rapid micro-burst frequency",
            p_evidence_given_fraud=0.68,
            p_evidence_given_legit=0.06,
            weight=1.1
        ),
        "beneficiary_mismatch": EvidenceSignal(
            id="beneficiary_mismatch",
            name="Beneficiary Name & VPA Discrepancy",
            description="Beneficiary account name or UPI VPA does not match invoice or known merchant entity",
            p_evidence_given_fraud=0.82,
            p_evidence_given_legit=0.03,
            weight=1.3
        ),
        "missing_watermark_elements": EvidenceSignal(
            id="missing_watermark_elements",
            name="Missing Official Bank Layout / Watermark",
            description="Absence of official bank security logos, NPCI / UPI badges, or standard padding",
            p_evidence_given_fraud=0.78,
            p_evidence_given_legit=0.02,
            weight=1.2
        ),
        "duplicate_receipt_hash": EvidenceSignal(
            id="duplicate_receipt_hash",
            name="Duplicate Receipt Image Fingerprint",
            description="Image perceptual hash matches previously flagged fraudulent receipts or internet templates",
            p_evidence_given_fraud=0.96,
            p_evidence_given_legit=0.005,
            weight=1.8
        )
    }

    def __init__(self, base_prior: float = 0.025):
        """
        :param base_prior: Base rate probability of fraud in typical retail payments (default 2.5%)
        """
        self.base_prior = base_prior
        self.signals = {k: EvidenceSignal(**v.__dict__) for k, v in self.DEFAULT_SIGNALS.items()}

    def evaluate(self, observed_evidence_keys: List[Dict[str, Any]]) -> BayesianInferenceResult:
        """
        Computes the posterior probability of fraud using Bayes' Theorem.
        :param observed_evidence_keys: List of dicts, e.g. [{"id": "visual_tampering", "details": "Altered font on amount"}]
        """
        # Determine prior odds
        current_prob = self.base_prior
        current_odds = current_prob / (1.0 - current_prob)

        steps: List[BayesianStep] = []
        detected_list = []

        step_idx = 1
        for obs in observed_evidence_keys:
            key = obs.get("id")
            details = obs.get("details", "")
            
            sig = self.signals.get(key)
            if not sig:
                # Custom dynamic signal
                sig = EvidenceSignal(
                    id=key,
                    name=obs.get("name", key.replace("_", " ").title()),
                    description=obs.get("description", "Dynamic risk evidence detected"),
                    p_evidence_given_fraud=obs.get("p_fraud", 0.75),
                    p_evidence_given_legit=obs.get("p_legit", 0.05),
                    weight=obs.get("weight", 1.0),
                    detected=True,
                    details=details
                )
            else:
                sig.detected = True
                sig.details = details

            bf = sig.likelihood_ratio ** sig.weight
            new_odds = current_odds * bf
            new_prob = new_odds / (1.0 + new_odds)
            
            # Bound probability [0.001, 0.999]
            new_prob = min(max(new_prob, 0.0001), 0.9999)

            step = BayesianStep(
                step_num=step_idx,
                evidence_id=sig.id,
                evidence_name=sig.name,
                prior_probability=round(current_prob, 4),
                likelihood_fraud=round(sig.p_evidence_given_fraud, 3),
                likelihood_legit=round(sig.p_evidence_given_legit, 3),
                bayes_factor=round(bf, 3),
                posterior_probability=round(new_prob, 4),
                delta_risk=round((new_prob - current_prob) * 100, 2),
                explanation=(
                    f"Evidence '{sig.name}' introduces Bayes factor {bf:.2f}x "
                    f"(P(E|Fraud)={sig.p_evidence_given_fraud} vs P(E|~Fraud)={sig.p_evidence_given_legit}), "
                    f"shifting probability from {current_prob * 100:.1f}% to {new_prob * 100:.1f}%."
                )
            )
            steps.append(step)
            detected_list.append({
                "id": sig.id,
                "name": sig.name,
                "description": sig.description,
                "details": details or sig.description,
                "likelihood_fraud": sig.p_evidence_given_fraud,
                "likelihood_legit": sig.p_evidence_given_legit,
                "bayes_factor": round(bf, 2)
            })

            current_prob = new_prob
            current_odds = new_odds
            step_idx += 1

        final_prob = current_prob
        risk_score_100 = round(final_prob * 100, 1)

        if risk_score_100 >= 85.0:
            risk_level = "CRITICAL_FRAUD"
        elif risk_score_100 >= 60.0:
            risk_level = "HIGH_RISK"
        elif risk_score_100 >= 35.0:
            risk_level = "SUSPICIOUS"
        elif risk_score_100 >= 10.0:
            risk_level = "ELEVATED"
        else:
            risk_level = "LEGITIMATE"

        # LaTeX representation of the multi-evidence Bayes rule
        formula_latex = (
            r"P(\text{Fraud} \mid E_{1..k}) = \frac{P(\text{Fraud}) \prod_{i=1}^k P(E_i \mid \text{Fraud})}"
            r"{P(\text{Fraud}) \prod_{i=1}^k P(E_i \mid \text{Fraud}) + P(\neg\text{Fraud}) \prod_{i=1}^k P(E_i \mid \neg\text{Fraud})}"
        )

        explanation = (
            f"Based on Bayes' Theorem, starting from a prior retail fraud baseline of {self.base_prior * 100:.1f}%, "
            f"the observation of {len(detected_list)} positive risk indicators updated the posterior fraud likelihood "
            f"to {risk_score_100}%. Classification: {risk_level}."
        )

        return BayesianInferenceResult(
            prior_probability=self.base_prior,
            posterior_probability=round(final_prob, 4),
            risk_level=risk_level,
            risk_score_100=risk_score_100,
            detected_evidences=detected_list,
            steps=steps,
            formula_latex=formula_latex,
            explanation_summary=explanation
        )

bayesian_engine = BayesianFraudDetector()
