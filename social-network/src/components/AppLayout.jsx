"use client";

import { useState } from "react";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import GroupsDrawer from "./GroupDrawer";

const AppLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
};

return (
  <div className="min-h-screen">
    <TopBar onMenu={() => setDrawerOpen(true)} />
    <GroupsDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

    <main className="mx-auto max-w-2xl px-4 pt-16 pb-24">
      <Outlet />
    </main>

    <BottomBar />
  </div>
);

export default AppLayout;
