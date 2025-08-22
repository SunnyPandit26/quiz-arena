import React from 'react';
import styles from './button.module.css';

const Button = ({ text }) => {
  return (
    <div className={styles.div}>
      <button className={styles.btn}>{text}</button>
    </div>
  );
};

export default Button;
