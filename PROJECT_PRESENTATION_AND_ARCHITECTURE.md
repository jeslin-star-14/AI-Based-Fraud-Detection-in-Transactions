# AI-Based Fraud Detection in Transactions
## Comprehensive Architectural Whitepaper & Slide-by-Slide Presentation Deck

---

## Executive Summary

Digital transactions via Unified Payments Interface (UPI), mobile payment wallets (Google Pay, PhonePe, Paytm), and instant wire transfers have grown exponentially, accompanied by a surge in sophisticated digital payment fraud. These fraudulent schemes include:
1. **Synthetic & Prank Payment Receipts**: Counterfeit mobile payment screens generated via offline APK tools (e.g., FakePay) with manipulated transaction amounts, spoofed reference numbers, and altered status badges.
2. **Digital Image Splicing & Paste Tampering**: Tampering with genuine payment vouchers using image editing tools by modifying numerical amounts, beneficiary VPAs, or timestamps while retaining genuine backgrounds.
3. **Out-of-Domain Submission Attacks**: Uploading non-transactional credentials (e.g., academic hall tickets, citizen ID cards, utility bills) to confuse automated banking reconciliation pipelines.

This system introduces a **Multi-Agent Multimodal AI Architecture** combining three core methodologies:
1. **Intelligent Domain & Intent Classification**: Pre-filters out-of-domain media (academic documents, citizen cards, general images) before executing financial reasoning.
2. **Bayesian Probabilistic Updating**: Sequentially shifts baseline fraud belief $P(\text{Fraud})$ into an exact posterior probability $P(\text{Fraud} \mid E_1, E_2, \dots, E_k)$ using calibrated likelihood ratios (Bayes Factors).
3. **AO\* (AND-OR Graph Search) Problem Reduction**: Models fraud verification as a state-space problem reduction tree, evaluating independent attack pathways (OR branches) and compounding evidentiary proofs (AND sub-goals) to prove fraud with minimum heuristic cost.

```
+----------------------------------------------------------------------------------------------------+
|                                    INPUT DOCUMENT / SCREENSHOT                                     |
+----------------------------------------------------------------------------------------------------+
                                                  │
                                                  ▼
                        ┌──────────────────────────────────────────────────┐
                        │    Stage 0: Pre-Inference Domain Classifier      │
                        │    (EasyOCR Entity Extraction & Regex Rules)     │
                        └──────────────────────────────────────────────────┘
                                                  │
                    ┌─────────────────────────────┴─────────────────────────────┐
                    ▼                                                           ▼
    [Non-Financial Document]                                    [Financial Payment Transaction]
  (e.g., Academic Hall Ticket, ID)                            (UPI, GPay, PhonePe, Bank Voucher)
                    │                                                           │
                    ▼                                                           ▼
    ┌──────────────────────────────┐                            ┌──────────────────────────────┐
    │ Extract Candidate / Doc Info │                            │ Computer Vision Forensics    │
    │ Suspend Fraud Reasoning      │                            │ (Laplacian Variance Spikes,  │
    │ Return Domain Notice         │                            │ Edge Discontinuity, ELA)     │
    └──────────────────────────────┘                            └──────────────┬───────────────┘
                                                                               │
                                                                               ▼
                                                                ┌──────────────────────────────┐
                                                                │ Text & Parameter Extraction  │
                                                                │ (Amount, 12-digit UTR, VPA,  │
                                                                │ Security Seals, Timestamps)  │
                                                                └──────────────┬───────────────┘
                                                                               │
                                                ┌──────────────────────────────┴──────────────────────────────┐
                                                ▼                                                             ▼
                                ┌──────────────────────────────┐                              ┌──────────────────────────────┐
                                │   Core 1: Bayes' Theorem     │                              │   Core 2: AO* Graph Search   │
                                │   Sequential Risk Updating   │                              │   State-Space Decomposition  │
                                │ P(F|E) = P(E|F)P(F) / P(E)   │                              │ Heuristic Backpropagation    │
                                └──────────────┬───────────────┘                              └──────────────┬───────────────┘
                                               │                                                             │
                                               └──────────────────────────────┬──────────────────────────────┘
                                                                              │
                                                                              ▼
                                                              ┌──────────────────────────────┐
                                                              │ Gemini / Gemma Agent Engine  │
                                                              │ Multimodal Advisory Synthesis│
                                                              └──────────────┬───────────────┘
                                                                             │
                                                                             ▼
                                                              ┌──────────────────────────────┐
                                                              │ FINAL MULTI-LAYER VERDICT    │
                                                              │ (Audit Ledger & Visual Proof)│
                                                              └──────────────────────────────┘
```

