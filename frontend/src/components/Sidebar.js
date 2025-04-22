import React from "react";

export default function Sidebar({ setView }) {
  return (
    <div className="sidebar">
      <div className="logo">
        <img src="/graph-svgrepo-com.svg" alt="Logo" className="logo-img" />
        <p>BP Semantic Blockchain</p>
      </div>
      <nav className="nav-buttons">
        <button onClick={() => setView("home")}>Dashboard</button>
        <button onClick={() => setView("query")}>SPARQL Query</button>
        <button onClick={() => setView("editor")}>Inference Editor</button>
      </nav>
    </div>
  );
}
