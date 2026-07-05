# Custom Tailor Suite ✂️👗

A lightweight, responsive, full-stack management dashboard designed specifically for bespoke tailoring shops and fashion designers. The system seamlessly handles customer measurement logging, active production tracking, dynamic balance calculations, offline-resilient SMS notifications via Africa's Talking, and receipt printing optimization.

🔗 **Live Deployment:** [https://tailor-i9iw.onrender.com](https://tailor-i9iw.onrender.com)

## 🚀 Key Features

* **Production Workflow Board:** Live tracking of all active tailoring orders with automated status handling.
* **Permanent Client Directory:** A persistent database repository mapping client profiles to their specific structural measurement dimensions (Shoulder, Chest, Sleeve, Waist, Length, etc.).
* **Dynamic Financial Ledger:** Automated calculation of balances due based on total charges and deposits paid, preventing arithmetic mismatches.
* **Background SMS Gateway Integration:** Built-in hooks for Africa's Talking SMS API to queue customer receipt notifications upon order registration.
* **Thermal Print Utility:** One-click receipt generation formatted cleanly in monospace layout for instant processing on thermal invoice or desktop printers.
* **Responsive Media Query Layouts:** Fully optimized viewport scaling for effortless mobile use on smartphones and tablets.

## 🛠️ Technology Stack

* **Frontend:** Semantic HTML5, Custom CSS3 Layouts (Flexbox, Grid, Media Queries), Vanilla JavaScript (Asynchronous Fetch API, DOM manipulation).
* **Backend Node Engine:** Express.js framework implementing RESTful API endpoints.
* **Database Persistence:** NeDB (embedded file-based datastore saving locally to `data/orders.db` and `data/clients.db`).
* **Third-Party Telematics Gateway:** Africa's Talking SDK for programmable cloud communications.

---

## 📂 Project Architecture

```text
Tailor/
├── data/
│   ├── clients.db          # Persistent client records database
│   └── orders.db           # Persistent order tracking database
├── public/
│   ├── app.js              # Client-side dynamic scripting & data-fetching
│   ├── index.html          # Core user interface structure
│   └── styles.css          # Core layouts, styles, and mobile media queries
├── database.js             # NeDB instance configuration setup
├── package.json            # Node.js dependencies configuration
└── server.js               # Express application layer & SMS integration


📦 Local Installation & Setup
To run this project locally on your machine for development or custom modifications:

1. Clone the Repository
Bash
git clone [https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git](https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git)
cd Tailor

2. Install Application Dependencies
Bash
npm install

3. Configure Local Variables (Optional)
Set your keys locally in your command terminal environment or run with your sandbox configurations defined safely.

4. Boot Up the Server Instance
Bash
node server.js

5. Access the System Dashboard
Open your preferred browser window and navigate to:
👉 http://localhost:5000

📝 License
This project is open-source and available under the MIT License. Feel free to customize and tailor it to suit your specific enterprise workflows!