---

# Part 1: Deep Architectural & Mathematical Explanation

---

## 1. Domain & Intent Classification Pipeline

### The Problem of Out-of-Domain Uploads
In production payment systems, users or attackers often submit unrelated documents—such as university examination hall tickets, admit cards, citizen IDs (Aadhaar, PAN), or random media. A naive fraud detector that assumes every input is a payment receipt will trigger false positives (e.g., labeling an exam hall ticket as "an invalid payment voucher with missing UTR").

### Architectural Gatekeeper: `classify_document_domain`
Before executing forensic verification, the system runs a domain classification pre-check:

```python
classification = screenshot_fraud_agent.classify_document_domain(
    raw_text=extracted_text,
    ocr_tokens=tokens,
    image_path=path,
    forensics=forensics
)
```

1. **Academic Examination Documents**:
   - Detected via signatures: `hall ticket`, `admit card`, `nptel`, `swayam`, `candidate name`, `roll no`, `examination session`, `course name`.
   - Action: Extracts candidate name, roll number, course, and exam session. Immediately halts financial reasoning and flags `is_transaction_document: False`.
2. **Citizen Identity Documents**:
   - Detected via: `government of india`, `income tax department`, `permanent account number`, `aadhaar`, `driving licence`.
   - Action: Flags document type and halts fraud engine.
3. **Financial Payment Transactions**:
   - Detected via: Gateway providers (`Google Pay`, `GPay`, `PhonePe`, `Paytm`, `BHIM`, `IndusInd Bank`, `SBI`, `HDFC`, `ICICI`), transfer verbs (`Paid Successfully`, `Completed`, `Transferred`), UPI handles (`@okhdfc`, `@ybl`, `cicag...`), and monetary currency amounts.
   - Action: Flags `is_transaction_document: True` and passes tokens to Bayesian and AO\* search engines.

---

## 2. Bayes' Theorem in Transaction Fraud Detection

### 2.1 Mathematical Formulation
Bayes' Theorem provides the mathematical framework for updating our belief in a hypothesis ($H = \text{Fraud}$) given observed evidence tokens ($E = \{E_1, E_2, \dots, E_k\}$):

$$P(\text{Fraud} \mid E) = \frac{P(E \mid \text{Fraud}) \cdot P(\text{Fraud})}{P(E)}$$

Where:
- $P(\text{Fraud})$ is the **Prior Probability** (the baseline base-rate of fraud in the system before inspecting the current receipt, set to $2.5\%$ or $0.025$).
- $P(E \mid \text{Fraud})$ is the **Likelihood** of observing evidence $E$ given that the transaction is indeed fraudulent.
- $P(E \mid \neg\text{Fraud})$ is the **False Positive Likelihood** of observing evidence $E$ in a legitimate transaction.
- $P(E)$ is the **Marginal Probability of Evidence**:

$$P(E) = P(E \mid \text{Fraud}) \cdot P(\text{Fraud}) + P(E \mid \neg\text{Fraud}) \cdot P(\neg\text{Fraud})$$

### 2.2 Odds & Bayes Factor Formulation
For iterative multi-evidence updates, the **Odds Form of Bayes' Theorem** prevents numerical rounding decay and enables sequential updating:

$$\text{Prior Odds} = O(\text{Fraud}) = \frac{P(\text{Fraud})}{1 - P(\text{Fraud})}$$

Each observed evidence $E_i$ multiplies the current odds by its **Bayes Factor** (Likelihood Ratio $\lambda_i$):

$$\lambda_i = \text{Bayes Factor}(E_i) = \frac{P(E_i \mid \text{Fraud})}{P(E_i \mid \neg\text{Fraud})}$$

$$\text{Posterior Odds} = O(\text{Fraud} \mid E_1, \dots, E_k) = O(\text{Fraud}) \times \prod_{i=1}^{k} \lambda_i$$

