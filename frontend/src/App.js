import { useState } from "react";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Notification from "./components/Notification";
import Home from "./components/Dashboard";
import Query from "./components/SPARQLQuery";
import ClassEditor from "./components/InferenceEditor";
import Graph from "./components/Graph"

export default function App() {
  const [view, setView] = useState("home");
  const [notification, setNotification] = useState({ message: "", type: "" });

  const renderView = () => {
    if (view === "home") return <Home setNotification={setNotification}/>;
    if (view === "query") return <Query setNotification={setNotification} />;
    if (view === "editor") return <ClassEditor setNotification={setNotification} />;
    if (view === "graph") return <Graph />;
    return null;
  };

  return (
    <div className="app-layout">
      <Sidebar setView={setView} />
      <div className="main-content">
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification({ message: "", type: "" })}
        />
        {renderView()}
      </div>
    </div>
  );
}
