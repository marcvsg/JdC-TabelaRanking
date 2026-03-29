import type { ReactNode } from 'react';
import { useAuthContext } from '../context/AuthContext';

import topLeft from '../assets/Header/977_blk_window.top.left.png';
import topMiddle from '../assets/Header/978_blk_window.top.middle.png';
import topRight from '../assets/Header/979_blk_window.top.right.png';
import midLeft from '../assets/Header/973_blk_window.middle.left.png';
import midMiddle from '../assets/Header/974_blk_window.middle.middle.png';
import midRight from '../assets/Header/975_blk_window.middle.right.png';
import botLeft from '../assets/Header/970_blk_window.bottom.left.png';
import botMiddle from '../assets/Header/971_blk_window.bottom.middle.png';
import botRight from '../assets/Header/972_blk_window.bottom.right.png';
import logo from '../assets/imgs/logo.gif';

export function Layout({ children }: { children: ReactNode }) {
  const { user, role, logout } = useAuthContext();

  return (
    <div className="layout">
      <header className="habbo-header">
        {/* 9-slice border */}
        <div className="habbo-border">
          <img src={topLeft} className="slice tl" alt="" />
          <div className="slice tm" style={{ backgroundImage: `url(${topMiddle})` }} />
          <img src={topRight} className="slice tr" alt="" />

          <div className="slice ml" style={{ backgroundImage: `url(${midLeft})` }} />
          <div className="slice mm" style={{ backgroundImage: `url(${midMiddle})` }} />
          <div className="slice mr" style={{ backgroundImage: `url(${midRight})` }} />

          <img src={botLeft} className="slice bl" alt="" />
          <div className="slice bm" style={{ backgroundImage: `url(${botMiddle})` }} />
          <img src={botRight} className="slice br" alt="" />
        </div>

        {/* Content on top of the 9-slice */}
        <div className="habbo-header-content">
          <img src={logo} alt="Dashboard" />
          <div className="header-right">
            <span
              className={`badge ${role === 'admin' ? 'badge-admin' : 'badge-viewer'}`}
            >
              {role === 'admin' ? 'Admin' : 'Viewer'}
            </span>
            <span className="header-email">{user?.email}</span>
            <button onClick={logout} className="btn-link">
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">{children}</main>
    </div>
  );
}