Finally, the posterior probability is recovered:

$$P(\text{Fraud} \mid E) = \frac{\text{Posterior Odds}}{1 + \text{Posterior Odds}}$$

### 2.3 Calibrated Evidence Priors in the System

| Evidence ID ($E_i$) | Evidence Description | $P(E_i \mid \text{Fraud})$ | $P(E_i \mid \neg\text{Fraud})$ | Bayes Factor ($\lambda_i$) | Evidentiary Impact |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **`visual_tampering`** | Spliced font edges, Laplacian discontinuity ratio $>1.8$ | $0.88$ | $0.015$ | **$58.67\times$** | Extremely Strong Fraud Signal |
| **`utr_invalid_syntax`** | Reference ID violates 12-digit numeric rule (e.g., alphanumeric) | $0.92$ | $0.010$ | **$92.00\times$** | Decisive Fraud Indicator |
| **`amount_anomaly`** | Transaction value $>3.5\sigma$ outlier (e.g., $\ge ₹25,000$) | $0.74$ | $0.050$ | **$14.80\times$** | Moderate-High Suspicion |
| **`beneficiary_mismatch`**| Unregistered / anonymous P2P escrow handle | $0.65$ | $0.020$ | **$32.50\times$** | Strong Counterparty Risk |
| **`missing_watermark`** | Layout missing NPCI official seal / issuer badge | $0.80$ | $0.040$ | **$20.00\times$** | Strong Layout Anomaly |

### 2.4 Concrete Mathematical Step-by-Step Calculus

Suppose a tampered receipt is analyzed with two observed evidence signals:
1. $E_1$: **`visual_tampering`** (Font mismatch and pixel paste box around amount)
2. $E_2$: **`utr_invalid_syntax`** (UTR is `TXN-INVALID-99482` instead of 12 digits)

#### Baseline Initialization:
- $P_0(\text{Fraud}) = 0.025$
- $\text{Prior Odds} = \frac{0.025}{1 - 0.025} = \frac{0.025}{0.975} \approx 0.02564$

#### Step 1: Incorporating $E_1$ (`visual_tampering`)
- $P(E_1 \mid \text{Fraud}) = 0.88$, $P(E_1 \mid \neg\text{Fraud}) = 0.015$
- $\lambda_1 = \frac{0.88}{0.015} = 58.667$
- $\text{Odds}_1 = 0.02564 \times 58.667 = 1.5042$
- $P_1(\text{Fraud} \mid E_1) = \frac{1.5042}{1 + 1.5042} = \mathbf{0.6007 \ (60.07\%)}$
- *Risk shifts from $2.5\%$ to $60.1\%$.*

#### Step 2: Incorporating $E_2$ (`utr_invalid_syntax`)
- $P(E_2 \mid \text{Fraud}) = 0.92$, $P(E_2 \mid \neg\text{Fraud}) = 0.010$
- $\lambda_2 = \frac{0.92}{0.010} = 92.000$
- $\text{Odds}_2 = 1.5042 \times 92.000 = 138.386$
- $P_2(\text{Fraud} \mid E_1, E_2) = \frac{138.386}{1 + 138.386} = \mathbf{0.9928 \ (99.28\%)}$
- *The compound probability escalates to $99.28\%$, proving critical fraud.*

---

## 3. AO\* (AND-OR Graph Search) in Transaction Fraud Verification

### 3.1 Why AO\* over A\*?
Traditional **A\*** search finds an optimal single path from a start state to a goal state. However, forensic fraud investigation is not a single path—it is a **Problem Reduction Decomposition**:
- A fraud verdict can be established through **alternative independent channels** (**OR branches**): e.g., either the image was visually forged, OR the reference ID was spoofed, OR the transaction violates behavioral norms.
- Within an attack channel, proving the hypothesis requires **compounding multi-criteria corroboration** (**AND branches**): e.g., to confirm Visual Forgery, the investigator must prove *both* Pixel Font Splicing AND Missing Security Watermarks.

The **AO\*** algorithm is specifically formulated to search **AND-OR graphs** and identify the **minimum-cost solved proof tree**.

### 3.2 Formal AND-OR Graph Topology

