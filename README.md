# 🚀 ProcureAI - Intelligent Procurement Platform

![ProcureAI Banner](client/public/og-image.png)

**ProcureAI** is a next-generation SaaS platform designed to transform enterprise procurement. By leveraging artificial intelligence, it automates the entire lifecycle from requisition to payment, providing real-time spend analysis, supplier scoring, and intelligent workflow automation.

## ✨ Key Features

- **🤖 AI-Powered Spend Analysis**: Automatically categorize transactions and identify cost-saving opportunities.
- **⚡ Smart Workflows**: customizable approval chains that adapt based on spend thresholds and urgency.
- **🌍 Global Supplier Management**: unified portal for vetting, onboarding, and rating suppliers worldwide.
- **📊 Real-Time Analytics**: comprehensive dashboards for tracking KPI's, including spend velocity and savings realization.
- **🛡️ Enterprise-Grade Security**: Role-based access control (RBAC) and compliance-ready data handling.
- **🎨 Premium UX**: A stunning, responsive interface built with modern design principles (Glassmorphism, Dark Mode, Animations).

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15+](https://nextjs.org/) (App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [Shadcn/UI](https://ui.shadcn.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Theme Management**: [Next-Themes](https://github.com/pacocoursey/next-themes)
- **State Management**: React Context / Hooks
- **Icons**: [Lucide React](https://lucide.dev/)

## 🚀 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn or pnpm

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/procure-ai.git
    cd procure-ai
    ```

2.  **Install dependencies (Client):**

    ```bash
    cd client
    npm install
    ```

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

4.  **Open the application:**
    Visit `http://localhost:3000` in your browser.

## 📂 Project Structure

```
procure-ai/
├── client/                 # Next.js Frontend Application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── app/            # Next.js App Router pages & layouts
│   │   ├── components/     # Reusable UI components
│   │   │   ├── landing/    # Landing page specific components
│   │   │   ├── ui/         # Shadcn/UI primitives
│   │   │   └── ...
│   │   ├── lib/            # Utility functions
│   │   └── ...
│   ├── .gitignore
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── tsconfig.json
├── .gitignore              # Root gitignore
└── README.md               # Project documentation
```

## 🎨 Theme Customization

The application features a robust theming engine supporting multiple palettes:
- **Midnight** (Default Deep Blue)
- **Ocean** (Cyan Accents)
- **Royal** (Magenta Accents)
- **Forest** (Emerald Accents)
- **Sunset** (Orange Accents)

You can switch themes using the floating settings gear in the bottom right corner.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
