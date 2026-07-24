"use client";

import { NavLink, useLocation } from "react-router-dom";

const tabs = [
  { to: "/", label: "Home", icon: "/home.svg", end: true },
  { to: "/inbox", label: "Inbox", icon: "/inbox.svg" },
  { to: "/account", label: "Account", icon: "/account.svg" },
];

const BottomBar = () => {
  const { pathname } = useLocation();
  const activeIndex = tabs.findIndex((tab) =>
    tab.end ? pathname === tab.to : pathname.startsWith(tab.to),
  );
  const cell = 100 / tabs.length;

  return (
    <nav className="fixed inset-x-0 bottom-3 z-30 mx-auto w-[92%] max-w-md">
      <div className="relative flex rounded-2xl border border-white/40 bg-white/20 shadow-lg backdrop-blur-xl">
        {activeIndex >= 0 && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1 rounded-xl border border-white/60 bg-white/40 shadow-sm backdrop-blur-md transition-all duration-300 ease-out"
            style={{
              width: `calc(${cell}% - 0.5rem)`,
              left: `calc(${activeIndex * cell}% + 0.25rem)`,
            }}
          />
        )}
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.end}
            className={({ isActive }) =>
              "relative z-10 flex flex-1 flex-col items-center rounded-xl px-2 py-2 text-xs transition " +
              (isActive
                ? "text-orange-600"
                : "text-gray-500 hover:text-gray-800")
            }
          >
            <img src={tab.icon} alt="" width={22} height={22} />
            {tab.label}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomBar;