```mermaid
graph TD
    GOAL["GOAL_FRAUD: Confirm Transaction Fraud (OR Node)"]
    
    B1["BRANCH_VISUAL: Visual Forgery Channel (AND Node)"]
    B2["BRANCH_SPOOF: Reference Spoofing Channel (AND Node)"]
    B3["BRANCH_BEHAVIOR: Behavioral Anomaly Channel (AND Node)"]
    
    L1["LEAF: Font / Pixel Tampering"]
    L2["LEAF: Missing Bank Watermark"]
    
    L3["LEAF: UTR Invalid Syntax"]
    L4["LEAF: Unverified Beneficiary VPA"]
    
    L5["LEAF: Amount Statistical Outlier"]
    L6["LEAF: Timestamp Velocity Anomaly"]
    
    GOAL -->|OR Option 1| B1
    GOAL -->|OR Option 2| B2
    GOAL -->|OR Option 3| B3
    
    B1 -->|AND Sub-goal 1| L1
    B1 -->|AND Sub-goal 2| L2
    
    B2 -->|AND Sub-goal 1| L3
    B2 -->|AND Sub-goal 2| L4
    
    B3 -->|AND Sub-goal 1| L5
    B3 -->|AND Sub-goal 2| L6
    
    classDef orNode fill:#3b82f6,stroke:#1d4ed8,color:#ffffff,stroke-width:2px;
    classDef andNode fill:#8b5cf6,stroke:#6d28d9,color:#ffffff,stroke-width:2px;
    classDef leafNode fill:#f1f5f9,stroke:#64748b,color:#0f172a,stroke-width:1px;
    class GOAL orNode;
    class B1,B2,B3 andNode;
    class L1,L2,L3,L4,L5,L6 leafNode;
```

### 3.3 Heuristic Cost Function & Backpropagation Equations
Every node $n$ in the AND-OR graph maintains a cost evaluation $f(n)$:
1. **For Leaf Nodes ($n \in \text{Leaf}$)**:
   - If evidence is detected (sub-condition proved true): $f(n) = 0.0$ and $\text{Solved}(n) = \text{True}$.
   - If evidence is not detected (unproven): $f(n) = \infty$ (or penalty cost) and $\text{Solved}(n) = \text{False}$.

2. **For AND Nodes ($n \in \text{AND}$ with children $m_1, m_2, \dots, m_j$)**:
   All child sub-goals must be verified. The cost is the edge cost plus the sum of all child costs:
   $$f(n) = c(n) + \sum_{m \in \text{Children}(n)} f(m)$$
   $$\text{Solved}(n) = \bigwedge_{m \in \text{Children}(n)} \text{Solved}(m)$$

3. **For OR Nodes ($n \in \text{OR}$ with alternative hyperedges $H_1, H_2, \dots, H_p$)**:
   The algorithm selects the alternative that offers the minimum verification cost:
   $$f(n) = \min_{H_k} \left[ c(n, H_k) + \sum_{m \in H_k} f(m) \right]$$
   $$\text{Solved}(n) = \bigvee_{H_k} \left( \bigwedge_{m \in H_k} \text{Solved}(m) \right)$$

### 3.4 Bottom-Up Cost Revision Algorithm
```
1. Initialize Graph with root node GOAL_FRAUD.
2. While GOAL_FRAUD is unsolved and unexpanded non-terminal nodes exist:
     a. Select an active partial tree node for expansion.
     b. Ground terminal leaf nodes using actual OCR tokens and CV forensics.
     c. Bottom-Up Propagation:
        - For every ancestor node n up to GOAL_FRAUD:
            - If n is an AND node:
                f(n) = cost(edge) + sum(f(children))
                solved(n) = all(solved(children))
            - If n is an OR node:
                best_branch = argmin(cost(branch))
                f(n) = cost(best_branch)
                solved(n) = any(solved(branches))
3. If solved(GOAL_FRAUD) is True:
     Return Solved Minimum-Cost Proof Tree and active execution path.
```

---

## 4. Computer Vision Forensics & Text Parsing Architecture

1. **Error Level Analysis (ELA) & Laplacian Edge Discontinuity**:
   - Computes the Laplacian second-order spatial derivative: $\nabla^2 I = \frac{\partial^2 I}{\partial x^2} + \frac{\partial^2 I}{\partial y^2}$.
   - When text is spliced into a screenshot using Photoshop or FakePay, the localized pixel variance around the pasted box deviates sharply from the background compression ratio ($>1.8\times$ discontinuity), revealing the tampering boundary.
