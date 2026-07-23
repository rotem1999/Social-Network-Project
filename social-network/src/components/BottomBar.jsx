"use client";

import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/", label: "Home", icon: "/home.svg", end: true },
  { to: "/inbox", label: "Inbox", icon: "/inbox.svg" },
  { to: "/account", label: "Account", icon: "/account.svg" },
];

const BottomBar = () => (
  <nav className="fixed inset-x-0 bottom-3 z-30 mx-auto flex w-[92%] max-w-md items-center justify-around rounded-2xl border bg-white/90 p-2 shadow-lg backdrop-blur transition">
    {tabs.map((tab) => (
      <NavLink
        key={tab.to}
        to={tab.to}
        end={tab.end}
        className={({ isActive }) =>
          "flex flex-col items-center rounded-1g px-4 py-1 text-xs transition " +
          (isActive ? "text-orange-600" : "text-gray-500 hover:text-gray-800")
        }
      >
        <img src={tab.icon} alt="" width={22} height={22} />
        {tab.label}
      </NavLink>
    ))}
  </nav>
);

export default BottomBar;
