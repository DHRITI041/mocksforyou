import { Link, useLocation } from 'react-router-dom';
import { BookOpen, CirclePlus as PlusCircle, List } from 'lucide-react';
import styles from './Layout.module.css';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link to="/" className={styles.logo}>
            <BookOpen size={22} />
            <span>MocksForYou</span>
          </Link>
          <nav className={styles.nav}>
            <Link
              to="/exams"
              className={`${styles.navLink} ${location.pathname === '/exams' ? styles.navLinkActive : ''}`}
            >
              <List size={16} />
              All Exams
            </Link>
            <Link to="/exams/create" className={styles.createBtn}>
              <PlusCircle size={16} />
              Create Exam
            </Link>
          </nav>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
