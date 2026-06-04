<div align="center">

<h1>🌾 AgroDex 🌾</h1>

<p align="center">
  <b>AgroDex fights food fraud in Indonesia by pairing Hedera’s immutable ledger with Gemini AI for real-time food auditing.</b>
</p>

---

<h3><i>🏆 Winner of Basic Track Problem Statement in Hello Future Hedera Ascension Hackathon 2025 🏆</i></h3>

<img width="700" height=auto alt="AgroDex Dashboard Banner" src="https://github.com/user-attachments/assets/81bd6e83-879e-4319-92d8-38229919ffd5" />

------

<h3><i>🏆 SSOC 2026 Project Selection</i></h3>

We are excited to announce that this project has been officially selected for **Social Summer Of Code (SSOC) 2026**.

</div>

---

## 🌟 Open Source Participation

This project proudly participates in the following open-source programs:

| Program | Program Name | Status |
| :---: | :--- | :--- |
| ♨️ | **Social Summer of Code (SSOC) 2026** | 🟢 Active |

> [!IMPORTANT]
> 💡 We warmly welcome contributors from all the above programs. Please check open issues and follow the contribution guidelines before submitting a PR.
> 
> ⚠️ **Prerequisite:** You should at least understand the basics of Web3/Blockchain development using Hedera. If you do not understand this project architecture, please do not open issues or PRs.

---

## 📖 About The Project

### 🛑 The Problem
Food fraud and missing traceability drain billions from the Indonesian agricultural sector. Farmers cannot prove premium quality (e.g., organic), and buyers cannot verify authenticity, severely hurting industry trust and revenue.

### 🛡️ Our Hedera-Based Solution
**AgroDex** creates a digital twin (NFT) for every crop batch. Every milestone is audited by AI and securely anchored to Hedera to create an immutable, lifelong trail of evidence.

---

## ⚙️ Tech Stack