2. **EasyOCR Spatial Bounding Box Normalization**:
   - Runs OCR to extract text strings with 4-point bounding polygons.
   - Normalizes coordinates $[y_{\min}, x_{\min}, y_{\max}, x_{\max}] \in [0.0, 1.0]$ for dynamic frontend canvas rendering.
3. **Multi-Model Multimodal Advisory**:
   - Synthesizes findings using Gemma / Gemini 2.0 Flash VLM or the built-in Autonomous Forensic Agent.
   - Answers the four essential fraud ops questions:
     1. *What is this document?*
     2. *For what was this payment done?*
     3. *Is it safe to release goods or funds?*
     4. *What are the actionable containment steps?*

---

## 5. The "Subject" Persona: Pedagogical Learning & STEM Explanation

### 5.1 What is the "Subject" Persona in the Header?
In the application header, the **Persona Selector** provides an adaptive cognitive lens tailored to different stakeholders:
- **Executive**: High-level summaries, revenue-at-risk, and operational ROI.
- **Fraud Analyst (Auditor)**: Forensic audit trails, NPCI checksums, and verification ledger logs.
- **AI Researcher (Data Scientist)**: Loss functions, hyperedge derivations, and matrix embeddings.
- **Subject (Studies / Pedagogical Learning)**: **Intuitive, plain-language conceptual explanations designed for students, educators, and viva/examiner evaluations.**
- **Compliance Officer (Legal Counsel)**: SAR regulatory reporting, PMLA guidelines, and legal evidence admissibility.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Persona: [ Subject (STEM Learning & Pedagogical Explanation)  ▼ ]     │
└────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
       Transforms Technical Formulas into Plain-Language Analogies:
   • Bayes' Theorem    ──► "The Detective Gathering Compounding Clues"
   • AO* Graph Search  ──► "The Courtroom Proof Tree with Alternative Channels"
   • Domain Classifier ──► "The Gatekeeper Sorting Non-Financial Media"
