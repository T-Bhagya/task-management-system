import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Task Board", path: "/tasks" },
  ];

  return (
    <div
      style={{
        width: "240px",
        height: "100vh",
        background: "#111827",
        color: "white",
        padding: "20px",
      }}
    >
      <h2 style={{ marginBottom: "30px" }}>TMS</h2>

      {menuItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            display: "block",
            padding: "12px",
            marginBottom: "10px",
            borderRadius: "8px",
            textDecoration: "none",
            color: "white",
            background:
              location.pathname === item.path
                ? "#6366f1"
                : "transparent",
          }}
        >
          {item.name}
        </Link>
      ))}
    </div>
  );
}