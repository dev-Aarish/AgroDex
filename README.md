<h3 align="center">Winner of Basic Track Problem Statement in Hello Future Hedera Ascension Hackathon 2025 🏆 </h3>
<img width="1538" height="674" alt="image" src="https://github.com/user-attachments/assets/81bd6e83-879e-4319-92d8-38229919ffd5" />

<br/>
<div align="center">

<h3 align="center">AgroDex</h3>
<p align="center">
AgroDex fights food fraud in Indonesian by pairing Hedera’s immutable ledger with Gemini AI for auditing in real-time food.
</p>
</div>

## 🏆 SSOC 2026 Project Selection

We are excited to announce that this project has been officially selected for **Social Summer Of Code (SSOC) 2026**.


# 🌟 Open Source Participation

This project proudly participates in the following open-source programs:

| Program | Program Name | Status |
|---------|--------------|--------|
| ♨️ | **Social Summer of Code (SSOC) 2026** | Active |

> 💡 We warmly welcome contributors from all the above programs.  
Please check open issues and follow the contribution guidelines before submitting a PR.
> 
## About The Project

The Problem
<br>
Food fraud and missing traceability drain billions from Indonesian agricultural sector. Farmers cannot prove premium quality (e.g., organic), and buyers cannot verify authenticity, hurting trust and revenue.

Our Hedera-Based Solution offer AgroDex to creates a digital twin (NFT) for every batch, audited by AI and anchored to Hedera for an immutable trail of evidence.

## Hedera Integration Summary (Required)
We chose Hedera because predictable, low fees are the only sustainable option for low-margin Indonesian logistics.

Hedera Services Utilized
Hedera Consensus Service (HCS): Every “proof” event (planting, harvest, etc.) is submitted via TopicMessageSubmitTransaction to our topic ID, producing a low-cost (~$0.0001) immutable audit log.
Hedera Token Service (HTS): We mint the final certificate as a unique NFT using TokenCreateTransaction.HCS transaction IDs are embedded in the NFT metadata, binding the asset to its evidence trail.
Mirror Nodes: The Verify page queries Mirror Nodes (via the SDK) to replay the HCS history and demonstrate authenticity to judges and buyers.
Economic Justification
Adoption in Indonesia demands sub-$1 fees per transaction. Hedera’s fixed, negligible HCS pricing lets us log thousands of events for a few dollars, keeping the business model viable.

## Key Features
## Traceability (Hedera)
- HCS Logging: Capture every lifecycle event on Hedera Consensus Service.
- HTS Tokenization: Mint NFT certificates that reference the HCS history.
- Verification: Buyers validate authenticity by reading the full Mirror Node history.
## Intelligence (Gemini AI)
- Audit & Trust Score: AI reviews the HCS timeline to produce a 0–100 trust score.
- Bilingual Summaries: Generates provenance summaries in English.
- Buyer Q&A Chatbot: Buyers “talk” to the batch history; AI answers with cited HCS transaction IDs.
- Dashboard Insight: AI provides real-time business insights that surface on the main dashboard.

## Architecture Diagram
```ascii
[Farmer]
   |
   v
[Frontend (React)] ---- API ----> [Backend (Node.js/Express)]
   |                                    |           |
   |                                    |           v
   |                                    |     [Gemini AI] (Audits & Q&A)
   |                                    |
   |                                    +---- HCS Submit / HTS Mint ----> [Hedera Network]
   |
   |
[Buyer]
   |
   v
[Frontend (React)] ---- API ----> [Backend (Node.js/Express)]
   |                                    |
   |                                    +---- Reads ----> [Hedera Mirror Node]
   |
   +---- Displays proofs <------------+
```


## Deployed on Hedera IDs (Testnet)
- Operator Account: 0.0.7147874
- Topic ID (HCS): 0.0.7206092
- Demo Token ID (HTS): 0.0.7245654 (serial #1)


### Built With

- [React(Vite)](https://vite.dev/guide/)
- [Typescript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Nodejs](https://nodejs.org/en)
- [Express](https://expressjs.com/)
- [Supabase](https://supabase.com/)
- [Hedera Hashgraph SDK](https://docs.hedera.com/hedera/sdks-and-apis/sdks)
- [Google Gemini](https://aistudio.google.com/)
## Getting Started

This is the instruction about how to get work with this project:
### Installation

1. Clone the Repository
```sh
   git clone https://github.com/daviddprtma/AgroDex
   cd AgroDex
   ```
2. Install Dependencies
   ```sh
   pnpm install
   ```
3. Configure Environment Variables
   ```sh
   cp backend/.env.example backend/.env
   // edit backend/.env and fill:
   // OPERATOR_ID, OPERATOR_KEY, GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY
   ```
4. Seed the demo data
   ```sh
   cd backend
   node scripts/seedDemo.js
   ```
5. Run the application
 ```sh
   # Terminal 1 (Backend)
cd backend
pnpm run dev

# Terminal 2 (Frontend)
cd ..
pnpm run dev
   ```
## Roadmap

- [v] Q4 2025 - Testnet Prototype
- [] Q1 2026 - Pilot with Co-ops
- [] Q2 2026 - HashConnect Wallet Integration
- [] Q3 2026- Mainnet Launch & Scaling

## Demo Video
Here's the demo video for this project: 
<br> 
[![IMAGE ALT TEXT HERE](https://img.youtube.com/vi/8eDvpoJo5As/0.jpg)](https://www.youtube.com/watch?v=8eDvpoJo5As)

## Pitch Deck
For the pitch deck, see it in 👉[AgroDex](https://drive.google.com/file/d/11GCPQooNam1s5ia6bG4XmaHjxkOmFLN9/view?usp=sharing).
