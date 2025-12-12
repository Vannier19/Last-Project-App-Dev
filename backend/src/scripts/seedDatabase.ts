import * as admin from 'firebase-admin';
import * as path from 'path';

// Load Service Account
const serviceAccountPath = path.resolve(__dirname, '../../serviceAccountKey.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- DATA MATERI FISIKA ---
const materialsData = [
  {
    title: "Uniform Linear Motion",
    type: "article",
    content: `# Uniform Linear Motion

## Definition
Uniform Linear Motion is the motion of an object along a straight path with constant velocity. In uniform linear motion, the object covers equal distances in equal time intervals.

## Characteristics:
- Straight path
- Constant velocity (unchanging)
- Acceleration = 0
- No net force acting on the object

## Formula:
**v = s / t**

Where:
- v = velocity (m/s)
- s = distance (m)
- t = time (s)

Or it can be written as:
**s = v × t**

## Graphs:
- s-t graph (distance vs time): Straight line sloping upward
- v-t graph (velocity vs time): Horizontal straight line

## Example Problem:
A car moves at a speed of 72 km/h. How far does the car travel in 10 seconds?

**Solution:**
v = 72 km/h = 72 × (1000/3600) = 20 m/s
t = 10 s
s = v × t = 20 × 10 = 200 m

Therefore, the car travels 200 meters.`,
    order: 1
  },
  {
    title: "Uniformly Accelerated Linear Motion",
    type: "video",
    videoUrl: "https://www.youtube.com/watch?v=dummy_glbb", 
    content: `# Uniformly Accelerated Linear Motion

## Definition
Uniformly Accelerated Linear Motion is the motion of an object along a straight path with constant acceleration. In this motion, the object's velocity changes uniformly.

## Types:
1. **Accelerated Motion**: Velocity increases (a > 0)
2. **Decelerated Motion**: Velocity decreases (a < 0)

## Formulas:

**1. Final velocity:**
vt = v0 + at

**2. Distance traveled:**
s = v0·t + ½·a·t²

**3. Velocity without time:**
vt² = v0² + 2as

Where:
- vt = final velocity (m/s)
- v0 = initial velocity (m/s)
- a = acceleration (m/s²)
- t = time (s)
- s = distance (m)

## Graphs:
- v-t graph: Straight line sloping (upward for acceleration, downward for deceleration)
- s-t graph: Parabola
- a-t graph: Horizontal straight line

## Example Problem:
A car initially at rest is accelerated at 2 m/s². What is the car's velocity after 5 seconds?

**Solution:**
v0 = 0 m/s
a = 2 m/s²
t = 5 s
vt = v0 + at = 0 + (2)(5) = 10 m/s

Therefore, the car's velocity after 5 seconds is 10 m/s.`,
    order: 2
  },
  {
    title: "Free Fall Motion",
    type: "article",
    content: `# Free Fall Motion

## Definition
Free Fall Motion is the motion of an object falling from a certain height without initial velocity, influenced only by Earth's gravitational force. Air resistance is neglected.

## Characteristics:
- Initial velocity (v0) = 0
- Straight vertical downward motion
- Acceleration = gravitational acceleration (g = 10 m/s² or 9.8 m/s²)
- Type of uniformly accelerated motion

## Formulas:

**1. Velocity at time t:**
vt = g·t

**2. Height traveled:**
h = ½·g·t²

**3. Velocity at height h:**
vt² = 2·g·h

Where:
- vt = final velocity (m/s)
- g = gravitational acceleration (10 m/s²)
- t = time (s)
- h = height (m)

## Energy in Free Fall:
- Potential Energy: Ep = m·g·h
- Kinetic Energy: Ek = ½·m·v²
- Mechanical Energy: Em = Ep + Ek (constant)

## Example Problem:
A stone is dropped from a building 80 meters high. What is the stone's velocity when it hits the ground? (g = 10 m/s²)

**Solution:**
h = 80 m
g = 10 m/s²
vt² = 2·g·h = 2·10·80 = 1600
vt = √1600 = 40 m/s

Therefore, the stone's velocity when hitting the ground is 40 m/s.`,
    order: 3
  },
  {
    title: "Projectile Motion",
    type: "lab",
    content: `# Projectile Motion

## Definition
Projectile Motion is a two-dimensional motion of an object that forms a parabolic trajectory due to initial velocity and gravitational influence. This motion is a combination of uniform linear motion on the horizontal axis and uniformly accelerated motion on the vertical axis.

## Characteristics:
- Parabolic trajectory
- X-axis (horizontal): Uniform motion with vx = constant
- Y-axis (vertical): Uniformly accelerated motion with acceleration = -g
- Time ascending = time descending
- Velocity at the highest point has only horizontal component

## Initial Velocity Components:
- vx = v0·cos θ (horizontal component)
- vy = v0·sin θ (vertical component)

## Formulas:

**1. Time to reach maximum height:**
t = (v0·sin θ) / g

**2. Total time in air:**
total = (2·v0·sin θ) / g

**3. Maximum height:**
hmax = (v0²·sin² θ) / (2g)

**4. Maximum horizontal distance (range):**
xmax = (v0²·sin 2θ) / g

**5. Position at time t:**
- x = v0·cos θ·t
- y = v0·sin θ·t - ½·g·t²

Where:
- v0 = initial velocity (m/s)
- θ = elevation angle (degrees)
- g = gravitational acceleration (10 m/s²)

## Angle for Maximum Range:
Maximum range is achieved at an elevation angle of **45°**

## Example Problem:
A ball is kicked at a velocity of 20 m/s with an elevation angle of 30°. What is the maximum horizontal distance of the ball? (g = 10 m/s²)

**Solution:**
v0 = 20 m/s
θ = 30°
g = 10 m/s²
xmax = (v0²·sin 2θ) / g
xmax = (20²·sin 60°) / 10
xmax = (400·0.866) / 10 = 34.64 m

Therefore, the maximum horizontal distance is approximately 34.64 meters.`,
    order: 4
  }
];

async function seed() {
  try {
    console.log("🌱 Clearing old data & Inserting Physics materials...");

    const materialBatch = db.batch();
    const materialIds: string[] = [];

    // 1. Insert Materials
    for (const mat of materialsData) {
      const ref = db.collection('materials').doc();
      materialBatch.set(ref, { ...mat, createdAt: new Date() });
      materialIds.push(ref.id);
      console.log(`- Material '${mat.title}' prepared.`);
    }

    // 2. Insert Quizzes for all materials
    
    // Quiz for Uniform Linear Motion (Index 0)
    const quizGLB = db.collection('quizzes').doc();
    materialBatch.set(quizGLB, {
      materialId: materialIds[0],
      questions: [
        {
          question: "What is the main requirement for an object to be in uniform linear motion?",
          options: ["Velocity changes", "Zero acceleration", "Curved path", "Time stops"],
          correctAnswer: 1
        },
        {
          question: "What is the shape of the v-t graph for uniform linear motion?",
          options: ["Straight line sloping upward", "Horizontal straight line", "Parabola", "Irregular"],
          correctAnswer: 1
        },
        {
          question: "A car moves at 20 m/s. How far does it travel in 5 seconds?",
          options: ["50 m", "75 m", "100 m", "125 m"],
          correctAnswer: 2
        },
        {
          question: "In uniform linear motion, the object's acceleration is?",
          options: ["Negative", "Zero", "Positive", "Variable"],
          correctAnswer: 1
        },
        {
          question: "What is the velocity formula for uniform linear motion?",
          options: ["v = s + t", "v = s / t", "v = s × t", "v = t / s"],
          correctAnswer: 1
        }
      ]
    });
    console.log(`- Quiz for Uniform Linear Motion prepared.`);

    // Quiz for Uniformly Accelerated Motion (Index 1)
    const quizGLBB = db.collection('quizzes').doc();
    materialBatch.set(quizGLBB, {
      materialId: materialIds[1],
      questions: [
        {
          question: "In uniformly accelerated linear motion, which quantity remains constant?",
          options: ["Velocity", "Acceleration", "Distance", "Time"],
          correctAnswer: 1
        },
        {
          question: "What is the formula to find final velocity in uniformly accelerated motion?",
          options: ["vt = v0 - at", "vt = v0 + at", "vt = v0 × at", "vt = v0 / at"],
          correctAnswer: 1
        },
        {
          question: "A car initially at rest is accelerated at 4 m/s². What is its velocity after 5 seconds?",
          options: ["10 m/s", "15 m/s", "20 m/s", "25 m/s"],
          correctAnswer: 2
        },
        {
          question: "What is the shape of the velocity-time (v-t) graph for accelerated motion?",
          options: ["Horizontal line", "Straight line sloping upward", "Straight line sloping downward", "Parabola"],
          correctAnswer: 1
        },
        {
          question: "Decelerated motion has acceleration?",
          options: ["a > 0", "a = 0", "a < 0", "a = constant positive"],
          correctAnswer: 2
        }
      ]
    });
    console.log(`- Quiz for Uniformly Accelerated Motion prepared.`);

    // Quiz for Free Fall Motion (Index 2)
    const quizGJB = db.collection('quizzes').doc();
    materialBatch.set(quizGJB, {
      materialId: materialIds[2],
      questions: [
        {
          question: "What is the initial velocity of an object in free fall?",
          options: ["10 m/s", "5 m/s", "0 m/s", "Depends on height"],
          correctAnswer: 2
        },
        {
          question: "The acceleration in free fall is equal to?",
          options: ["Gravitational acceleration", "Zero", "Initial velocity", "Object's mass"],
          correctAnswer: 0
        },
        {
          question: "An object falls from a height of 45 meters. How long does it take to reach the ground? (g = 10 m/s²)",
          options: ["2 seconds", "3 seconds", "4 seconds", "5 seconds"],
          correctAnswer: 1
        },
        {
          question: "What is the velocity formula for free fall motion?",
          options: ["v = g + t", "v = g × t", "v = g / t", "v = t / g"],
          correctAnswer: 1
        },
        {
          question: "Free fall motion is classified as?",
          options: ["Uniform linear motion", "Uniformly accelerated motion", "Uniformly decelerated motion", "Circular motion"],
          correctAnswer: 1
        }
      ]
    });
    console.log(`- Quiz for Free Fall Motion prepared.`);

    // Quiz for Projectile Motion (Index 3)
    const quizParabola = db.collection('quizzes').doc();
    materialBatch.set(quizParabola, {
      materialId: materialIds[3],
      questions: [
        {
          question: "Projectile motion is a combination of?",
          options: ["Vertical uniform motion and horizontal accelerated motion", "Horizontal uniform motion and vertical accelerated motion", "Vertical and horizontal accelerated motion", "Vertical and horizontal uniform motion"],
          correctAnswer: 1
        },
        {
          question: "What is the elevation angle for maximum range?",
          options: ["30°", "45°", "60°", "90°"],
          correctAnswer: 1
        },
        {
          question: "At the highest point of projectile motion, the vertical velocity is?",
          options: ["Maximum", "Minimum", "Zero", "Equal to initial velocity"],
          correctAnswer: 2
        },
        {
          question: "The horizontal velocity component in projectile motion is?",
          options: ["Variable", "Constant", "Zero", "Decreasing"],
          correctAnswer: 1
        },
        {
          question: "The trajectory of projectile motion has the shape of?",
          options: ["Straight line", "Circle", "Parabola", "Ellipse"],
          correctAnswer: 2
        }
      ]
    });
    console.log(`- Quiz for Projectile Motion prepared.`);

    await materialBatch.commit();
    console.log("✅ Database successfully populated with Physics materials!");
    process.exit(0);

  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();