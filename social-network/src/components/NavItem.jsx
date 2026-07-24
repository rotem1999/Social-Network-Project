"use client";

import { NavLink } from "react-router-dom";

const NavItem = ({ to, icon: Icon, label, onClick, end = false }) => {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        "flex items-center gap-2 rounded-sm px-3 py-2 mr-2 text-sm font-medium transition " +
        (isActive ? "bg-gray-200" : "hover:bg-gray-100")
      }
    >
      <Icon size={18} />
      {label}
    </NavLink>
  );
};

export default NavItem;
