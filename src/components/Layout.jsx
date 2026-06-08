import Sidebar from "./Sidebar";

export default function Layout({ children }) {
  return (
    <div style={{ display: "flex" }}>
      <Sidebar />

      <div
        style={{
          flex: 1,
          background: "#f3f4f6",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </div>
  );
}