import { Link } from 'react-router-dom';
import { BookOpen, CirclePlus as PlusCircle, List, Minus, CircleCheck as CheckCircle, Clock } from 'lucide-react';
import styles from './HomePage.module.css';

export default function HomePage() {
  return (
    <div className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.badge}>
            <BookOpen size={14} />
            Professional Exam Platform
          </div>
          <h1 className={styles.heroTitle}>
            Create & Conduct Exams<br />
            <span className={styles.heroAccent}>with Negative Marking</span>
          </h1>
          <p className={styles.heroDesc}>
            Build comprehensive mock exams, configure negative marking to discourage guessing,
            and get detailed performance analytics for every student.
          </p>
          <div className={styles.heroCta}>
            <Link to="/exams/create" className={styles.ctaPrimary}>
              <PlusCircle size={18} />
              Create New Exam
            </Link>
            <Link to="/exams" className={styles.ctaSecondary}>
              <List size={18} />
              Browse Exams
            </Link>
          </div>
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Exam Settings</span>
              <span className={styles.cardBadge}>Draft</span>
            </div>
            <div className={styles.settingRow}>
              <span>Duration</span>
              <strong>90 min</strong>
            </div>
            <div className={styles.settingRow}>
              <span>Questions</span>
              <strong>50 MCQs</strong>
            </div>
            <div className={styles.settingRow}>
              <span>Marks / Question</span>
              <strong>+4</strong>
            </div>
            <div className={`${styles.settingRow} ${styles.settingHighlight}`}>
              <span className={styles.negLabel}>
                <Minus size={14} /> Negative Marking
              </span>
              <span className={styles.toggleOn}>ON &bull; -1</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <h2 className={styles.featuresTitle}>Everything you need to run great exams</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconBlue}`}>
              <PlusCircle size={22} />
            </div>
            <h3>Build Exams Easily</h3>
            <p>Add multiple-choice questions with custom marks per question and set a time limit.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconAmber}`}>
              <Minus size={22} />
            </div>
            <h3>Negative Marking</h3>
            <p>Toggle negative marking on or off before the exam starts. Set a custom deduction per wrong answer.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconGreen}`}>
              <Clock size={22} />
            </div>
            <h3>Timed Exams</h3>
            <p>Built-in countdown timer automatically submits the exam when time runs out.</p>
          </div>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconTeal}`}>
              <CheckCircle size={22} />
            </div>
            <h3>Detailed Results</h3>
            <p>See correct, wrong, and skipped counts plus full negative marking breakdown after every attempt.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
