// src/components/Cards.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Card from "./Card";
import styles from "./cards.module.css";

const courses = [
  {
    id: "python",
    title: "Python",
    description:
      "Learn programming fundamentals such as variables, control flow, and loops with the...",
    level: "Programming Language",
    imageUrl: "./images/pythonlogo.jpg",
    backgroundImage:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSMZZ5wz4Dxzc0mXLqyt0ysPMPr3fjcospbvcSuBpKLt-z5Kcf10qyfD-XE6VTOC3yWCFc&usqp=CAU",
    category: ["Popular", "Tools","All"],
  },
  {
    id: "java",
    title: "Java",
    description: "Master object-oriented programming with Java...",
    level: "Programming Language",
    imageUrl: "./images/javalogo.jpeg",
    backgroundImage: "./images/java.png",
    category: ["Popular","All"],
  },
  {
    id: "webdev",
    title: "Web Development",
    description: "Build modern websites with HTML, CSS, and JavaScript...",
    level: "Full Stack Development",
    imageUrl: "./images/web dev.jpg",
    backgroundImage: "./images/photo1.jpg",
    category: ["Web Development","All"],
  },
  {
    id: "r",
    title: "R Programming",
    description: "Data analysis and statistical computing...",
    level: "Data Science",
    imageUrl: "./images/R.jpeg",
    backgroundImage: "./images/photo2.jpg",
    category: ["Data Science","All"],
  },
  {
    id: "julia",
    title: "Julia",
    description: "High-performance scientific computing...",
    level: "Scientific Computing",
    imageUrl: "./images/julia.gif",
    backgroundImage: "./images/photo3.jpg",
    category: ["Data Science","All"],
  },
  {
    id: "cpp",
    title: "C++",
    description: "System programming and performance optimization...",
    level: "System Programming",
    imageUrl: "./images/c++.jpg",
    backgroundImage: "./images/photo4.jpg",
    category: ["Tools","All"],
  },
];

const categories = ["All","Popular", "Web Development", "Data Science", "Tools"];

export default function Cards() {
  const navigate = useNavigate();
  const { requireAuth } = useAuth();
  const [activeCategory, setActiveCategory] = useState("All");

  const goToLevels = (subject) => {
    requireAuth(() => {
      navigate(`/start/${encodeURIComponent(subject)}`);
    });
  };

  const filteredCourses = courses.filter((course) =>
    course.category.includes(activeCategory)
  );

  return (
    <>
      <div className={styles.filterButtons}>
        {categories.map((category) => (
          <button
            key={category}
            className={`${styles.filterBtn} ${
              activeCategory === category ? styles.activeFilterBtn : ""
            }`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <section className={styles.grid}>
        {filteredCourses.map((course) => (
          <Card
            key={course.id}
            title={course.title}
            description={course.description}
            level={course.level}
            imageUrl={course.imageUrl}
            backgroundImage={course.backgroundImage}
            onStart={() => goToLevels(course.id)}
          />
        ))}
      </section>
    </>
  );
}