| Category | Technology | Badge |
| :--- | :--- | :--- |
| **Frontend** | React (Vite) | ![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white) |
| **Language** | TypeScript | ![TypeScript](https://img.shields.io/badge/typescript-%23007acc.svg?style=for-the-badge&logo=typescript&logoColor=white) |
| **Styling** | Tailwind CSS | ![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white) |
| **Backend** | Node.js & Express | ![NodeJS](https://img.shields.io/badge/node.js-%23339933.svg?style=for-the-badge&logo=node.js&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express) |
| **Database** | Supabase | ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white) |
| **Blockchain** | Hedera Hashgraph | ![Hedera](https://img.shields.io/badge/Hedera-000000?style=for-the-badge&logo=hedera&logoColor=white) |
| **Artificial Intelligence** | Google Gemini | ![Gemini](https://img.shields.io/badge/Google%20Gemini-8E75C2?style=for-the-badge&logo=googlegemini&logoColor=white) |

---

## ⛓️ Hedera Integration Summary

We chose Hedera because predictable, low fees are the only sustainable option for low-margin Indonesian logistics.

### 🏛️ Hedera Services Utilized
* **Hedera Consensus Service (HCS):** Every “proof” event (planting, harvest, etc.) is submitted via `TopicMessageSubmitTransaction` to our topic ID, producing a low-cost (~$0.0001) immutable audit log.
* **Hedera Token Service (HTS):** We mint the final certificate as a unique NFT using `TokenCreateTransaction`. HCS transaction IDs are embedded directly into the NFT metadata, structurally binding the asset to its evidence trail.
* **Mirror Nodes:** The Verify page queries Mirror Nodes (via the SDK) to replay the HCS history and seamlessly demonstrate authenticity to buyers and judges.

### 💰 Economic Justification
Widespread adoption in Indonesia demands sub-$1 fees per transaction. Hedera’s fixed, negligible HCS pricing lets us log thousands of logistical events for just a few dollars, keeping the business model completely viable.

---

## ✨ Key Features

### 🔍 Traceability (Powered by Hedera)
* **HCS Logging:** Capture every step of the crop lifecycle transparently.
* **HTS Tokenization:** Mint NFT certificates referencing immutable HCS history.
* **Verification Engine:** Buyers validate authenticity instantly by fetching real-time Mirror Node history.

### 🤖 Intelligence (Powered by Gemini AI)
* **Audit & Trust Score:** AI parses the HCS timeline to yield an objective 0–100 trust rating.
* **Bilingual Summaries:** Automatically generates intuitive provenance summaries in English and Indonesian.
* **Buyer Q&A Chatbot:** Buyers can interact directly with a batch's history; the AI replies with cited HCS transaction IDs.
* **Dashboard Insights:** Real-time business intelligence metrics surfacing on the main admin layout.

---

## 📐 Architecture Diagram

```ascii
[Farmer]
   |
   v
[Frontend (React)] ---- API ----> [Backend (Node.js/Express)]
   |                                 |           |
   |                                 |           v
   |                                 |     [Gemini AI] (Audits & Q&A)
   |                                 |
   |                                 +---- HCS Submit / HTS Mint ----> [Hedera Network]
   |
   |
[Buyer]
   |
   v
[Frontend (React)] ---- API ----> [Backend (Node.js/Express)]
   |                                 |
   |                                 +---- Reads ----> [Hedera Mirror Node]
   |
   +---- Displays proofs <------------+
```

---

## 🚀 Getting Started

This is the instruction about how to get work with this project:

### ⬇️ Installation

<b>1.</b> Clone the Repository
```sh
   git clone https://github.com/daviddprtma/AgroDex
   cd AgroDex
   ```
<b>2.</b> Install Dependencies
   ```sh
   pnpm install
   ```
<b>3.</b> Configure Environment Variables
   ```sh
   cp backend/.env.example backend/.env
   // edit backend/.env and fill:
   // OPERATOR_ID, OPERATOR_KEY, GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
   ```
<b>4.</b> Seed the demo data
   ```sh
   cd backend
   node scripts/seedDemo.js
   ```

### ⚡ Running

<b>5.</b> Run the application
 ```sh
   # Terminal 1 (Backend)
cd backend
pnpm run dev

# Terminal 2 (Frontend)
cd ..
pnpm run dev
   ```

---

## 🛠️ How to Contribute to this Repo?

1. **Star ⭐ and Fork 🍴** this repository.  

2. **Code Contributions:**  
   - Create a new branch based on the type of change *(see [Branch & Commit Conventions](#-branch--commit-conventions))*  
     ```bash
     git checkout -b feature/new-section
     ```
   - Make your code adjustments.  
   - Commit changes following the convention *(see [Branch & Commit Conventions](#-branch--commit-conventions))*.  
   - Open a Pull Request (PR).
  
3. **Maintenance Contributions:**  
   - Address issues like:
     - Extracting embedded images or assets and adding them to `/assets/`.  
     - Moving CSS/JS into separate files.  
     - Updating README or file structure consistency.  
   - Submit your PR under the “maintenance” label.

---

## 🌳 Branch & Commit Conventions

| Type              | Branch Prefix | Commit Prefix | Description                                 |
| ----------------- | ------------- | ------------- | ------------------------------------------- |
| New Feature     | `feature/`    | `feat:`       | Adding new functionality or pages           |
| Bug Fix        | `fix/`        | `fix:`        | Resolving issues or broken behavior         |
| Maintenance    | `chore/`      | `chore:`      | Config updates, repo organization           |
| Documentation | `docs/`       | `docs:`       | Updating docs, README, or guides            |
| UI/UX & Design | `uiux/`       | `design:`     | Design mockups, page revamps, visual tweaks |
| Resources      | `resources/`  | `resource:`   | Adding educational content/resources        |
| Refactor       | `refactor/`   | `refactor:`   | Code improvement without feature change     |
| Style          | `style/`      | `style:`      | CSS fixes, spacing, or formatting changes   |

Example: 
```bash
# Branch
uiux/community-redesign

# Commit
design: revamp Community page layout for better clarity
```

---

## 🗺️ Roadmap

- [v] Q4 2025 - Testnet Prototype
- [] Q1 2026 - Pilot with Co-ops
- [] Q2 2026 - HashConnect Wallet Integration
- [] Q3 2026- Mainnet Launch & Scaling

---

## 📹 Demo Video
Here's the demo video for this project: 
<br> 
[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/8eDvpoJo5As/0.jpg)](https://www.youtube.com/watch?v=8eDvpoJo5As)

---

## 📄 Pitch Deck
For the pitch deck, see it in 👉[AgroDex](https://drive.google.com/file/d/11GCPQooNam1s5ia6bG4XmaHjxkOmFLN9/view?usp=sharing).
