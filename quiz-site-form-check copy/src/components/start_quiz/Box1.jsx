import React from 'react';
import Button from './Button';
import styles from './box1.module.css';

const Box1 = ({ level, types }) => {
  return (
    <div className={styles.main}>
      <div className={styles.area}>
        <h2>{level}</h2>
        <p>{types}</p>
        <Button text={level} />
      </div>
    </div>
  );
};

export default Box1;