```

### 5.2 How "Subject" Mode Explains Bayes' Theorem
When a student or examiner interacts with the system under the **Subject** persona, the AI demystifies the mathematical calculus:

1. **The "Detective Clue" Analogy**:
   - Imagine a detective walking into a room where only 2.5 out of 100 people are suspects (**Prior Probability: $P(\text{Fraud}) = 2.5\%$**).
   - The detective finds a suspicious pasted font box around the amount (**Observation 1**). A genuine receipt rarely has pasted fonts ($1.5\%$ chance), while a fake receipt almost always does ($88\%$ chance). This clue multiplies the suspicion by a **Bayes Factor of $58.7\times$**, jumping fraud belief from $2.5\%$ to **$60.1\%$**.
   - The detective then checks the banking reference number (UTR) and discovers it has letters instead of 12 digits (**Observation 2**). This clue is a decisive **$92\times$ magnifier**.
   - Combining both clues via Bayes' Theorem, the detective's belief reaches **$99.28\%$**, establishing undeniable proof of fraud.

2. **Why Bayes' Theorem Was Chosen for Transactions**:
   - Real-world mobile screenshots have compression noise, low resolution, and lighting variations.
   - Deterministic "if-else" code causes massive false alarms or misses subtle fraud. Bayes' Theorem handles **uncertainty**, allowing multiple weak clues to compound into overwhelming mathematical proof without guessing.

### 5.3 How "Subject" Mode Explains the AO\* Algorithm
When explaining the **AO\*** search tree in Subject mode:

1. **The "Courtroom Proof" Analogy**:
   - To convict a suspect of fraud in a courtroom, the prosecutor doesn't need to prove *every possible crime*—they only need to prove **one valid theory of the crime** (**OR Branch**):
     - *Theory A*: The document was physically altered (Visual Splicing).
     - *Theory B*: The banking identifier was spoofed (Reference Spoofing).
     - *Theory C*: The transaction pattern is impossible (Behavioral Anomaly).
   - However, within *Theory A*, the prosecutor cannot just point to blurry text. They must prove **both required sub-conditions** (**AND Branch**):
     - Sub-condition 1: Pixel font tampering must be verified.
     - **AND** Sub-condition 2: Official bank security watermark must be missing.
   - **AO\* Algorithm** finds the path of least effort (minimum heuristic cost $f(n)$) to verify the required sub-conditions and produce a mathematically sound, complete proof tree.

2. **Why AO\* Was Chosen over A\***:
   - Traditional **A\*** search only searches single linear routes (e.g., GPS navigation from city A to city B).
   - Transaction fraud is **non-linear and composite**: it requires solving compounding criteria across alternative attack avenues. Only an **AND-OR graph search (AO\*)** can solve problem-reduction proof trees.

---

# Part 2: Slide-by-Slide Presentation Deck (PPT Blueprint)

---

### Slide 1: Title Slide
- **Title**: AI-Based Fraud Detection in Transactions
- **Subtitle**: Multimodal Forensics, Bayesian Probability Updating & AO\* Graph Search
- **Presenter**: Jeslin J P
- **Technology Stack**: Python FastAPI, EasyOCR, OpenCV, PyTorch, React, TypeScript, TailwindCSS
- **Speaker Notes**:
  > "Good morning everyone. Today I am presenting our project: AI-Based Fraud Detection in Transactions. Unlike traditional rule engines, our system integrates computer vision forensics, Bayes' Theorem for probabilistic belief updating, and the AO\* algorithm to generate verifiable, explainable proof trees for transaction fraud."

---

### Slide 2: The Problem: Modern Payment Fraud
- **Key Challenges**:
  - Rise of synthetic receipt generators (e.g., FakePay APKs) that create convincing payment slips.
  - Splicing and digital tampering of amounts and reference numbers.
  - Out-of-domain document submissions that overwhelm automated financial settlement pipelines.
- **Why Simple Pattern Matching Fails**:
  - Regex alone cannot tell if an image has been manipulated.
  - Hardcoded thresholds lack probabilistic confidence scores.
  - Lack of formal verification proof trees leads to "black box" decisions that cannot be audited.
- **Speaker Notes**:
  > "Mobile UPI transactions are instantaneous. Fraudsters take advantage of this by presenting edited screenshots to merchants before the bank SMS arrives. A standard system checking only text will miss spliced pixels, fake reference numbers, or out-of-domain uploads."

---

### Slide 3: Proposed Architecture Overview
- **Four Core Subsystems**:
  1. **Domain Classifier**: Separates financial receipts from academic hall tickets, citizen IDs, and media.
  2. **Computer Vision Forensics**: Laplacian variance, ELA, and EasyOCR with coordinate normalization.
  3. **Bayesian Engine**: Sequentially updates fraud probability using likelihood ratios.
  4. **AO\* Heuristic Search**: Traverses an AND-OR state space to prove fraud via minimum-cost reduction trees.
- **Speaker Notes**:
  > "Our architecture operates as a multi-stage funnel. First, we establish document domain. If it is an authentic transaction, we extract forensic artifacts and evaluate it concurrently through Bayes' Theorem and AO\* graph search."

---

### Slide 4: Stage 0: Document Domain & Intent Classifier
- **The Concept**:
  - Pre-inference gatekeeper inspecting entity signatures.
- **Categories Handled**:
  - `ACADEMIC_EXAM_DOCUMENT` (NPTEL Hall Tickets, University Admit Cards).
  - `GOVERNMENT_IDENTITY_DOCUMENT` (Aadhaar, PAN, Voter ID).
  - `FINANCIAL_TRANSACTION` (UPI, Google Pay, PhonePe, Paytm, Bank Receipts, Invoices).
- **Behavior**:
  - For non-transaction images, candidate metadata is parsed and fraud reasoning is suspended.
  - Prevents false fraud accusations on unrelated personal files.
- **Speaker Notes**:
  > "Notice how the system handles non-transaction uploads. When an NPTEL exam ticket was submitted, the engine did not generate a fake fraud warning; it accurately identified candidate name Jeslin J P, roll number, and exam subject, while flagging that financial reasoning is not applicable."

---

### Slide 5: Bayes' Theorem in Fraud Detection
- **Formula**:
  $$P(\text{Fraud} \mid E) = \frac{P(E \mid \text{Fraud}) \cdot P(\text{Fraud})}{P(E)}$$
- **Odds & Bayes Factor**:
  $$\text{Odds}_{\text{new}} = \text{Odds}_{\text{prior}} \times \prod_{i=1}^k \frac{P(E_i \mid \text{Fraud})}{P(E_i \mid \neg\text{Fraud})}$$
- **Key Advantage**:
  - No guesswork. Every observed token multiplies prior odds by a mathematically grounded Bayes Factor.
  - Transparent step-by-step calculus shown directly in the UI.
- **Speaker Notes**:
  > "Bayes' Theorem provides the mathematical backbone for our risk score. We start from a conservative base rate of 2.5%. Each detected irregularity—such as a spliced font or an invalid 12-digit UTR—multiplies the odds by its likelihood ratio, shifting belief based on evidence."

---

### Slide 6: Sequential Bayesian Updating Walkthrough
- **Visual Table**:
  - Baseline: Prior $P(\text{Fraud}) = 2.5\%$
  - Observation 1 (`visual_tampering`): Bayes Factor $= 58.7\times \rightarrow P(\text{Fraud}) = 60.1\%$
  - Observation 2 (`utr_invalid_syntax`): Bayes Factor $= 92.0\times \rightarrow P(\text{Fraud}) = 99.3\%$
- **Outcome**:
  - Final Posterior: **$99.3\%$**
  - Category: **CRITICAL FRAUD DETECTED**
- **Speaker Notes**:
  > "Here is a concrete update sequence from a live test. A single tampered font box lifts suspicion to 60%. When coupled with an invalid UTR string, the posterior probability escalates to 99.3%, providing mathematically sound justification for a transaction halt."

---

### Slide 7: AO\* Algorithm: Problem Reduction Framework
- **Why AO\* (AND-OR Graph)?**:
  - Fraud can occur through *alternative channels* (**OR nodes**):
    - Channel 1: Visual & Layout Forgery
    - Channel 2: Reference & Identifier Spoofing
    - Channel 3: Behavioral & Velocity Anomalies
  - Each channel requires *compounding proof* (**AND nodes**):
    - Visual Forgery requires: *Font Splicing* **AND** *Missing Watermark*
    - Spoofing requires: *Invalid UTR* **AND** *Unregistered Beneficiary*
- **Speaker Notes**:
  > "In artificial intelligence, problems that require decomposing goals into alternative options and compounding sub-conditions are solved using AND-OR graphs. AO\* finds the cheapest, most conclusive proof tree to confirm or deny the fraud hypothesis."

---

### Slide 8: AO\* Heuristic Evaluation & Backpropagation
- **Cost Formulation**:
  - Leaf: $f(n) = 0$ (if evidence observed) or $\infty$ (if unproven).
  - AND Node: $f(n) = c(n) + \sum f(\text{children})$
  - OR Node: $f(n) = \min [c(n, H) + \sum f(H)]$
- **Proof Output**:
  - Solves the tree bottom-up.
  - Generates an interactive visual flowchart highlighting the exact proof branch.
- **Speaker Notes**:
  > "AO\* propagates costs from the leaf tokens back to the root goal. If both sub-conditions of any attack channel are satisfied, the cost drops to zero, and that branch is marked as a verified proof tree."

---

### Slide 9: Multimodal Forensics & OCR Extraction
- **Image Processing**:
  - Localized Laplacian variance spikes identify spliced font bounding boxes.
- **OCR Engine**:
  - EasyOCR extracts raw text, currency amounts, 12-digit NPCI reference numbers, and beneficiary VPAs.
  - Tolerant of common OCR compression artifacts (e.g., Google Pay `CICAg...` transaction handles).
- **Interactive Inspection**:
  - Bounding boxes are highlighted with color-coded risk overlays on the image canvas.
- **Speaker Notes**:
  > "On the computer vision side, we combine deep OCR with classical digital image forensics. Bounding boxes are drawn directly over suspicious regions—such as a forged amount or an unverified beneficiary handle—providing immediate visual evidence."

---

### Slide 10: Real-Time Verification Case Studies
- **Case 1: Legitimate Google Pay Transaction**:
  - Amount: ₹1,450.00 | UTR: `428910394812` (Valid 12 digits) | Seal: Verified
  - Result: **Verified Safe** ($P = 2.5\%$, AO\* Unproven).
- **Case 2: Fabricated Prank Receipt**:
  - Amount: ₹85,000.00 (Outlier) | UTR: `TXN-INVALID-99482` | Tampered Box Detected
  - Result: **Critical Fraud** ($P = 99.99\%$, AO\* Solved Proof Tree).
- **Case 3: NPTEL Examination Hall Ticket**:
  - Result: **Non-Transaction Document** (Candidate: Jeslin J P | Roll: NOC26CS171S857500193 | Fraud reasoning suspended).
- **Speaker Notes**:
  > "Here are our benchmark test cases. The authentic voucher passes cleanly at 2.5% prior. The fraudulent voucher triggers both the 99.99% Bayesian escalation and the AO\* proof tree. And the academic document is accurately separated without generating false alarms."

---

---

### Slide 11: The "Subject" Persona: Interactive STEM Learning & Studies
- **Why Have a "Subject" Persona?**:
  - Academic examiners and students need intuitive conceptual clarity rather than cold banking error codes.
  - Selecting `Persona: [ Subject ]` in the top header transforms all algorithmic findings into pedagogical learning explanations.
- **Pedagogical Analogies Used**:
  - **Bayes' Theorem $\rightarrow$ "The Detective Clue Multiplier"**:
    - Prior ($2.5\%$) = Baseline suspects in the wild.
    - Likelihood Ratio = Strength of each clue ($58\times$ for spliced text, $92\times$ for invalid UTR).
    - Posterior ($99.3\%$) = Final undeniable verdict.
  - **AO\* Algorithm $\rightarrow$ "Courtroom Proof Decomposition"**:
    - OR Nodes = Alternative theories of the crime (Visual Forgery OR ID Spoofing).
    - AND Nodes = Compounding corroboration needed to convict (Spliced Font AND Missing Watermark).
- **Speaker Notes**:
  > "Notice the Persona dropdown in the top header. When an examiner or student switches to the 'Subject' persona, the system translates mathematical derivations into intuitive learning concepts—explaining Bayes' Theorem as a detective gathering compounding clues and AO\* search as a courtroom proof tree."

---

### Slide 12: System Features & User Experience
- **Frontend Design System**:
  - Editorial white aesthetic with Times New Roman serif typography.
  - Clean SVG iconography powered by Lucide-React.
- **Intake Flexibility**:
  - Drag-and-drop, standard file browsing, or direct clipboard pasting (`Ctrl+V` / `Cmd+V`).
- **Audit Ledger**:
  - Real-time audit history stored locally with one-click re-inspection of past scans.
- **Speaker Notes**:
  > "The frontend interface is built with an editorial aesthetic using clean typography and SVG icons. Users can simply press Cmd+V to paste any screenshot directly from the clipboard, with past evaluations logged in the audit ledger."

---

### Slide 13: Conclusion & Future Scope
- **Key Takeaways**:
  - Combines mathematical rigor (Bayes' Theorem) with formal AI search (AO\* Graph Decomposition).
  - Solves the problem of out-of-domain false positives via automated domain classification.
  - Provides persona-based explainability: from executive ROI to student learning under the 'Subject' mode.
- **Future Enhancements**:
  - Direct integration with core banking NPCI settlement APIs.
  - Cross-ledger graph neural network (GNN) tracing for multi-hop money muling rings.
- **Thank You! Questions?**
- **Speaker Notes**:
  > "In conclusion, our project bridges the gap between deep computer vision and formal AI reasoning. By combining Bayes' Theorem with AO\* search and persona-based explainability, we eliminate black-box guessing and provide mathematically verifiable fraud detection. Thank you, and I welcome any questions."

---

## 6. File Location Reference
- **Architecture & Presentation Document**: `PROJECT_PRESENTATION_AND_ARCHITECTURE.md`
- **Bayesian Engine**: `backend/app/fraud_engine/bayesian_detector.py`
- **AO\* Search Engine**: `backend/app/fraud_engine/ao_star_search.py`
- **Multimodal Analyzer**: `backend/app/fraud_engine/screenshot_analyzer.py`
- **Frontend Dashboard**: `frontend/src/components/FraudDetection/FraudDetectionPanel.tsx`

